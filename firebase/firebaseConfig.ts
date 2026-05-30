import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCcXJFvzXcLE4fINlhWczxHpqC3UYVlto4",
  authDomain: "fairwattdb.firebaseapp.com",
  projectId: "fairwattdb",
  storageBucket: "fairwattdb.firebasestorage.app",
  messagingSenderId: "35331220524",
  appId: "1:35331220524:web:b72f3cddb71db8da7a5d89"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app); 