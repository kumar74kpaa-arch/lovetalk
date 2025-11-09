"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

type FirebaseContextType = {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
};

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
  storage: null,
});

export const useFirebase = () => useContext(FirebaseContext);

export default function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({ app: null, db: null, storage: null });

  useEffect(() => {
    // This check ensures that Firebase is only initialized on the client side.
    if (typeof window !== 'undefined') {
      const { app, db, storage } = initializeFirebase();
      setFirebase({ app, db, storage });
    }
  }, []);
  
  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}
