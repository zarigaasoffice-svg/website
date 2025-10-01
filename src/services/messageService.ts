import { 
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Message, CreateMessageInput } from '../types/models';
import { toast } from 'react-hot-toast';

const COLLECTION_NAME = 'messages';
const messagesCollection = collection(db, COLLECTION_NAME);

export const getMessages = async (options?: { limit?: number; offset?: number }) => {
  try {
    const q = query(
      messagesCollection,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const addMessage = async (messageData: CreateMessageInput): Promise<string> => {
  try {
    const docRef = await addDoc(messagesCollection, {
      ...messageData,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(messagesCollection, messageId));
  } catch (error) {
    console.error('Error deleting message:', error);
    toast.error('Failed to delete message');
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(messagesCollection, messageId);
    await updateDoc(messageRef, {
      isRead: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    toast.error('Failed to mark message as read');
    throw error;
  }
};