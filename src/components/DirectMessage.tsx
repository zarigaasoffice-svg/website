import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Saree } from '../contexts/DataContext';

interface DirectMessageProps {
  saree?: Saree;
  className?: string;
  onMessageSent?: () => void;
}

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-2 border-rose-gold border-t-transparent" />
);

export default function DirectMessage({ saree, className, onMessageSent }: DirectMessageProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        content: message,
        userId: user.uid,
        userEmail: user.email || '',
        createdAt: new Date(),
        isRead: false,
        isAdmin: false,
        ...(saree && {
          product_id: saree.id,
          product_name: saree.name
        })
      });

      setMessage('');
      onMessageSent?.();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mb-6 p-4 bg-black/20 backdrop-blur-sm rounded-lg shadow ${className || ''}`}>
      {saree && (
        <div className="text-sm text-gray-300 mb-4">
          Sending message about: {saree.name}
        </div>
      )}
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mb-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-gold/50"
        rows={4}
        placeholder="Type your message..."
        disabled={loading}
      />

      {error && (
        <div className="text-red-400 mb-4 bg-red-900/20 p-3 rounded-lg">
          Error: {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !message.trim()}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2
          ${loading || !message.trim()
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-rose-gold hover:bg-rose-gold/80 text-black hover:shadow-lg hover:shadow-rose-gold/25 transform hover:-translate-y-0.5'}
        `}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span>Sending...</span>
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </div>
  );
}
