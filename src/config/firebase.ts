import { initializeApp } from 'firebase/app';
import { getAuth, applyActionCode, sendPasswordResetEmail, verifyPasswordResetCode, onAuthStateChanged, confirmPasswordReset, getRedirectResult, createUserWithEmailAndPassword, reload, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, get, set, runTransaction, onValue,  query, orderByChild, equalTo, update, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
export { 
  ref,
  get,
  set,
  runTransaction,
  onValue,
  query,
  orderByChild,
  equalTo,
  update,
  push,
  applyActionCode,
  getAuth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  onAuthStateChanged,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  reload
};
export type { User } from "firebase/auth";