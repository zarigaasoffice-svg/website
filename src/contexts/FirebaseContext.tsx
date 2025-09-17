import { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase-config';

interface FirebaseContextType {
  // Saree data operations
  sarees: any[];
  addSaree: (sareeData: any) => Promise<void>;
  updateSaree: (id: string, data: any) => Promise<void>;
  deleteSaree: (id: string) => Promise<void>;
  
  // Message operations
  messages: any[];
  sendMessage: (messageData: any) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [sarees, setSarees] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to sarees collection
  useEffect(() => {
    const q = query(collection(db, 'sarees'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const sareeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSarees(sareeData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching sarees:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to messages collection
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageData);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Saree operations
  const addSaree = async (sareeData: any) => {
    try {
      await addDoc(collection(db, 'sarees'), {
        ...sareeData,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateSaree = async (id: string, data: any) => {
    try {
      const sareeRef = doc(db, 'sarees', id);
      await updateDoc(sareeRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSaree = async (id: string) => {
    try {
      const sareeRef = doc(db, 'sarees', id);
      await deleteDoc(sareeRef);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Message operations
  const sendMessage = async (messageData: any) => {
    try {
      await addDoc(collection(db, 'messages'), {
        ...messageData,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    sarees,
    addSaree,
    updateSaree,
    deleteSaree,
    messages,
    sendMessage,
    markMessageAsRead,
    loading,
    error
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}