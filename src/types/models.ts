import { Timestamp } from 'firebase/firestore';

export interface Saree {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  sareeId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input types for creating/updating
export type CreateSareeInput = Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSareeInput = Partial<Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>>;
export type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;