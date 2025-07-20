// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBe5d3DzOlbuLNLdRyPr_nH4y5wABXB3q4",
  authDomain: "ledger-7b33e.firebaseapp.com",
  projectId: "ledger-7b33e",
  storageBucket: "ledger-7b33e.firebasestorage.app",
  messagingSenderId: "417201867297",
  appId: "1:417201867297:web:e3ccc782e443af9a6bb160",
  measurementId: "G-5V7REVMEM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);