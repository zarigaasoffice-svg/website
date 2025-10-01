import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { ChatMessage, ChatUser, createMessage, getConversationId, uploadChatImage } from '../lib/chat';
import { ChatBubble, ScrollAnchor } from './ChatBubble';
import { Button } from './ui/button';
import { Upload, Send, ArrowLeft } from 'lucide-react';

interface AdminChatWindowProps {
  selectedUser: ChatUser;
  onBack?: () => void;
}

export const AdminChatWindow: React.FC<AdminChatWindowProps> = ({
  selectedUser,
  onBack
}) => {
  const { user: adminUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminUser || !selectedUser) return;

    const conversationId = getConversationId(selectedUser.id, adminUser.uid);
    const messagesRef = collection(db, 'messages', conversationId, 'chats');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(newMessages);

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [adminUser, selectedUser]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > maxSize) {
      setError('Image must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    if (!newMessage.trim() && !selectedFile) return;

    setError(null);
    setIsUploading(true);

    try {
      let imageUrl: string | undefined;
      
      if (selectedFile) {
        imageUrl = await uploadChatImage(selectedFile);
      }

      const conversationId = getConversationId(selectedUser.id, adminUser.uid);
      const messagesRef = collection(db, 'messages', conversationId, 'chats');
      
      const message = createMessage(
        adminUser.uid,
        selectedUser.id,
        newMessage.trim() || undefined,
        imageUrl
      );

      await addDoc(messagesRef, message);
      
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gray-800 flex items-center gap-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="text-gray-400 hover:text-white w-10 h-10 p-0 md:hidden"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-medium text-white">
            {selectedUser.displayName || selectedUser.email}
          </h2>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === adminUser?.uid}
          />
        ))}
        <ScrollAnchor ref={scrollRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-500/10 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="p-4 bg-gray-800">
        <div className="flex items-center gap-2">
          {selectedFile && (
            <div className="text-xs text-gray-400">
              Image selected: {selectedFile.name}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button
            type="button"
            onClick={handleFileSelect}
            variant="outline"
            className="text-gray-400 hover:text-white w-10 h-10 p-0"
            disabled={isUploading}
          >
            <Upload size={20} />
          </Button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <Button
            type="submit"
            variant="outline"
            className="text-gray-400 hover:text-white w-10 h-10 p-0"
            disabled={isUploading || (!newMessage.trim() && !selectedFile)}
          >
            <Send size={20} />
          </Button>
        </div>
      </form>
    </div>
  );
};