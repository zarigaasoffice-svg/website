// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzGoiFWUmoKMkMQEeUOsD7afsQgsT0HQs",
  authDomain: "zarigaas.firebaseapp.com",
  projectId: "zarigaas",
  storageBucket: "zarigaas.firebasestorage.app",
  messagingSenderId: "1012208241075",
  appId: "1:1012208241075:web:70e06ad83c5b0ce2bc23c6",
  measurementId: "G-J5E0CPH5Q5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.log('Persistence not supported by browser');
    }
  });

export { app, auth, db, analytics };