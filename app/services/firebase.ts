import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAQZnMWFdH7OZbXEA2vzxFjx3lvaaZOIik",
  authDomain: "medlocks-f3fe7.firebaseapp.com",
  projectId: "medlocks-f3fe7",
  storageBucket: "medlocks-f3fe7.firebasestorage.app",
  messagingSenderId: "29663588265",
  appId: "1:29663588265:web:d497cb0088a8c675945eb8",
};

const app = initializeApp(firebaseConfig);

// Exported helpers for the rest of the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // used for httpsCallable
export default app;
