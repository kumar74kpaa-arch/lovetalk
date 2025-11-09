"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '@/lib/firebase';
import type { Message, User, ChatMetadata } from '@/lib/types';
import ChatHeader from '@/components/chat-header';
import MessageList from '@/components/message-list';
import MessageInput from '@/components/message-input';
import UserSwitcher from '@/components/user-switcher';
import { useToast } from '@/hooks/use-toast';

const users: { [key: string]: User } = {
  user1: { id: 'user1', name: 'You' },
  user2: { id: 'user2', name: 'Partner' },
};

export default function Chat() {
  const [currentUser, setCurrentUser] = useState<User>(users.user1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loveStreak, setLoveStreak] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const metaRef = doc(db, 'metadata', 'chatInfo');
    const getStreak = async () => {
      const docSnap = await getDoc(metaRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ChatMetadata;
        if (data.firstMessageTimestamp) {
          const diffInMs = new Date().getTime() - data.firstMessageTimestamp.toDate().getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          setLoveStreak(diffInDays + 1);
        }
      }
    };
    getStreak();
    
    const unsubscribe = onSnapshot(metaRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as ChatMetadata;
            if (data.firstMessageTimestamp) {
              const diffInMs = new Date().getTime() - data.firstMessageTimestamp.toDate().getTime();
              const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
              setLoveStreak(diffInDays + 1);
            }
        }
    });

    return () => unsubscribe();
  }, []);

  const checkAndSetFirstMessage = async () => {
    const metaRef = doc(db, 'metadata', 'chatInfo');
    const docSnap = await getDoc(metaRef);
    if (!docSnap.exists() || !docSnap.data().firstMessageTimestamp) {
      await setDoc(metaRef, { firstMessageTimestamp: serverTimestamp() });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (text.trim() === '') return;
    await addDoc(collection(db, 'messages'), {
      text,
      type: 'text',
      createdAt: serverTimestamp(),
      userId: currentUser.id,
      reactions: {},
    });
    await checkAndSetFirstMessage();
  };

  const handleSendVoice = async (blob: Blob) => {
    try {
      const storageRef = ref(storage, `voice-notes/${uuidv4()}.webm`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'messages'), {
        text: '',
        type: 'voice',
        voiceUrl: downloadURL,
        createdAt: serverTimestamp(),
        userId: currentUser.id,
        reactions: {},
      });
      await checkAndSetFirstMessage();
    } catch (error) {
      console.error("Error uploading voice note: ", error);
      toast({
        title: "Upload Failed",
        description: "Could not send voice note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
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
      <MessageList messages={messages} currentUser={currentUser} onAddReaction={handleAddReaction} />
      <MessageInput onSendMessage={handleSendMessage} onSendVoice={handleSendVoice} />
      <UserSwitcher currentUser={currentUser} setCurrentUser={setCurrentUser} users={Object.values(users)} />
    </div>
  );
}
