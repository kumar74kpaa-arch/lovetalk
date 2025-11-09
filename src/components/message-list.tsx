import React, { useEffect, useRef } from 'react';
import type { Message, User } from '@/lib/types';
import MessageBubble from './message-bubble';

type MessageListProps = {
  messages: Message[];
  currentUser: User;
  onAddReaction: (messageId: string, emoji: string) => void;
};

export default function MessageList({ messages, currentUser, onAddReaction }: MessageListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} currentUser={currentUser} onAddReaction={onAddReaction} />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}
