import React, { useState, useEffect, useContext, useMemo } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from "react-toastify";
import { AppContext } from '../../context/AppContext';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { chatData, setSelectedChat, userData, selectedChat } = useContext(AppContext);

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [unseenChats, setUnseenChats] = useState({});

  // Compute which chats have unseen messages
  useEffect(() => {
    if (!chatData || !Array.isArray(chatData)) {
      setUnseenChats({});
      return;
    }

    const unseenMap = {};
    chatData.forEach(chat => {
      const lastMsg = chat.lastMessage || {};
      const unread = lastMsg.senderId !== userData?.id && !chat.messageSeen;
      unseenMap[chat.rId] = unread;
    });

    setUnseenChats(unseenMap);
  }, [chatData, userData]);

  const sortedChats = useMemo(() => {
    if (!chatData || !Array.isArray(chatData)) return [];

    const toMillis = (t) => {
      if (!t) return 0;
      if (typeof t === 'number') return t;
      if (t.toMillis) return t.toMillis();
      const parsed = parseInt(t, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    return [...chatData].sort((a, b) => {
      const aUnseen = unseenChats[a.rId] || false;
      const bUnseen = unseenChats[b.rId] || false;

      if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;
      return toMillis(b.updatedAt) - toMillis(a.updatedAt);
    });
  }, [chatData, unseenChats]);

  const uniqueChats = useMemo(() => {
    const seen = new Set();
    return sortedChats.filter(chat => {
      if (!chat) return false;
      if (seen.has(chat.rId)) return false;
      seen.add(chat.rId);
      return true;
    });
  }, [sortedChats]);

  const inputHandler = async (e) => {
    try {
      const input = e.target.value.trim().toLowerCase();

      if (!input) {
        setSearching(false);
        setSearchResults([]);
        return;
      }

      setSearching(true);

      const q = query(
        collection(db, "users"),
        where("username_lower", ">=", input),
        where("username_lower", "<=", input + "\uf8ff")
      );

      const snap = await getDocs(q);

      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== userData?.id);

      const existingChatIds = chatData?.map(c => c.rId) || [];
      const filtered = users.filter(u => !existingChatIds.includes(u.id));

      setSearchResults(filtered);
    } catch (err) {
      console.error("search error:", err);
    }
  };


  const addChat = async (selectedUser) => {
    try {
      if (!userData) return;

      const messagesRef = collection(db, "messages");
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, { createdAt: serverTimestamp(), messages: [] });

      const chatsRef = doc(db, "chats", userData.id);
      const friendChatsRef = doc(db, "chats", selectedUser.id);

      await setDoc(chatsRef, {}, { merge: true });
      await setDoc(friendChatsRef, {}, { merge: true });

      const timestamp = Date.now();

      const snap = await getDoc(chatsRef);
      const existingChats = snap.data()?.chatsData || [];
      const filtered = existingChats.filter(c => c.rId !== selectedUser.id);

      filtered.unshift({
        messageId: newMessageRef.id,
        lastMessage: { text: "", senderId: userData.id },
        rId: selectedUser.id,
        updatedAt: timestamp,
        messageSeen: true,
        userData: selectedUser
      });

      await updateDoc(chatsRef, { chatsData: filtered });

      const fsnap = await getDoc(friendChatsRef);
      const fchats = fsnap.data()?.chatsData || [];
      const filteredFriend = fchats.filter(c => c.rId !== userData.id);

      filteredFriend.unshift({
        messageId: newMessageRef.id,
        lastMessage: { text: "", senderId: userData.id },
        rId: userData.id,
        updatedAt: timestamp,
        messageSeen: true,
        userData: userData
      });

      await updateDoc(friendChatsRef, { chatsData: filteredFriend });

      setSelectedChat({
        userData: selectedUser,
        messageId: newMessageRef.id,
        rId: selectedUser.id,
        messageSeen: true,
        updatedAt: timestamp,
        lastMessage: ""
      });

      setUnseenChats(prev => ({ ...prev, [selectedUser.id]: false }));

      toast.success("Chat created!");
    } catch (err) {
      toast.error(err.message || 'Could not create chat');
      console.error('addChat error', err);
    }
  };

  const handleChatSelect = async (chat) => {
    try {
      const now = Date.now();

      // Remove highlight instantly in UI
      setUnseenChats(prev => ({ ...prev, [chat.rId]: false }));

      // Update selected chat in context
      setSelectedChat({
        ...chat,
        messageSeen: true,
        updatedAt: now
      });

      // --- FIX: Update Firestore CORRECTLY ---
      const userChatRef = doc(db, "chats", userData.id);
      const snap = await getDoc(userChatRef);

      if (!snap.exists()) return;

      const chatsArr = snap.data().chatsData || [];

      // Now correctly update the matched chat
      const updatedChats = chatsArr.map(c => {
        if (c.rId === chat.rId) {
          return {
            ...c,
            messageSeen: true,
            updatedAt: now
          };
        }
        return c;
      });

      // Save updated chats back to Firestore
      await updateDoc(userChatRef, {
        chatsData: updatedChats
      });

    } catch (err) {
      console.error("handleChatSelect error:", err);
    }
  };


  const formatTime = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'number') return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (ts.toMillis) return new Date(ts.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const parsed = parseInt(ts, 10);
    return !isNaN(parsed) ? new Date(parsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />

            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder="Search here.." />
        </div>
      </div>

      <div className="ls-list">
        {searching ? (
          searchResults.length > 0 ? (
            searchResults.map((u, i) => (
              <div key={i} className="friends" onClick={() => addChat(u)}>
                <img src={u.avatar || assets.profile_img} alt="" />
                <div className="friend-info">
                  <p className="friend-name">{u.username}</p>
                  <span className="friend-status">Start chat</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">No user found</p>
          )
        ) : uniqueChats.length > 0 ? (
          uniqueChats.map((chat, i) => (
            <div
              key={i}
              className={`friends 
                ${chat.rId === selectedChat?.rId ? "selected-chat" : ""}
                ${unseenChats[chat.rId] ? "unseen-chat" : ""}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="avatar-wrapper">
                <img src={chat.userData?.avatar || assets.profile_img} alt="" />
                {unseenChats[chat.rId] && <div className="unseen-indicator" />}
              </div>
              <div className="friend-info">
                <div className="friend-header">
                  <p className="friend-name">{chat.userData?.username || chat.userData?.name}</p>
                  <span className="message-time">{formatTime(chat.updatedAt)}</span>
                </div>
                <div className="friend-footer">
                  <span className="friend-last-message">{chat.lastMessage?.text || "Say Hi!"}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-chats">No chats yet. Search for users to start chatting!</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
