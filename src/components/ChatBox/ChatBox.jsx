import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { db } from '../../config/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import './ChatBox.css';
import assets from '../../assets/assets';

const ChatBox = () => {
  const { selectedChat, userData } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef();

  // Real-time messages
  useEffect(() => {
    if (!selectedChat?.messageId) return;
    const messagesRef = doc(db, "messages", selectedChat.messageId);
    const unsubscribe = onSnapshot(messagesRef, (snap) => {
      if (snap.exists()) {
        const msgs = snap.data().messages || [];
        setMessages(msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      }
    });
    return () => unsubscribe();
  }, [selectedChat]);

  // Typing indicator
  useEffect(() => {
    if (!selectedChat?.messageId) return;
    const typingRef = doc(db, "typing", selectedChat.messageId);
    const unsubscribe = onSnapshot(typingRef, (snap) => {
      if (snap.exists()) setTyping(snap.data().typingBy === selectedChat.rId);
      else setTyping(false);
    });
    return () => unsubscribe();
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;
    let imageUrl = '';

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'chatapp');

        const res = await fetch('https://api.cloudinary.com/v1_1/dfraet6gd/image/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        imageUrl = data.secure_url;
      } catch (err) {
        console.error('Image upload failed:', err);
        return;
      }
    }

    const messagesRef = doc(db, "messages", selectedChat.messageId);
    const messageData = {
      senderId: userData.id,
      text: newMessage || '',
      image: imageUrl || '',
      timestamp: Date.now(),
      read: false,
      deleted: false
    };

    try {
      await updateDoc(messagesRef, {
        messages: arrayUnion(messageData),
        lastMessage: messageData,
        lastUpdated: Date.now()
      });

      setNewMessage('');
      setImageFile(null);

      // Update lastMessage in chatsData
      const userChatRef = doc(db, "chats", userData.id);
      const friendChatRef = doc(db, "chats", selectedChat.rId);

const updateChat = async (chatRef, receiverId) => {
  const snap = await getDoc(chatRef);
  const chatsArr = snap.data()?.chatsData || [];

  const updatedChats = chatsArr.map(c => {
    if (c.rId === receiverId) {
      return {
        ...c,
        lastMessage: messageData,
        updatedAt: messageData.timestamp,

        // ✔ If updating my chat list → messageSeen = true
        // ✔ If updating friend's chat list → messageSeen = false
        messageSeen: chatRef.id === userData.id ? true : false
      };
    }
    return c;
  });

  await updateDoc(chatRef, { chatsData: updatedChats });
};


      await Promise.all([updateChat(userChatRef, selectedChat.rId), updateChat(friendChatRef, userData.id)]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Delete a message
  const deleteMessage = async (msg) => {
    if (msg.senderId !== userData.id) return;
    const messagesRef = doc(db, "messages", selectedChat.messageId);
    const updatedMessages = messages.map(m => {
      if (m.timestamp === msg.timestamp) {
        return { ...m, text: "This message was deleted", image: "", deleted: true };
      }
      return m;
    });
    await updateDoc(messagesRef, { messages: updatedMessages });
  };

  // Typing handler
  const handleTyping = async (e) => {
    setNewMessage(e.target.value);
    if (!selectedChat?.messageId) return;

    const typingRef = doc(db, "typing", selectedChat.messageId);
    await setDoc(typingRef, { typingBy: userData.id }, { merge: true });

    setTimeout(async () => {
      const snap = await getDoc(typingRef);
      if (snap.exists() && snap.data().typingBy === userData.id) {
        await updateDoc(typingRef, { typingBy: "" });
      }
    }, 2000);
  };

  // Scroll to bottom on messages update
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(' AM', ' am')
      .replace(' PM', ' pm');
  };

  if (!selectedChat?.userData) {
    return (
      <div className="chat-box no-chat-selected">
        <div className="welcome-screen">
          <div className="app-icon">💬</div>
          <h1 className="app-title">Chatapp</h1>
          <p className="welcome-text">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-user">
          <img src={selectedChat.userData.avatar || assets.profile_img} alt={selectedChat.userData.name} className="user-avatar" />
          <div className="user-info">
            <h3 className="user-name">{selectedChat.userData.name}</h3>
            {typing && <span className="typing-indicator">Typing...</span>}
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.senderId === userData.id ? 'sent' : 'received'}`}
            onContextMenu={(e) => { e.preventDefault(); deleteMessage(msg); }}
          >
            <div className="message-wrapper">
              <img
                src={msg.senderId === userData.id ? userData.avatar || assets.profile_img : selectedChat.userData.avatar || assets.profile_img}
                alt=""
                className="sender-avatar"
              />
              <div className="message-content">
                {msg.text && <div className={`message-text ${msg.deleted ? 'deleted' : ''}`}>{msg.text}</div>}
                {msg.image && !msg.deleted && (
                  <div className="message-image-wrapper">
                    <img src={msg.image} alt="Shared" className="message-image" />
                  </div>
                )}
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="message-input"
          />
          <input
            type="file"
            accept="image/*"
            id="image-upload"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files[0]) setImageFile(e.target.files[0]); }}
          />
          <div className="input-actions">
            <label htmlFor="image-upload" className="attach-action">
              <span className="attach-icon">📎</span>
            </label>
            <button className="send-action" onClick={sendMessage} disabled={!newMessage.trim() && !imageFile}>
              <img src={assets.send_button} alt="Send" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
