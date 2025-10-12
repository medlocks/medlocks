import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAQZnMWFdH7OZbXEA2vzxFjx3lvaaZOIik",
  authDomain: "medlocks-f3fe7.firebaseapp.com",
  projectId: "medlocks-f3fe7",
  storageBucket: "medlocks-f3fe7.firebasestorage.app",
  messagingSenderId: "29663588265",
  appId: "1:29663588265:web:d497cb0088a8c675945eb8",
  measurementId: "G-FL43SJDPC2",
};

// --- Initialize Firebase App ---
export const app = initializeApp(firebaseConfig);

// --- Initialize Services ---
export const auth = getAuth(app);
export const db = getFirestore(app);

// 👇 IMPORTANT FIX: specify your region so Firebase knows your project context
// (use your actual region from Firebase Console, often "us-central1")
export const functions = getFunctions(app, "us-central1");

// --- Export Default App ---
export default app;
