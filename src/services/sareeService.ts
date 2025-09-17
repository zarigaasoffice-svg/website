import { useState, useEffect } from 'react';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Saree, CreateSareeInput, UpdateSareeInput } from '../types/models';

const COLLECTION_NAME = 'sarees';
const sareeCollection = collection(db, COLLECTION_NAME);

export const addSaree = async (sareeData: CreateSareeInput): Promise<string> => {
  try {
    const docRef = await addDoc(sareeCollection, {
      ...sareeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding saree:', error);
    throw error;
  }
};

export const getSarees = async (): Promise<Saree[]> => {
  try {
    const querySnapshot = await getDocs(
      query(sareeCollection, orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Saree[];
  } catch (error) {
    console.error('Error getting sarees:', error);
    throw error;
  }
};

export const updateSaree = async (sareeId: string, updateData: UpdateSareeInput): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, sareeId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating saree:', error);
    throw error;
  }
};

export const deleteSaree = async (sareeId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, sareeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting saree:', error);
    throw error;
  }
};

// React hook for real-time sarees subscription
export const useSarees = () => {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(sareeCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sareeList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Saree[];
        setSarees(sareeList);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to sarees:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { sarees, loading, error };
};