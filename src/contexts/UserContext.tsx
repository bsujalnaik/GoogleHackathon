// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase'; // Assuming db is exported from firebase.ts
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // Import onSnapshot to listen for real-time updates

interface UserContextType {
  user: any; // FirebaseUser object
  isPro: boolean; // Indicates if the user has a pro subscription
  loadingUser: boolean; // Indicates if user authentication state is still loading
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false); // Default to false
  const [loadingUser, setLoadingUser] = useState(true); // Initially true

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingUser(false); // Auth state loaded

      if (firebaseUser) {
        // If user is logged in, set up a real-time listener for their user document
        // This allows `isPro` to update automatically if changed in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // Check for an 'isPro' field in the user's document
            setIsPro(docSnap.data().isPro || false);
          } else {
            setIsPro(false); // User document doesn't exist or no pro status
          }
        });
        // Clean up the Firestore listener when component unmounts or user changes
        return () => unsubscribeFirestore();
      } else {
        // If no user is logged in, ensure isPro is false
        setIsPro(false);
      }
    });

    // Clean up the Auth state listener when component unmounts
    return () => unsubscribeAuth();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <UserContext.Provider value={{ user, isPro, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
