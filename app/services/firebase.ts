// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQZnMWFdH7OZbXEA2vzxFjx3lvaaZOIik",
  authDomain: "medlocks-f3fe7.firebaseapp.com",
  projectId: "medlocks-f3fe7",
  storageBucket: "medlocks-f3fe7.firebasestorage.app",
  messagingSenderId: "29663588265",
  appId: "1:29663588265:web:d497cb0088a8c675945eb8",
  measurementId: "G-FL43SJDPC2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);