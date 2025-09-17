import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  disabled: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (uid: string, currentRole: 'user' | 'admin') => {
    try {
      const userRef = doc(db, 'users', uid);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      setUsers(users.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      ));
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message);
    }
  };

  const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      const newStatus = !currentStatus;
      await updateDoc(userRef, {
        disabled: newStatus,
        updatedAt: new Date().toISOString()
      });
      setUsers(users.map(user => 
        user.uid === uid ? { ...user, disabled: newStatus } : user
      ));
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center py-4">Loading users...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map(user => (
            <li key={user.uid} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.displayName || 'Unnamed User'}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                    <br />
                    Last active: {new Date(user.lastLoginAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.disabled
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <button
                    onClick={() => toggleAdminRole(user.uid, user.role)}
                    className={`px-3 py-1 rounded text-sm ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => toggleUserStatus(user.uid, user.disabled)}
                    className={`px-3 py-1 rounded text-sm ${
                      user.disabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {user.disabled ? 'Enable' : 'Disable'}
                  </button>
                </div>
              </div>
            </li>
          ))}

          {users.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No users found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}