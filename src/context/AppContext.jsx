import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unseenChats, setUnseenChats] = useState({});

  const notificationAudio = new Audio("/notification.mp3");

  // Load user data
  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const data = snap.data();
      setUserData({ id: uid, ...data });

      // Route user
      if (data.avatar && data.name) navigate("/chat");
      else navigate("/profile");

      await updateDoc(userRef, { lastSeen: Date.now() });

      const interval = setInterval(async () => {
        if (auth.currentUser) await updateDoc(userRef, { lastSeen: Date.now() });
      }, 60000);

      return () => clearInterval(interval);
    } catch (err) {
      console.error("loadUserData error:", err);
    }
  };

  // Listen to user's chat list
  useEffect(() => {
    if (!userData?.id) return;

    const chatRef = doc(db, "chats", userData.id);

    const unSub = onSnapshot(chatRef, async (snap) => {
      if (!snap.exists()) {
        setChatData([]);
        return;
      }

      const chats = snap.data()?.chatsData || [];

      // Fetch userData for each chat
      const temp = await Promise.all(
        chats.map(async (chat) => {
          try {
            const userSnap = await getDoc(doc(db, "users", chat.rId));
            return {
              ...chat,
              userData: userSnap.exists()
                ? userSnap.data()
                : { name: "Unknown", avatar: "" }
            };
          } catch {
            return { ...chat, userData: { name: "Unknown", avatar: "" } };
          }
        })
      );

      // ❗**IMPORTANT FIX** → DO NOT override messageSeen here.
      // Use EXACTLY what Firestore sends.
      const processedChats = temp.map(c => ({
        ...c,
        messageSeen: c.messageSeen === false ? false : true
      }));

      // Remove duplicates
      const uniqueChats = processedChats.filter(
        (v, i, a) => a.findIndex(t => t.rId === v.rId) === i
      );

      // Sort by latest
      setChatData(uniqueChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    });

    return () => unSub();
  }, [userData?.id]);

  // Ask notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Listen for new messages and trigger notifications
  useEffect(() => {
    if (!userData || !chatData.length) return;

    const unsubscribers = [];

    chatData.forEach(chat => {
      if (!chat.messageId) return;

      const msgRef = doc(db, "messages", chat.messageId);

      const unsubscribe = onSnapshot(msgRef, (snapshot) => {
        const data = snapshot.data();
        if (!data?.messages?.length) return;

        const lastMsg = data.messages[data.messages.length - 1];

        if (!lastMsg || lastMsg.senderId === userData.id) return; // ignore self messages

        // notify only if user is not viewing this chat
        if (selectedChat?.rId !== chat.rId) {
          triggerNotification(lastMsg, chat);
        }
      });

      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach(u => u());
  }, [chatData, selectedChat, userData]);

  // Notification logic
  const triggerNotification = (msg, chat) => {
    try {
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(() => {});

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(chat.userData.username || "New message", {
            body: msg.text || "Sent a message",
            icon: chat.userData.avatar || "/logo192.png",
            silent: true
          });
        }
      }

      // Update unseen state
      setUnseenChats(prev => ({
        ...prev,
        [chat.rId]: true
      }));
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const setSelectedChatWithLog = (chat) => {
    console.log("Setting selected chat:", chat);
    setSelectedChat(chat);
  };

  return (
    <AppContext.Provider
      value={{
        userData,
        setUserData,
        chatData,
        setChatData,
        selectedChat,
        setSelectedChat: setSelectedChatWithLog,
        unseenChats,
        setUnseenChats,
        loadUserData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
