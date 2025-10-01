import React from 'react';
import { format } from 'date-fns';
import { Trash2, Check, Mail } from 'lucide-react';
import type { Message } from '../types/models';
import { LoadingSpinner } from './ui/loading';

interface MessageListProps {
  messages: Message[];
  onMarkAsRead: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMarkAsRead,
  onDelete,
  isLoading = false,
}) => {
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    let date;
    try {
      date = format(
        message.createdAt instanceof Date 
          ? message.createdAt 
          : message.createdAt.toDate 
            ? message.createdAt.toDate() 
            : new Date(message.createdAt),
        'yyyy-MM-dd'
      );
    } catch (error) {
      console.error('Error formatting date:', error);
      date = format(new Date(), 'yyyy-MM-dd');
    }
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Mail className="w-12 h-12 mb-4" />
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500">
            {format(new Date(date), 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-4">
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${
                  !message.isRead ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{message.userName || message.userEmail}</p>
                    <p className="text-sm text-gray-500">
                      {format(
                        message.createdAt instanceof Date ? message.createdAt : message.createdAt.toDate(),
                        'h:mm a'
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!message.isRead && (
                      <button
                        onClick={() => onMarkAsRead(message.id)}
                        className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(message.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};