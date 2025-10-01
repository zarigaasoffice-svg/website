import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  from_user: string;
  to_user: string;
  created_at: string;
  read: boolean;
  product_id?: string;
  product_name?: string;
}

export function FloatingChatButton({ productId = '', productName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Query for messages specific to the current user
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('from_user', 'in', [user.uid, 'ADMIN']),
      where('to_user', 'in', [user.uid, 'ADMIN']),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      setMessages(newMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));

      // Update unread count
      const unread = newMessages.filter(
        msg => !msg.read && msg.to_user === user.uid
      ).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Mark messages as read
      messages.forEach(async (message) => {
        if (!message.read && message.to_user === user?.uid) {
          const messageRef = doc(db, 'messages', message.id);
          await updateDoc(messageRef, { read: true });
        }
      });
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        content: newMessage,
        from_user: user.uid,
        to_user: 'ADMIN',
        created_at: serverTimestamp(),
        read: false,
        product_id: productId,
        product_name: productName
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleChat}
        className="relative bg-rose-gold hover:bg-rose-gold/80 text-black p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        {!isOpen ? <MessageCircle size={24} /> : <X size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[350px] bg-black/20 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden"
          >
            <div className="h-[450px] flex flex-col">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-medium text-rose-gold">Chat with Admin</h3>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.from_user === user?.uid ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] break-words rounded-lg px-4 py-2 shadow ${
                        message.from_user === user?.uid
                          ? 'bg-rose-gold/20 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      {message.product_name && (
                        <div className="mb-2 text-xs text-gray-400 border-b border-gray-700 pb-2">
                          Re: {message.product_name}
                        </div>
                      )}
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 text-gray-400">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-gold/50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className={`px-4 py-2 bg-rose-gold text-black rounded-lg transition-all duration-300 ${
                      loading || !newMessage.trim()
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
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}