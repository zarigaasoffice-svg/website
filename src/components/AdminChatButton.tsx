import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  content: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
  isAdmin: boolean;
  isRead: boolean;
}

export default function AdminChatButton() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat && user) {
      loadMessages();
    }
  };

  const loadMessages = () => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          userId: data.userId,
          userEmail: data.userEmail,
          createdAt: data.createdAt?.toDate() || new Date(),
          isAdmin: data.isAdmin || false,
          isRead: data.isRead || false
        } as Message;
      });
      
      setMessages(messagesList.reverse());
      scrollToBottom();
    });

    return unsubscribe;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        content: message,
        userId: user.uid,
        userEmail: user.email || '',
        createdAt: serverTimestamp(),
        isAdmin: false,
        isRead: false
      });

      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showChat && user) {
      const unsubscribe = loadMessages();
      return () => unsubscribe?.();
    }
  }, [showChat, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {showChat && (
        <div className="mb-4 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-sm md:w-96 overflow-hidden transform transition-all duration-300">
          <div className="p-4 bg-rose-gold/10 backdrop-blur-sm border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-rose-gold">Chat with Admin</h3>
            <button 
              onClick={toggleChat}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors duration-300"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="h-96 p-4 overflow-y-auto bg-gray-900/50">
            {user ? (
              <div className="flex flex-col space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`max-w-[75%] break-words rounded-lg px-4 py-2 shadow ${
                        msg.isAdmin 
                          ? 'bg-gray-800 text-gray-100' 
                          : 'bg-rose-gold/20 text-white'
                      }`}>
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 text-gray-400">
                          {msg.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No messages yet</p>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-center">Please login to chat with admin</p>
              </div>
            )}
          </div>
          {user && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex space-x-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 max-h-32 min-h-[2.5rem]"
                  style={{ resize: 'none' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !message.trim()}
                  className={`px-4 py-2 bg-rose-gold text-black rounded-lg transition-all duration-300 ${
                    loading || !message.trim() 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-rose-gold/80 hover:shadow-lg hover:shadow-rose-gold/25'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`p-4 bg-rose-gold rounded-full shadow-lg hover:shadow-rose-gold/25 hover:bg-rose-gold/80 transition-all duration-300 transform hover:-translate-y-1 ${
          showChat ? 'rotate-180' : ''
        }`}
      >
        <MessageSquare className="w-6 h-6 text-black" />
      </button>
    </div>
  );
}