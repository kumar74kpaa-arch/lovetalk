"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useFirebase } from '@/firebase/client-provider';
import type { Message, User, ChatMetadata } from '@/lib/types';
import ChatHeader from '@/components/chat-header';
import MessageList from '@/components/message-list';
import MessageInput from '@/components/message-input';
import UserSwitcher from '@/components/user-switcher';
import { useToast } from '@/hooks/use-toast';
import FirebaseClientProvider from '@/firebase/client-provider';
import Lightbox from './lightbox';

const users: { [key: string]: User } = {
  user1: { id: 'user1', name: 'You' },
  user2: { id: 'user2', name: 'Partner' },
};

async function uploadToCloudinary(file: File | Blob, resourceType: 'image' | 'video' | 'raw'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'chat-app-unsigned');
  
  const endpoint = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.secure_url;
}


function ChatComponent() {
  const { db } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User>(users.user1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loveStreak, setLoveStreak] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    }, (error) => {
        console.error("Error fetching messages: ", error);
        toast({
            title: "Error",
            description: "Could not fetch messages.",
            variant: "destructive",
        });
    });

    return () => unsubscribe();
  }, [db, toast]);

  useEffect(() => {
    if (!db) return;
    const metaRef = doc(db, 'metadata', 'chatInfo');
    
    const unsubscribe = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as ChatMetadata;
            if (data.firstMessageTimestamp) {
              const diffInMs = new Date().getTime() - data.firstMessageTimestamp.toDate().getTime();
              const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));
              setLoveStreak(diffInDays + (diffInMs > 0 ? 1 : 0));
            } else {
              setLoveStreak(0);
            }
        } else {
          setLoveStreak(0);
        }
    }, (error) => {
      console.error("Error getting streak: ", error);
    });

    return () => unsubscribe();
  }, [db]);

  const checkAndSetFirstMessage = async (db: Firestore) => {
    const metaRef = doc(db, 'metadata', 'chatInfo');
    const docSnap = await getDoc(metaRef);
    if (!docSnap.exists() || !docSnap.data().firstMessageTimestamp) {
      await setDoc(metaRef, { firstMessageTimestamp: serverTimestamp() }, { merge: true });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (text.trim() === '' || !db) return;
    await addDoc(collection(db, 'messages'), {
      text,
      type: 'text',
      createdAt: serverTimestamp(),
      userId: currentUser.id,
      reactions: {},
    });
    await checkAndSetFirstMessage(db);
  };

  const handleSendVoice = async (blob: Blob) => {
    if (!db) return;
    try {
      const downloadURL = await uploadToCloudinary(blob, 'raw');

      await addDoc(collection(db, 'messages'), {
        text: '',
        type: 'voice',
        voiceUrl: downloadURL,
        createdAt: serverTimestamp(),
        userId: currentUser.id,
        reactions: {},
      });
      await checkAndSetFirstMessage(db);
    } catch (error) {
      console.error("Error uploading voice note: ", error);
      toast({
        title: "Upload Failed",
        description: "Could not send voice note. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSendFile = async (file: File) => {
    if (!db) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({ title: "Invalid File", description: "Please select an image or video file.", variant: "destructive" });
      return;
    }

    try {
      const resourceType = isImage ? 'image' : 'video';
      const downloadURL = await uploadToCloudinary(file, resourceType);

      const message: Partial<Message> = {
        text: '',
        type: resourceType,
        createdAt: serverTimestamp(),
        userId: currentUser.id,
        reactions: {},
      };

      if (isImage) {
        message.imageUrl = downloadURL;
      } else {
        message.videoUrl = downloadURL;
      }

      await addDoc(collection(db, 'messages'), message);
      await checkAndSetFirstMessage(db);
    } catch (error) {
      console.error(`Error uploading ${isImage ? 'image' : 'video'}: `, error);
      toast({
        title: "Upload Failed",
        description: `Could not send ${isImage ? 'image' : 'video'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!db) return;
    const messageRef = doc(db, 'messages', messageId);
    const docSnap = await getDoc(messageRef);

    if (docSnap.exists()) {
        const message = docSnap.data() as Message;
        const currentReactions = message.reactions || {};
        const userList = currentReactions[emoji] || [];

        if (userList.includes(currentUser.id)) {
            // User already reacted, so remove reaction
            currentReactions[emoji] = userList.filter(id => id !== currentUser.id);
            if(currentReactions[emoji].length === 0) {
                delete currentReactions[emoji];
            }
        } else {
            // Add new reaction
            currentReactions[emoji] = [...userList, currentUser.id];
        }

        await updateDoc(messageRef, { reactions: currentReactions });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent max-w-2xl mx-auto w-full">
      <ChatHeader loveStreak={loveStreak} />
      <MessageList messages={messages} currentUser={currentUser} onAddReaction={handleAddReaction} onImageClick={setLightboxImage} />
      <MessageInput onSendMessage={handleSendMessage} onSendVoice={handleSendVoice} onSendFile={handleSendFile}/>
      <UserSwitcher currentUser={currentUser} setCurrentUser={setCurrentUser} users={Object.values(users)} />
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FirebaseClientProvider>
        <ChatComponent />
      </FirebaseClientProvider>
    </Suspense>
  );
}
