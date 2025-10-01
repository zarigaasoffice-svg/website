import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatUser } from '../lib/chat';
import { Search } from 'lucide-react';

interface AdminChatListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUserId?: string;
}

export const AdminChatList: React.FC<AdminChatListProps> = ({
  onSelectUser,
  selectedUserId
}) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get users who have had conversations
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'), orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const chatUsers = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ChatUser[];

        setUsers(chatUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        {error}
      </div>
    );
  }

  const formatLastActive = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Never';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No users found
          </div>
        ) : (
          filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full p-4 flex items-center gap-4 hover:bg-gray-800 transition-colors ${
                selectedUserId === user.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-white">
                  {user.displayName || user.email}
                </div>
                {user.lastMessage && (
                  <div className="text-sm text-gray-400 truncate">
                    {user.lastMessage}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatLastActive(user.lastMessageTime)}
              </div>
              {user.unreadCount && user.unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {user.unreadCount}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};