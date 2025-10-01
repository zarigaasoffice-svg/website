import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MessageCircle,
  Lightbulb,
  Menu,
  Bell,
  X,
  Plus,
  Search,
  Mail,
  Trash2,
  CheckCircle,
  Edit2,
  XCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/loading';
import type { Message, Saree } from '.                                  {message.userEmail}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {message.createdAt.toLocaleString()}pes/models';
import { MessageList } from '../components/MessageList';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm } from '../components/ProductForm';
import { PitchesTab } from '../components/PitchesTab';
import { Dialog } from '@headlessui/react';

interface NewSareeForm {
  name: string;
  description: string;
  priceType: 'fixed' | 'dm';
  price: string;
  stock: number;
  imageUrl: string;
  category?: string;
}

interface NotificationBadge {
  messages: number;
  pitches: number;
}

interface MessageWithSaree extends Message {
  saree?: Saree;
}

interface DashboardStats {
  totalSarees: number;
  totalPitches: number;
  pendingEnquiries: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const { user: currentUser, isAdmin } = useAuth();

  // State variables
  const [activeTab, setActiveTab] = useState<'sarees' | 'pitches' | 'adminMessages'>('sarees');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [messages, setMessages] = useState<MessageWithSaree[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [sareeToDelete, setSareeToDelete] = useState<string | null>(null);
  const [newSaree, setNewSaree] = useState<NewSareeForm>({
    name: '',
    description: '',
    priceType: 'fixed',
    price: '',
    stock: 1,
    imageUrl: '',
    category: ''
  });
  const [showAddSareeForm, setShowAddSareeForm] = useState(false);
  const [notifications, setNotifications] = useState<NotificationBadge>({ messages: 0, pitches: 0 });

  // Load admin messages and pitches
  useEffect(() => {
    if (!isAdmin) return;

    // Set up messages listener
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc')
    );

    const messageUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as MessageWithSaree[];

      setMessages(messageData);
      setNotifications(prev => ({
        ...prev,
        messages: messageData.filter(m => !m.isRead).length
      }));
    });

    // Set up pitches listener
    const pitchesRef = collection(db, 'pitches');
    const pitchesQuery = query(pitchesRef, orderBy('createdAt', 'desc'));

    const pitchesUnsubscribe = onSnapshot(pitchesQuery, (snapshot) => {
      const pitches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pitch[];

      setPitches(pitches);
      setNotifications(prev => ({
        ...prev,
        pitches: pitches.filter(p => p.status === 'pending').length
      }));
    });

