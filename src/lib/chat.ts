import { serverTimestamp } from 'firebase/firestore';

// Types
export interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  timestamp: any; // FirebaseTimestamp
}

export interface ChatUser {
  id: string;
  email: string;
  displayName?: string;
  lastMessage?: string;
  lastMessageTime?: any; // FirebaseTimestamp
  unreadCount?: number;
}

// Constants
export const CLOUDINARY_UPLOAD_PRESET = "zarigaas_chat_unsigned";
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_CHAT_FOLDER = "zarigaas/chat";

// Utility functions
export const getConversationId = (userId: string, adminId: string): string => {
  // Ensure consistent order regardless of who's sending
  return [userId, adminId].sort().join('_');
};

export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    // For messages in the last 24 hours, show only time
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else if (diffInHours < 168) { // 7 days
    // For messages in the last week, show day name
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    // For older messages, show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
};

export const createMessage = (
  senderId: string, 
  receiverId: string, 
  text?: string, 
  imageUrl?: string
): Omit<ChatMessage, 'id'> => {
  return {
    senderId,
    receiverId,
    text,
    imageUrl,
    timestamp: serverTimestamp(),
  };
};

// Cloudinary upload helper
export const uploadChatImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", CLOUDINARY_CHAT_FOLDER);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload image');
  }

  const data = await response.json();
  return data.secure_url;
};