import { useEffect, useState } from 'react';
import { 
  onSnapshot, 
  QuerySnapshot, 
  FirestoreError,
  collection,
  query,
  where,
  orderBy,
  CollectionReference,
  Query,
  WhereFilterOp,
  OrderByDirection,
  DocumentData
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase-config';

interface FirestoreHookOptions {
  collection: string;
  where?: [string, WhereFilterOp, any][];
  orderBy?: [string, OrderByDirection][];
}

interface FirestoreHookResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  networkStatus: 'online' | 'offline' | 'error';
}

export function useFirestoreCollection<T extends DocumentData>(
  options: FirestoreHookOptions
): FirestoreHookResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'error'>('online');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setData([]);
      return;
    }

    // Create base query
    const collectionRef = collection(db, options.collection);
    let queryRef: Query = collectionRef;

    // Add where clauses if any
    if (options.where) {
      for (const [field, op, value] of options.where) {
        queryRef = query(queryRef, where(field, op as any, value));
      }
    }

    // Add orderBy if any
    if (options.orderBy) {
      for (const [field, direction] of options.orderBy) {
        queryRef = query(queryRef, orderBy(field, direction));
      }
    }

    const unsubscribe = onSnapshot(
      queryRef,
      {
        next: (snapshot: QuerySnapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Array<T & { id: string }>; // Ensure each document has an id field
          setData(docs);
          setLoading(false);
          setNetworkStatus('online');
          setError(null);
        },
        error: (err: FirestoreError) => {
          console.error('Firestore subscription error:', err);
          setError(err);
          setLoading(false);
          setNetworkStatus('error');
          
          // Handle specific error cases
          switch (err.code) {
            case 'permission-denied':
              setError(new Error('You do not have permission to access this data') as FirestoreError);
              break;
            case 'unavailable':
              setNetworkStatus('offline');
              break;
            default:
              setError(err);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [user, options.collection, JSON.stringify(options.where), JSON.stringify(options.orderBy)]);

  return { data, loading, error, networkStatus };
}