import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, CheckCircle, Mail, Package } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Types for messages and notifications
interface AdminMessage {
  id: string;
  user_email: string;
  message: string;
  timestamp: Timestamp;
  status: 'new' | 'read' | 'archived';
  type: 'admin' | 'user';
}

interface NotificationBadge {
  messages: number;
  pitches: number;
}

export default function AdminDashboard() {
  const { pitches } = useData();
  const { user: currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'sarees' | 'pitches' | 'adminMessages'>('sarees');
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationBadge>({ messages: 0, pitches: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load admin messages
  useEffect(() => {
    if (!isAdmin) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('type', '==', 'admin'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminMessage[];
      
      setAdminMessages(messages);
      setNotifications(prev => ({
        ...prev,
        messages: messages.filter(m => m.status === 'new').length
      }));
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Load pitch notifications
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'pitches'),
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

  const handleUpdateMessageStatus = async (messageId: string, status: AdminMessage['status']) => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        status,
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
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Error deleting message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with user info */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {currentUser?.displayName || 'Admin'}
                </span>
                <span className="text-xs text-gray-500">
                  {currentUser?.email}
                </span>
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
                activeTab === 'sarees'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="inline-block w-5 h-5 mr-1" />
              Sarees
            </button>
            <button
              onClick={() => setActiveTab('pitches')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeTab === 'pitches'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
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
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeTab === 'adminMessages'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
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
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-3 right-3"
            >
              ×
            </button>
          </div>
        )}

        {/* Admin Messages Tab */}
        {activeTab === 'adminMessages' && (
          <div className="space-y-4">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Admin Messages
                </h2>
                <div className="space-y-4">
                  {adminMessages.map((message) => (
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateMessageStatus(message.id, 'read')}
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
                      <p className="mt-2 text-sm text-gray-700">{message.message}</p>
                    </div>
                  ))}
                  {adminMessages.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No admin messages yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs will be implemented next */}
        {activeTab === 'sarees' && (
          <div>
            {/* Sarees content will be implemented */}
          </div>
        )}

        {activeTab === 'pitches' && (
          <div>
            {/* Pitches content will be implemented */}
          </div>
        )}
      </main>
    </div>
  );
}