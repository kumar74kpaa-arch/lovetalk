"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

type FirebaseContextType = {
  app: FirebaseApp | null;
  db: Firestore | null;
};

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
});

export const useFirebase = () => useContext(FirebaseContext);

export default function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({ app: null, db: null });

  useEffect(() => {
    // This check ensures that Firebase is only initialized on the client side.
    if (typeof window !== 'undefined') {
      const { app, db } = initializeFirebase();
      setFirebase({ app, db });
    }
  }, []);
  
  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}
