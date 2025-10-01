import React from 'react';
import { AdminChatList } from './AdminChatList';
import { AdminChatWindow } from './AdminChatWindow';
import { ChatUser } from '../lib/chat';

interface AdminChatProps {
  className?: string;
}

export const AdminChat: React.FC<AdminChatProps> = ({ className = '' }) => {
  const [selectedUser, setSelectedUser] = React.useState<ChatUser | null>(null);

  return (
    <div className={`grid md:grid-cols-[320px,1fr] gap-4 bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <div className={`${selectedUser ? 'hidden md:block' : ''}`}>
        <AdminChatList
          selectedUserId={selectedUser?.id}
          onSelectUser={setSelectedUser}
        />
      </div>
      {selectedUser ? (
        <AdminChatWindow
          selectedUser={selectedUser}
          onBack={() => setSelectedUser(null)}
        />
      ) : (
        <div className="hidden md:flex items-center justify-center text-gray-500">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};