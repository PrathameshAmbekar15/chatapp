// ---------------------
// Firebase Core
// ---------------------
import { initializeApp } from "firebase/app";

// ---------------------
// Firebase Auth
// ---------------------
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";

// ---------------------
// Firestore
// ---------------------
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// ---------------------
// Firebase Config
// ---------------------
const firebaseConfig = {
  apiKey: "AIzaSyDX7dmhAi9fNSb2_4zEvhO7rc5yeB7GnyA",
  authDomain: "chat-app-pa-f51e4.firebaseapp.com",
  projectId: "chat-app-pa-f51e4",
  storageBucket: "chat-app-pa-f51e4.appspot.com",
  messagingSenderId: "500238331062",
  appId: "1:500238331062:web:0b2bc5cb00f92b84f7ca17",
};

// ---------------------
// Initialize Firebase
// ---------------------
const app = initializeApp(firebaseConfig);

// ---------------------
// Services
// ---------------------
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------------------
// AUTH FUNCTIONS
// ---------------------

// Signup
export const signup = async (username, email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  const user = res.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    username,
    username_lower: username.toLowerCase(), // ✅ REQUIRED FOR SEARCH
    email: user.email,
    avatar: "",
    createdAt: serverTimestamp()
  });
};

// Login
export const login = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
};

// Reset Password
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// Logout
export const logout = () => signOut(auth);
