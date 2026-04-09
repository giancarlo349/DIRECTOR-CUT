import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQTr3D2G5CKO5FA4h3-SrAfBKL27zqhrQ",
  authDomain: "bazarnovareal-2a2e1.firebaseapp.com",
  databaseURL: "https://bazarnovareal-2a2e1-default-rtdb.firebaseio.com",
  projectId: "bazarnovareal-2a2e1",
  storageBucket: "bazarnovareal-2a2e1.firebasestorage.app",
  messagingSenderId: "86223881317",
  appId: "1:86223881317:web:f80d2fbc8d0c7c5e15b28c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
