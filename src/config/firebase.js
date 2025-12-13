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
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);


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
