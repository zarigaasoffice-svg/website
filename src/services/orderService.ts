import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order, CreateOrderInput } from '../types/models';

const COLLECTION_NAME = 'orders';
const orderCollection = collection(db, COLLECTION_NAME);

export const createOrder = async (orderData: CreateOrderInput): Promise<string> => {
  try {
    const docRef = await addDoc(orderCollection, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      orderCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status']
): Promise<void> => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return {
        id: orderSnap.id,
        ...orderSnap.data()
      } as Order;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};