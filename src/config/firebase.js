// Import Firebase
import { initializeApp } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

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



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// ---------------------
// AUTH FUNCTIONS
// ---------------------

// Signup
export const signup = async (username, email, password) => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCred.user.uid), {
      username,
      email
    });

    console.log("User created");
  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
};

// Login
export const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in");
  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Reset email sent");
  } catch (error) {
    console.error(error.message);
    throw error; // re-throw error to handle it in Login.jsx
  }
};


// Logout
export const logout = () => signOut(auth);

// Export Auth + DB
export { auth, db };
