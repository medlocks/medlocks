import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import {
  initializeAuth,
  inMemoryPersistence,
  getAuth,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAQZnMWFdH7OZbXEA2vzxFjx3lvaaZOIik",
  authDomain: "medlocks-f3fe7.firebaseapp.com",
  projectId: "medlocks-f3fe7",
  storageBucket: "medlocks-f3fe7.appspot.com", // ✅ FIXED — no gs://, no .firebasestorage.app
  messagingSenderId: "29663588265",
  appId: "1:29663588265:web:d497cb0088a8c675945eb8",
  measurementId: "G-FL43SJDPC2",
};

// --- Initialize Firebase App ---
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// --- Initialize Auth ---
let auth: Auth;
try {
  auth = getAuth(app);
} catch {
  auth = initializeAuth(app, { persistence: inMemoryPersistence });
}

// --- Initialize Firestore & Cloud Functions ---
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app, "us-central1");

// --- Initialize Storage ---
const storage = getStorage(app);

// --- Exports ---
export { app, auth, db, functions, storage };
export default app;


