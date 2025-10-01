import { Timestamp } from 'firebase/firestore';

export interface Saree {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description?: string;
  priceType: 'fixed' | 'dm';
  pitch_count?: number;
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

export interface Message {
  id: string;
  userId: string;
  userName?: string;
  userEmail: string;
  content: string;
  isRead: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reply?: string;
  repliedAt?: Timestamp;
  isReplied?: boolean;
  status: 'new' | 'read' | 'archived';
  referencePostId?: string;
  referencePostTitle?: string;
  type?: 'admin' | 'user';
}

export interface Pitch {
  id: string;
  userId: string;
  sareeId: string;
  pitch: string;
  message: string;
  name: string;
  email: string;
  phone?: string;
  sareeName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reply?: string;
  repliedAt?: Timestamp;
  proposedPrice?: number;
}

// Input types for creating/updating
export type CreateSareeInput = Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSareeInput = Partial<Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>>;
export type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateMessageInput = Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>;
export type CreatePitchInput = Omit<Pitch, 'id' | 'createdAt' | 'updatedAt' | 'status'>;