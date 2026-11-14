import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Public Firebase Web App configuration (not a service-account private key).
const firebaseConfig = {
  apiKey: "AIzaSyAi_ZO0D1NfnMqA0pSmHrr_75fARdKkBjI",
  authDomain: "al-naseem-d40c8.firebaseapp.com",
  projectId: "al-naseem-d40c8",
  storageBucket: "al-naseem-d40c8.firebasestorage.app",
  messagingSenderId: "889257194612",
  appId: "1:889257194612:web:5f07cce6b3024a0a7dcd21",
  measurementId: "G-D8J2GJNLQ4",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const isFirebaseConfigured = true;
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
