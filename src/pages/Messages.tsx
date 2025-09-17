import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, where, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import ProductSelector from '../components/ProductSelector';
import DirectMessage from '../components/DirectMessage';
import type { Saree } from '../contexts/DataContext';

interface Message {
  id: string;
  created_at: string;
  from_user: string;
  to_user: string;
  content: string;
  product_id?: string;
  product_name?: string;
  read: boolean;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);

  const handleProductSelect = (saree: Saree) => {
    setSelectedSaree(saree);
    setShowProductSelector(false);
  };

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('to_user', '==', user.id),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery,
      (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        setMessages(messageData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
      
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading) return <div className="p-4">Loading messages...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowProductSelector(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={20} />
          New Message
        </button>
      </div>

      {showProductSelector && (
        <ProductSelector 
          onSelect={handleProductSelect}
          onClose={() => setShowProductSelector(false)}
        />
      )}

      {selectedSaree && (
        <DirectMessage 
          saree={selectedSaree}
          onMessageSent={() => setSelectedSaree(null)}
        />
      )}

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg shadow ${
              message.read ? 'bg-white' : 'bg-blue-50'
            }`}
            onClick={() => !message.read && markAsRead(message.id)}
          >
            {message.product_id && (
              <div className="text-sm text-gray-500 mb-2">
                Re: {message.product_name}
              </div>
            )}
            <p className="mb-2">{message.content}</p>
            <div className="text-sm text-gray-500">
              From: {message.from_user}  {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No messages yet
          </div>
        )}
      </div>
    </div>
  );
}
