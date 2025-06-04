import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC0SyahLsKT5C9XIb8oskrO30pFtJXu6OE",
    authDomain: "fantasy-trade-calculator-445c6.firebaseapp.com",
    projectId: "fantasy-trade-calculator-445c6",
    storageBucket: "fantasy-trade-calculator-445c6.firebasestorage.app",
    messagingSenderId: "620779710552",
    appId: "1:620779710552:web:d8339cfbf0827163a4822d",
    measurementId: "G-NR02RGDE4Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

