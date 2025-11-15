import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
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
