import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTg2X4rHJkGGBLKj7TYNsuzcS2nnlz3K0",
  authDomain: "oda-quotation.firebaseapp.com",
  projectId: "oda-quotation",
  storageBucket: "oda-quotation.firebasestorage.app",
  messagingSenderId: "1097399205891",
  appId: "1:1097399205891:web:6c85ea594c7fda33264e36",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
