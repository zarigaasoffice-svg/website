import React from 'react';
import { ChatMessage, formatTimestamp } from '../lib/chat';
import { CloudinaryImage } from './CloudinaryImage';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwnMessage }) => {
  const bubbleClass = isOwnMessage
    ? 'ml-auto bg-blue-600 text-white'
    : 'mr-auto bg-gray-700 text-white';

  return (
    <div
      className={`flex flex-col max-w-[70%] mb-4 rounded-lg p-3 shadow ${bubbleClass}`}
    >
      {message.text && (
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
      )}
      {message.imageUrl && (
        <div className="mt-2 rounded-lg overflow-hidden">
          <CloudinaryImage
            src={message.imageUrl}
            alt="Chat attachment"
            className="max-w-full h-auto"
            width={400}
          />
        </div>
      )}
      <span className="text-xs opacity-75 mt-1 ml-auto">
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
};

// Scroll anchor component
export const ScrollAnchor = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} />
));