import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import type { Saree } from '../contexts/DataContext';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  saree: Saree;
}

export default function MessageModal({ isOpen, onClose, saree }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { addMessage } = useData();
  const [loading, setLoading] = useState(false);

  const [enquiryType, setEnquiryType] = useState('available');

  const enquiryTypes = [
    { id: 'available', label: 'Available more sarees?' },
    { id: 'general', label: 'General enquiry' },
    { id: 'others', label: 'Other questions' }
  ];

  const messageTemplates = {
    available: [
      'I would like to know if you have more sarees similar to this one.',
      'Do you have different color options for this saree?',
      'Are there similar designs available?'
    ],
    general: [
      'I would like to confirm my order for this saree.',
      'Is this saree still available?',
      'Can you provide more details about this saree?'
    ],
    others: [
      'I have some specific questions about this saree.',
      'I need to know about shipping options.',
      'I have a custom requirement.'
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await addMessage({
        content: message,
        referencePostId: saree.id,
        referencePostTitle: saree.name,
        userId: user.id,
        userEmail: user.email || 'unknown',
        createdAt: new Date(),
        isRead: false
      });
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-medium mb-4 pr-8">
          Enquire about {saree.name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Templates */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quick Messages
            </label>
            <div className="flex flex-wrap gap-2">
              {messageTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(template)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {template.length > 30 ? template.substring(0, 30) + '...' : template}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-lg min-h-[100px] resize-y"
              placeholder="Type your message here..."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <MessageCircle size={20} />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}