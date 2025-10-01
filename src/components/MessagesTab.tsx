import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types/models';
import { MessageList } from '../components/MessageList';
import { markMessageAsRead, deleteMessage } from '../services/messageService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/loading';

export const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(messagesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        {!loading && (
          <div className="text-sm text-gray-500">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'} •{' '}
            {messages.filter(m => !m.isRead).length} unread
          </div>
        )}
      </div>

      <MessageList
        messages={messages}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        isLoading={loading}
      />
    </div>
  );
};