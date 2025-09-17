import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Saree } from '../contexts/DataContext';

interface DirectMessageProps {
  saree: Saree;
  onMessageSent: () => void;
}

export default function DirectMessage({ saree, onMessageSent }: DirectMessageProps) {
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
        from_user: user.id,
        to_user: process.env.VITE_ADMIN_USER_ID,
        created_at: new Date().toISOString(),
        read: false,
        product_id: saree.id,
        product_name: saree.name
      });

      setMessage('');
      onMessageSent();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="text-sm text-gray-500 mb-4">
        Sending message about: {saree.name}
      </div>
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        rows={4}
        placeholder="Type your message..."
        disabled={loading}
      />

      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !message.trim()}
        className={`
          w-full py-2 px-4 rounded
          ${loading || !message.trim()
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'}
          text-white
        `}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
}
