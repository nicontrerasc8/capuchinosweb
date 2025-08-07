// /firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBibFJs4ReX_WIXgvhPhqWZ89URKrfvksw",
  authDomain: "crud-notes-simc3.firebaseapp.com",
  projectId: "crud-notes-simc3",
  storageBucket: "crud-notes-simc3.firebasestorage.app",
  messagingSenderId: "380750024487",
  appId: "1:380750024487:web:432ab8ec2e2802e3fa2302"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
