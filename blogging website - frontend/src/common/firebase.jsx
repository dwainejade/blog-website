import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrKd_7WybQQVOu4Kx2O5IoWEwNwGVCw7Y",
  authDomain: "mern-blog-site-884dc.firebaseapp.com",
  projectId: "mern-blog-site-884dc",
  storageBucket: "mern-blog-site-884dc.firebasestorage.app",
  messagingSenderId: "635070372414",
  appId: "1:635070372414:web:bc9ce984397c60082ccf6f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
const auth = getAuth();

const authWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

export { app, auth, authWithGoogle };
