// src/lib/firebase.ts
/// <reference types="vite/client" />
// Initializes Firebase using Vite env vars
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY!,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.VITE_FIREBASE_APP_ID!,
};

if (Object.values(firebaseConfig).some(v => !v)) {
  throw new Error("Missing one or more Firebase client configuration values in environment variables.");
}

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);


// Named export for auth instance
// export { firebaseAuth };


