// Firebase Configuration
// This file contains your Firebase project configuration
// Make sure to add this file to .gitignore to keep your API keys secure

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase configuration object
// In production, these should come from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCwZ7zIe-dwrMy1ukK3hiAVuky-JR02efE",
  authDomain: "ag-genius-f3c45.firebaseapp.com",
  projectId: "ag-genius-f3c45",
  storageBucket: "ag-genius-f3c45.firebasestorage.app",
  messagingSenderId: "125700152205",
  appId: "1:125700152205:web:8b530aef1748e331bb3bc4",
  measurementId: "G-MT2E3ZWV5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export the app instance
export default app; 