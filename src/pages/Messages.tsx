import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

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

interface ChatGroup {
  userId: string;
  userEmail: string;
  lastMessage: Message;
  unreadCount: number;
}

export default function Messages() {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Get all messages for admin
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setAllMessages(messages);

      // Group messages by user
      const groups = messages.reduce((acc: { [key: string]: ChatGroup }, message) => {
        const userId = message.from_user === user.uid ? message.to_user : message.from_user;
        const userEmail = message.from_user === user.uid ? message.to_user : message.from_user;

        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userEmail,
            lastMessage: message,
            unreadCount: !message.read && message.to_user === user.uid ? 1 : 0
          };
        } else {
          if (!message.read && message.to_user === user.uid) {
            acc[userId].unreadCount++;
          }
          if (new Date(message.created_at) > new Date(acc[userId].lastMessage.created_at)) {
            acc[userId].lastMessage = message;
          }
        }
        return acc;
      }, {});

      setChatGroups(Object.values(groups).sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      ));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching messages:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedChat || !user) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        content: replyMessage,
        from_user: user.uid,
        to_user: selectedChat,
        created_at: serverTimestamp(),
        read: false
      });

      setReplyMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const getSelectedChatMessages = () => {
    if (!selectedChat || !user) return [];
    return allMessages
      .filter(m => 
        (m.from_user === selectedChat && m.to_user === user.uid) ||
        (m.from_user === user.uid && m.to_user === selectedChat)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const markAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      // Mark all messages from selected user as read
      const unreadMessages = getSelectedChatMessages()
        .filter(m => !m.read && m.to_user === user?.uid);
      
      unreadMessages.forEach(message => {
        markAsRead(message.id);
      });
    }
  }, [selectedChat, allMessages]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto px-4 py-8 text-red-500">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-black/20 backdrop-blur-sm rounded-lg shadow-lg min-h-[600px] flex">
        {/* Chat List */}
        <div className="w-full md:w-1/3 border-r border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-rose-gold">Messages</h2>
          </div>
          <div className="overflow-y-auto h-[calc(600px-4rem)]">
            {chatGroups.map((group) => (
              <button
                key={group.userId}
                onClick={() => setSelectedChat(group.userId)}
                className={`w-full p-4 flex items-start space-x-4 hover:bg-gray-800/50 transition-colors duration-200 ${
                  selectedChat === group.userId ? 'bg-gray-800/50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-rose-gold/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-rose-gold" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {group.userEmail}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(group.lastMessage.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400 truncate">{group.lastMessage.content}</p>
                  {group.unreadCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-gold/20 text-rose-gold mt-2">
                      {group.unreadCount} new
                    </span>
                  )}
                  {group.lastMessage.product_name && (
                    <p className="mt-1 text-xs text-gray-500">
                      Re: {group.lastMessage.product_name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="hidden md:flex flex-col w-2/3">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-medium text-gray-200">
                  {chatGroups.find(g => g.userId === selectedChat)?.userEmail}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {getSelectedChatMessages().map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.from_user === user?.uid ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[75%] break-words rounded-lg px-4 py-2 shadow ${
                      message.from_user === user?.uid
                        ? 'bg-rose-gold/20 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}>
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
              <div className="p-4 border-t border-gray-800">
                <div className="flex space-x-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 max-h-32 min-h-[2.5rem]"
                    style={{ resize: 'none' }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyMessage.trim()}
                    className={`px-4 py-2 bg-rose-gold text-black rounded-lg transition-all duration-300 ${
                      sending || !replyMessage.trim() 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-rose-gold/80 hover:shadow-lg hover:shadow-rose-gold/25'
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
