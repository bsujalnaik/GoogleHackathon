import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACOgfXdFbJJ1EOC-oWvz6I5xljYaCaUiU",
  authDomain: "storage-of-finsight.firebaseapp.com",
  databaseURL: "https://storage-of-finsight-default-rtdb.firebaseio.com",
  projectId: "storage-of-finsight",
  storageBucket: "storage-of-finsight.appspot.com", // <-- fixed typo here
  messagingSenderId: "583194312680",
  appId: "1:583194312680:web:eed755f06f44c95660ae5d",
  measurementId: "G-K9LGRW78L6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, auth, analytics, db };