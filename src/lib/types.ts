import type { Timestamp } from "firebase/firestore";

export type User = {
  id: 'user1' | 'user2';
  name: string;
};

export type Message = {
  id: string;
  text: string;
  type: 'text' | 'voice' | 'image' | 'video';
  voiceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  userId: User['id'];
  createdAt: Timestamp;
  reactions: Record<string, string[]>; // emoji -> userIds
};

export type ChatMetadata = {
    firstMessageTimestamp?: Timestamp;
}
