import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types/models';

const COLLECTION_NAME = 'users';

export const createOrUpdateUser = async (userData: {
  uid: string;
  email: string;
  displayName?: string;
}): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, userData.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    } else {
      // Update last login time
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error managing user document:', error);
    throw error;
  }
};

export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        ...userSnap.data(),
        uid: userSnap.id
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUserRole = async (uid: string, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};