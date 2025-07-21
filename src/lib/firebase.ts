import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyACOgfXdFbJJ1EOC-oWvz6I5xljYaCaUiU",
//   authDomain: "storage-of-finsight.firebaseapp.com",
//   databaseURL: "https://storage-of-finsight-default-rtdb.firebaseio.com",
//   projectId: "storage-of-finsight",
//   storageBucket: "storage-of-finsight.appspot.com", // <-- fixed typo here
//   messagingSenderId: "583194312680",
//   appId: "1:583194312680:web:eed755f06f44c95660ae5d",
//   measurementId: "G-K9LGRW78L6"
// };
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, auth, analytics, db };