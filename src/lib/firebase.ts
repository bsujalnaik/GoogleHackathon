import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { onMessage } from "firebase/messaging";
import { toast } from "@/hooks/use-toast";

// // Your web app's Firebase configuration
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
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
// projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
//  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, auth, analytics, db, messaging };

// --- Firestore Chat Utilities ---

// Create a new chat and return its ID
export async function createNewChat(userId: string) {
  const chatRef = await addDoc(collection(db, "chats"), {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return chatRef.id;
}

// List recent chats for a user, ordered by most recent activity
export async function listRecentChats(userId: string, max = 15) {
  const q = query(
    collection(db, "chats"),
    orderBy("updatedAt", "desc"),
    limit(max)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .filter(doc => doc.data().userId === userId)
    .map(doc => ({ id: doc.id, ...doc.data() }));
}

// Load all messages for a chat, ordered by timestamp
export async function loadChatMessages(chatId: string) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Send a message to a chat and update chat's updatedAt
export async function sendMessageToChat(chatId: string, message: { content: string; type: "user" | "ai"; }) {
  const msgRef = await addDoc(collection(db, "chats", chatId, "messages"), {
    ...message,
    timestamp: serverTimestamp(),
  });
  await updateDoc(doc(db, "chats", chatId), {
    updatedAt: serverTimestamp(),
  });
  return msgRef.id;
}

/**
 * Adds an alert to the 'alerts' collection in Firestore.
 * @param {Object} alert - The alert object with title, body, and userId.
 */
export async function addAlertToFirestore({ title, body, userId }: { title: string, body: string, userId?: string }) {
  return await addDoc(collection(db, "alerts"), {
    title,
    body,
    userId: userId || null,
    createdAt: serverTimestamp(), // <-- use this!
  });
}

// --- Firebase Cloud Messaging for Alerts ---

const messaging = getMessaging(app);
if (typeof window !== "undefined" && "Notification" in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      getToken(messaging, {
        vapidKey: "BPKX9IyCflfAa349rAJjUUWzcvy4qrjsilktExNe3L4FYT8T2-KC301xvikxQpJ_ksR-AME8K6w7hD0XCP_2VeU" // <-- Replace this!
      })
        .then((currentToken) => {
          if (currentToken) {
            console.log("FCM Token:", currentToken);
          } else {
            console.log("No registration token available.");
          }
        })
        .catch((err) => {
          console.log('An error occurred while retrieving token. ', err);
        });
    }
  });
}

if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch((err) => {
      console.log('Service Worker registration failed:', err);
    });
}

onMessage(messaging, async (payload) => {
  console.log('Message received. ', payload);
  const notification = payload.notification;
  if (notification) {
    await addAlertToFirestore({
      title: notification.title || "New Alert",
      body: notification.body || "You have a new message.",
      userId: "testUserId", // Replace with actual user ID if available
    });
  }
});

