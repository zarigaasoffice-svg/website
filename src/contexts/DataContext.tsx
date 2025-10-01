import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  limit,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';

import { db } from '../lib/firebase';

export interface SareeBase {
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  category: string;
  priceType: 'fixed' | 'dm';
  stock: number;
  pitch_count?: number;
}

export interface AdminMessage {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  content: string;
  referencePostId?: string;
  referencePostTitle?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isRead: boolean;
  reply?: string;
  repliedAt?: Timestamp;
  type?: 'enquiry' | 'feedback' | 'other';
}

export interface SareeData extends SareeBase {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Saree extends SareeBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pitch {
  id: string;
  sareeId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  pitch: string;
  message: string;
  sareeName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reply?: string;
  repliedAt?: Timestamp;
  proposedPrice?: number;
}

interface DataContextType {
  sarees: Saree[];
  pitches: Pitch[];
  loading: boolean;
  error: string | null;
  refreshSarees: () => Promise<void>;
  refreshPitches: () => Promise<void>;
  addPitch: (
    sareeId: string,
    message: string,
    userId: string,
    name: string,
    email: string,
    phone: string,
    proposedPrice?: number
  ) => Promise<void>;
  addMessage: (message: Omit<AdminMessage, 'id' | 'createdAt'>) => Promise<void>;
  getMessages: (userId: string) => Promise<AdminMessage[]>;
  incrementPitchCount: (sareeId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug log whenever pitches state changes
  useEffect(() => {
    console.log('Pitches state updated:', {
      count: pitches.length,
      pitches
    });
  }, [pitches]);

  useEffect(() => {
    const cleanup = {
      pitches: undefined as (() => void) | undefined,
      sarees: undefined as (() => void) | undefined,
      messages: undefined as (() => void) | undefined
    };
    
    const setupListeners = async () => {
      setLoading(true);
      console.log('Setting up real-time listeners...');

      // Subscribe to messages collection
      const messagesQuery = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc')
      );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log('Received messages update');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            console.log('New message:', change.doc.data());
          }
        });
      },
      (error) => {
        console.error('Error in messages listener:', error);
        setError(error.message);
      }
    );

    // Subscribe to sarees collection with real-time updates
    const sareesQuery = query(collection(db, 'sarees'), orderBy('createdAt', 'desc'));    const unsubscribeSarees = onSnapshot(sareesQuery,
      (snapshot) => {
        console.log('Received sarees update');
        
        // Log changes for debugging
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            console.log('New saree added:', change.doc.id);
          } else if (change.type === 'modified') {
            console.log('Saree modified:', change.doc.id);
          } else if (change.type === 'removed') {
            console.log('Saree removed:', change.doc.id);
          }
        });

        const sareeData: Saree[] = snapshot.docs.map((doc): Saree => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            price: typeof data.price === 'number' ? data.price : 0,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            category: data.category || '',
            priceType: data.priceType || 'fixed',
            pitch_count: data.pitch_count || 0,
            stock: typeof data.stock === 'number' ? data.stock : 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
          
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

    // Subscribe to pitches collection with real-time updates
    // Set up query for pitches collection
    console.log('Setting up pitches listener...');
    
    const pitchesRef = collection(db, 'pitches');
    
    // Set up real-time listener with different field name attempts
    const setupPitchesListener = async () => {
      try {
        // First check which fields exist in the documents
        const initialDocs = await getDocs(pitchesRef);
        console.log('Initial pitches check:', {
          empty: initialDocs.empty,
          size: initialDocs.size,
          fields: initialDocs.empty ? [] : Object.keys(initialDocs.docs[0].data()),
          example: initialDocs.empty ? null : initialDocs.docs[0].data()
        });

        // Try different field names for timestamps
        let queryField = 'createdAt';
        if (!initialDocs.empty) {
          const firstDoc = initialDocs.docs[0].data();
          if (firstDoc.created_at) queryField = 'created_at';
          else if (firstDoc.timestamp) queryField = 'timestamp';
        }

        console.log('Using timestamp field:', queryField);

        // Set up the real-time listener
        const listener = onSnapshot(
          query(pitchesRef, orderBy(queryField, 'desc')),
          (snapshot) => {
            console.log('Received pitches update:', {
              size: snapshot.size,
              fields: snapshot.empty ? [] : Object.keys(snapshot.docs[0]?.data() || {}),
              firstDoc: snapshot.empty ? null : snapshot.docs[0]?.data()
            });

            const updatedPitches = snapshot.docs.map((doc): Pitch => {
              const data = doc.data();
              console.log('Processing document:', { 
                id: doc.id, 
                fields: Object.keys(data),
                createdAt: data.created_at,
                timestamp: data.timestamp,
                sareeId: data.saree_id || data.sareeId,
                userId: data.user_id || data.userId,
                status: data.status,
                content: data.content,
                message: data.message
              });
              
              // Handle different field name formats
              const timestamp = data.created_at || data.createdAt || data.timestamp;
              if (!timestamp) {
                console.warn('No timestamp found for document:', doc.id);
              }
              
              const createdAt = timestamp || Timestamp.now();
              const updatedAt = data.updated_at || data.updatedAt || createdAt;
              
              const pitch: Pitch = {
                id: doc.id,
                userId: data.userId || data.user_id || '',
                sareeId: data.sareeId || data.saree_id || '',
                name: data.name || '',
                email: data.email || '',
                pitch: data.content || data.pitch || '',
                message: data.message || data.content || '',
                sareeName: data.sareeName || data.saree_name || '',
                status: (data.status as Pitch['status']) || 'pending',
                createdAt: data.createdAt || data.created_at || createdAt,
                updatedAt: data.updatedAt || data.updated_at || createdAt,
                reply: data.reply || '',
                repliedAt: data.repliedAt || data.replied_at,
                proposedPrice: data.proposedPrice || data.proposed_price || undefined
              };

              console.log('Mapped pitch:', pitch);
              return pitch;
            });

            console.log('Setting pitches state:', {
              count: updatedPitches.length,
              data: updatedPitches
            });
            setPitches(updatedPitches);
            setError(null);
          },
          (error) => {
            console.error('Error in pitches listener:', error);
            setError(`Failed to load pitches: ${error.message}`);
            setPitches([]);
          }
        );

        return () => {
          console.log('Unsubscribing from pitches listener');
          listener();
        };
      } catch (err) {
        console.error('Error setting up pitches listener:', err);
        setError(`Failed to initialize pitches: ${err instanceof Error ? err.message : String(err)}`);
        return () => {}; // Return no-op cleanup if setup fails
      }
    };

    // The cleanup function will be returned

    // Cleanup function will be set when the listener is initialized above

      // Set up initial listeners
      const pitchesCleanup = await setupPitchesListener();
      cleanup.pitches = pitchesCleanup;
      cleanup.sarees = unsubscribeSarees;
      cleanup.messages = unsubscribeMessages;
    };

    // Start the listeners
    setupListeners();

    // Return cleanup function
    return () => {
      console.log('Component unmounting, cleaning up listeners...');
      cleanup.pitches?.();
      cleanup.sarees?.();
      cleanup.messages?.();
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

  const addPitch = async (sareeId: string, message: string, userId: string, name: string, email: string, phone: string, proposedPrice?: number) => {
    try {
      console.log('Starting addPitch operation with:', {
        sareeId,
        userId,
        name,
        email,
        phone,
        message,
        proposedPrice
      });

      // Get the saree name first
      const sareeDoc = await getDoc(doc(db, 'sarees', sareeId));
      console.log('Saree document fetch result:', {
        exists: sareeDoc.exists(),
        id: sareeDoc.id,
        data: sareeDoc.data()
      });

      if (!sareeDoc.exists()) {
        throw new Error('Saree not found');
      }
      const sareeName = sareeDoc.data()?.name || '';

      // Create the pitch document
      const timestamp = serverTimestamp();
      const pitchData = {
        sareeId,
        userId,
        name,
        email,
        phone,
        content: message,  // Store message as content for consistency
        message: message,  // Keep a separate message field
        sareeName,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        proposedPrice: proposedPrice || undefined
      };

      console.log('About to add pitch with data:', pitchData);

      // Verify collection existence and our ability to write
      const pitchesRef = collection(db, 'pitches');
      const testQuery = await getDocs(query(pitchesRef, limit(1)));
      console.log('Collection check:', {
        exists: !testQuery.empty || true, // Collection might be empty but still valid
        readAccess: true
      });

      const docRef = await addDoc(pitchesRef, pitchData);
      console.log('Successfully added pitch:', {
        id: docRef.id,
        path: docRef.path
      });

      await incrementPitchCount(sareeId);
      console.log('Incremented pitch count for saree:', sareeId);
    } catch (err: any) {
      console.error('Error adding pitch:', err);
      setError(`Failed to add pitch: ${err.message}`);
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

    const addMessage = async (message: Omit<AdminMessage, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const messageData = {
        ...message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isRead: false,
        type: message.type || 'enquiry'
      };
      console.log('Adding new message:', messageData);
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Message added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };

  const getMessages = async (userId: string): Promise<AdminMessage[]> => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      // Note: You'll need to create a composite index for this query.
      // Use this command in the Firebase CLI:
      // firebase firestore:index:create --collection messages --fields userId,createdAt
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as AdminMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
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
    addMessage,
    getMessages,
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