    return () => {
      messageUnsubscribe();
      pitchesUnsubscribe();
    };
  }, [isAdmin]);

  // Load pitch notifications
  useEffect(() => {
    if (!isAdmin) return;

    const pitchesRef = collection(db, 'pitches');
    const q = query(
      pitchesRef,
      where('status', '==', 'new'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(prev => ({
        ...prev,
        pitches: snapshot.docs.length
      }));
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Auth state
  const { user, isAdmin: admin, loading: authLoading } = useAuth();

  // Stats state
  const [stats, setStats] = useState<DashboardStats>({
    totalSarees: 0,
    totalPitches: 0,
    pendingEnquiries: 0,
    unreadMessages: 0
  });

  // Effect to calculate stats
  useEffect(() => {
    if (!sarees || !messages) return;

    const totalSarees = sarees.length;
    const totalPitches = sarees.reduce((sum, s) => sum + (s.pitch_count || 0), 0);
    const pendingEnquiries = messages.filter(m => !m.isRead && m.referencePostId).length;
    const unreadMessages = messages.filter(m => !m.isRead && !m.referencePostId).length;

    setStats({
      totalSarees,
      totalPitches,
      pendingEnquiries,
      unreadMessages
    });
  }, [sarees, messages]);

  // Handlers
  const handleAddNewSaree = async () => {
    try {
      if (!newSaree.name || !newSaree.imageUrl) {
        toast.error('Name and image URL are required');
        return;
      }

      const sareeData = {
        name: newSaree.name,
        description: newSaree.description,
        priceType: newSaree.priceType,
        price: newSaree.priceType === 'fixed' ? parseFloat(newSaree.price) || 0 : 0,
        stock: newSaree.stock,
        imageUrl: newSaree.imageUrl,
        category: newSaree.category || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'sarees'), sareeData);
      toast.success('New saree added successfully');
      setShowAddSareeForm(false);
      setNewSaree({
        name: '',
        description: '',
        priceType: 'fixed',
        price: '',
        stock: 1,
        imageUrl: '',
        category: ''
      });
    } catch (err) {
      console.error('Error adding new saree:', err);
      toast.error('Failed to add new saree');
    }
  };

  const handleUpdateMessageStatus = async (messageId: string) => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating message status:', err);
      setError(err instanceof Error ? err.message : 'Error updating message status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Error deleting message');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSaree = async (id: string, updates: Partial<Saree>) => {
    try {
      const sareeRef = doc(db, 'sarees', id);
      await updateDoc(sareeRef, updates);
      toast.success('Saree updated successfully');
    } catch (err) {
      console.error('Error updating saree:', err);
      setError('Failed to update saree');
      toast.error('Failed to update saree');
    }
  };

  const handleDeleteClick = (id: string) => {
    setSareeToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!sareeToDelete) return;

    try {
      const sareeRef = doc(db, 'sarees', sareeToDelete);
      await deleteDoc(sareeRef);
      toast.success('Saree deleted successfully');
      setShowDeleteConfirmation(false);
      setSareeToDelete(null);
    } catch (err) {
      console.error('Error deleting saree:', err);
      setError('Failed to delete saree');
      toast.error('Failed to delete saree');
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    try {
      const messageRef = doc(db, 'messages', id);
      await updateDoc(messageRef, { isRead: true });
      toast.success('Message marked as read');
    } catch (err) {
      console.error('Error marking message as read:', err);
      setError('Failed to update message');
      toast.error('Failed to update message');
    }
  };

  // Subscribe to data
  useEffect(() => {
    if (!isAdmin) return;

    const sareesRef = collection(db, 'sarees');
    const messagesRef = collection(db, 'messages');

    const unsubSarees = onSnapshot(
      query(sareesRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const sareesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Saree[];

        setSarees(sareesData);
      },
      (error) => {
        console.error('Error in sarees subscription:', error);
        setError('Failed to load sarees data');
        setLoading(false);
      }
    );

    const unsubMessages = onSnapshot(
      query(messagesRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as MessageWithSaree[];

        setMessages(messagesData);
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        setError('Failed to load messages data');
        setLoading(false);
      }
    );

    return () => {
      unsubSarees();
      unsubMessages();
    };
  }, [isAdmin]);

  // UI state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <svg
            className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4.293 4.293a1 1 0 011.414 0L12 10.586l6.293-6.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z"
            />
          </svg>
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      {/* Header with user info */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{currentUser?.displayName || 'Admin'}</span>
                <span className="text-xs text-gray-500">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-3">
            <button
              onClick={() => setActiveTab('sarees')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'sarees' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="inline-block w-5 h-5 mr-1" />
              Sarees
            </button>

            <button
              onClick={() => setActiveTab('pitches')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'pitches' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="inline-block w-5 h-5 mr-1" />
              Pitches
              {notifications.pitches > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {notifications.pitches}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('adminMessages')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'adminMessages' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mail className="inline-block w-5 h-5 mr-1" />
              Admin Messages
              {notifications.messages > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {notifications.messages}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-4 rounded shadow border-l-4 border-blue-500"
          >
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Total Sarees</h3>
            <p className="text-2xl">{stats.totalSarees}</p>
            <p className="text-sm text-gray-500 mt-1">Listed products</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-4 rounded shadow border-l-4 border-green-500"
          >
            <h3 className="text-lg font-semibold mb-2 text-green-700">Total Pitches</h3>
            <p className="text-2xl">{stats.totalPitches}</p>
            <p className="text-sm text-gray-500 mt-1">Customer interactions</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-4 rounded shadow border-l-4 border-yellow-500"
          >
            <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Enquiries</h3>
            <p className="text-2xl">{stats.pendingEnquiries}</p>
            <p className="text-sm text-gray-500 mt-1">Product-related queries</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-4 rounded shadow border-l-4 border-purple-500"
          >
            <h3 className="text-lg font-semibold mb-2 text-purple-700">Unread Messages</h3>
            <p className="text-2xl">{stats.unreadMessages}</p>
            <p className="text-sm text-gray-500 mt-1">General communications</p>
          </motion.div>
        </motion.div>

        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sarees')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'sarees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Sarees ({sarees.length})
              </button>

              <button
                onClick={() => setActiveTab('pitches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'pitches'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Pitches ({stats.totalPitches})
              </button>

              <button
                onClick={() => setActiveTab('sarees')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'sarees'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Enquiries ({stats.pendingEnquiries})
              </button>

              <button
                onClick={() => setActiveTab('adminMessages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'adminMessages'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"/>
                </svg>
                Messages ({stats.unreadMessages})
              </button>
            </nav>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'sarees' && (
            <motion.div
              key="sarees"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sarees..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="all">All Price Types</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="dm">DM Price</option>
                  </select>
                </div>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="divide-y divide-gray-200">
                  {sarees.map((saree) => (
                    <motion.div
                      key={saree.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6"
                    >
                      <div className="flex items-start space-x-6">
                        <img
                          src={saree.imageUrl}
                          alt={saree.name}
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{saree.name}</h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateSaree(saree.id, {
                                  stock: saree.stock === 0 ? 1 : 0
                                })}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                Toggle Stock
                              </button>
                              <button
                                onClick={() => handleDeleteClick(saree.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                              ${saree.priceType === 'fixed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {saree.priceType === 'fixed' ? 'Fixed Price' : 'DM Price'}
                            </span>
                            {saree.priceType === 'fixed' && (
                              <span className="text-gray-500">₹{saree.price}</span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                              ${saree.stock > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {saree.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          {saree.description && (
                            <p className="mt-2 text-sm text-gray-500">{saree.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'adminMessages' && (
            <motion.div
              key="adminMessages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Admin Messages
                  </h2>

                  {/* Early return for unauthorized access */}
                  {!isAdmin ? (
                    <div className="p-4 text-center text-gray-500">
                      Unauthorized: Admin access required
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No messages yet
                        </p>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`border rounded-lg p-4 ${
                              message.status === 'new'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {message.user_email}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {message.timestamp.toDate().toLocaleString()}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <button
                                  onClick={() => handleUpdateMessageStatus(message.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  disabled={loading || message.status === 'read'}
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-red-600 hover:text-red-800"
                                  disabled={loading}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">{message.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}