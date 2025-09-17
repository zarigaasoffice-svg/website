import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  DocumentData,
  Firestore,
  DocumentReference
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { Timestamp } from 'firebase/firestore';

export interface SareeBase {
  name: string;
  description?: string;
  price: number | null;
  image_url: string;
  price_type: 'fixed' | 'dm';
  pitch_count: number;
  stock_status: 'in_stock' | 'out_of_stock';
}

export interface SareeData extends SareeBase {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Saree extends SareeBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  price: number | null;
  image_url: string;
  price_type: 'fixed' | 'dm';
  pitch_count: number;
  created_at: string;
  stock_status: 'in_stock' | 'out_of_stock';
  description?: string;
  price: number | null;
  image_url: string;
  price_type: 'fixed' | 'dm';
  pitch_count: number;
  created_at: string;
  stock_status: 'in_stock' | 'out_of_stock';
}

export interface Pitch {
  id: string;
  saree_id: string;
  user_id: string;
  content: string;
  created_at: string;
  saree?: Saree;
}

interface DataContextType {
  sarees: Saree[];
  pitches: Pitch[];
  loading: boolean;
  error: string | null;
  refreshSarees: () => Promise<void>;
  refreshPitches: () => Promise<void>;
  addPitch: (sareeId: string, content: string, userId: string) => Promise<void>;
  incrementPitchCount: (sareeId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to sarees collection
    const sareesQuery = query(
      collection(db, 'sarees'),
      orderBy('pitch_count', 'desc')
    );

    const unsubscribeSarees = onSnapshot(sareesQuery, 
      (snapshot) => {
        const sareeData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure the image_url is a valid string
          const image_url = typeof data.image_url === 'string' ? data.image_url : '';
          console.log(`Saree ${doc.id} image URL:`, image_url);
          
          return {
            id: doc.id,
            ...data,
            image_url // Override with validated URL
          } as Saree;
        });
        setSarees(sareeData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sarees:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Subscribe to pitches collection
    const pitchesQuery = query(
      collection(db, 'pitches'),
      orderBy('created_at', 'desc')
    );

    const unsubscribePitches = onSnapshot(pitchesQuery,
      async (snapshot) => {
        const pitchPromises = snapshot.docs.map(async (docSnap) => {
          const pitchData = docSnap.data();
          const sareeRef = doc(db, 'sarees', pitchData.saree_id);
          const sareeSnapshot = await getDoc(sareeRef);
          const data = sareeSnapshot.exists() ? sareeSnapshot.data() as SareeData : null;
          return {
            id: docSnap.id,
            ...pitchData,
            saree: data ? {
              id: sareeSnapshot.id,
              ...data
            } : undefined
          } as Pitch;
        });

        const pitchData = await Promise.all(pitchPromises);
        setPitches(pitchData);
      },
      (error) => {
        console.error('Error fetching pitches:', error);
        setError(error.message);
      }
    );

    return () => {
      unsubscribeSarees();
      unsubscribePitches();
    };
  }, []);

  const refreshSarees = async () => {
    // With Firestore real-time listeners, explicit refresh is usually not needed
    // but we'll keep the method for compatibility
  };

  const refreshPitches = async () => {
    // With Firestore real-time listeners, explicit refresh is usually not needed
    // but we'll keep the method for compatibility
  };

  const addPitch = async (sareeId: string, content: string, userId: string) => {
    try {
      await addDoc(collection(db, 'pitches'), {
        saree_id: sareeId,
        user_id: userId,
        content,
        created_at: new Date().toISOString()
      });

      await incrementPitchCount(sareeId);
    } catch (err: any) {
      console.error('Error adding pitch:', err);
      setError(err.message);
      throw err;
    }
  };

  const incrementPitchCount = async (sareeId: string) => {
    try {
      const sareeRef = doc(db, 'sarees', sareeId);
      const sareeDoc = await getDoc(sareeRef);
      
      if (sareeDoc.exists()) {
        await updateDoc(sareeRef, {
          pitch_count: (sareeDoc.data().pitch_count || 0) + 1
        });
      }
    } catch (err: any) {
      console.error('Error incrementing pitch count:', err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    sarees,
    pitches,
    loading,
    error,
    refreshSarees,
    refreshPitches,
    addPitch,
    incrementPitchCount
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
