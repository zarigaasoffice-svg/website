import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Upload, Save, Package, MessageCircle, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from '@firebase/storage';
import { db, storage } from '../lib/firebase';
import { Button } from '../components/ui/button';

// Base types
import { SareeBase, Saree as SareeType } from '../contexts/DataContext';

// Admin message interface
interface AdminMessage {
  id?: string;
  userId: string;
  userEmail: string;
  content: string;
  imageUrl?: string;
  referencePostId?: string;
  referencePostTitle?: string;
  createdAt: Date;
  isRead: boolean;
}

// Form interface that extends base but has string price for inputs
interface SareeFormData extends Omit<SareeBase, 'price'> {
  id?: string;
  price: string;  // Price as string for form input
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin tabs type
type AdminTab = 'sarees' | 'users' | 'stats' | 'pitches' | 'adminMessages';

// Use imported type
type Saree = SareeType;

// Main component
export default function AdminDashboard() {
  const { sarees, pitches, refreshSarees } = useData();
  const { user: currentUser, isAdmin } = useAuth();

  // States
  const [activeTab, setActiveTab] = useState<AdminTab>('sarees');
  const [showAddSaree, setShowAddSaree] = useState(false);
  const [editingSaree, setEditingSaree] = useState<SareeFormData | null>(null);
  const [newSaree, setNewSaree] = useState<SareeFormData>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    price_type: 'fixed',
    stock_status: 'in_stock',
    pitch_count: 0
  });

  // Error and loading states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Message states
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [showMessageCompose, setShowMessageCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    content: '',
    imageUrl: '',
    referencePostId: '',
    referencePostTitle: ''
  });

  const checkAdminAccess = () => {
    if (!currentUser) {
      setError('Authentication required');
      return false;
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      return false;
    }
    
    return true;
  };
  // Users state
  const [users, setUsers] = useState<Array<{
    uid: string;
    email: string;
    displayName?: string;
    role: 'admin' | 'user';
    lastLoginAt?: Timestamp;
  }>>([]);

  // Load messages
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = collection(db, 'adminMessages');
    const q = isAdmin 
      ? query(messagesRef, orderBy('createdAt', 'desc'))
      : query(messagesRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminMessage[];
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  // Load users when users tab is active
  useEffect(() => {
    if (activeTab !== 'users' || !isAdmin) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Array<{
        uid: string;
        email: string;
        displayName?: string;
        role: 'admin' | 'user';
        lastLoginAt?: Timestamp;
      }>;
      setUsers(userData);
    });

    return () => unsubscribe();
  }, [activeTab, isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (!checkAdminAccess()) {
      window.location.href = '/';
    }
  }, [currentUser, isAdmin]);

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!isAdmin || userId === currentUser?.uid) {
      setError('Unauthorized: Cannot modify own role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Error updating user role');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    if (!isAdmin) return;

    try {
      const messageRef = doc(db, 'adminMessages', messageId);
      await updateDoc(messageRef, {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
      // Don't show error to user for this operation
    }
  };

  // Stats
  const totalPitches = pitches.length;
  const totalRevenue = sarees
    .filter(s => s.price_type === 'fixed' && s.price)
    .reduce((sum, s) => sum + (s.price || 0), 0);

  const handleAddSaree = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAdminAccess()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!newSaree.name || !newSaree.image_url || (newSaree.price_type === 'fixed' && !newSaree.price)) {
        throw new Error('Please fill all required fields');
      }

      // Convert form data to database format
      // Convert form data to database format
      const sareeToAdd = {
        ...newSaree,
        price: newSaree.price ? parseFloat(newSaree.price) : null,
        pitch_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Validate price if fixed
      if (sareeToAdd.price_type === 'fixed') {
        const price = sareeToAdd.price;
        if (price === null || isNaN(price) || price < 0) {
          throw new Error('Please enter a valid price');
        }
      }

      await addDoc(collection(db, 'sarees'), sareeToAdd);
      await refreshSarees();
      setShowAddSaree(false);
      setNewSaree({
        name: '',
        description: '',
        image_url: '',
        price: '',
        price_type: 'fixed',
        stock_status: 'in_stock',
        pitch_count: 0
      });
    } catch (err) {
      console.error('Error adding saree:', err);
      setError(err instanceof Error ? err.message : 'Error adding saree');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSaree = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAdminAccess()) return;

    if (!editingSaree?.id) {
      setError('Invalid saree ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!editingSaree.name || !editingSaree.image_url || 
          (editingSaree.price_type === 'fixed' && editingSaree.price === null)) {
        throw new Error('Please fill all required fields');
      }

      // Validate price if fixed
      if (editingSaree.price_type === 'fixed' && 
          (typeof editingSaree.price !== 'number' || editingSaree.price < 0)) {
        throw new Error('Please enter a valid price');
      }

      const sareeRef = doc(db, 'sarees', editingSaree.id);
      const { id, ...updateData } = editingSaree;
      await updateDoc(sareeRef, {
        ...updateData,
        updatedAt: serverTimestamp() as Timestamp
      });
      await refreshSarees();
      setEditingSaree(null);
    } catch (err) {
      console.error('Error updating saree:', err);
      setError(err instanceof Error ? err.message : 'Error updating saree');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSaree = async (saree: Saree) => {
    if (!checkAdminAccess()) return;

    if (!window.confirm('Are you sure you want to delete this saree?')) return;

    setLoading(true);
    setError(null);

    try {
      // Check if there are any existing pitches for this saree
      const pitchesForSaree = pitches.filter(p => p.saree?.id === saree.id);
      if (pitchesForSaree.length > 0) {
        throw new Error('Cannot delete saree with existing pitches');
      }

      const sareeRef = doc(db, 'sarees', saree.id);
      await deleteDoc(sareeRef);
      
      // Delete the main image from storage
      if (saree.image_url && saree.image_url.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          // Get the storage path from the URL
          const imageRef = ref(storage, new URL(saree.image_url).pathname);
          await deleteObject(imageRef);
        } catch (imgErr) {
          console.error('Error deleting image:', imgErr);
          // Continue even if image deletion fails
        }
      }

      await refreshSarees();
    } catch (err) {
      console.error('Error deleting saree:', err);
      setError(err instanceof Error ? err.message : 'Error deleting saree');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  // Effect to load users when the users tab is active
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleMessageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
      }

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, `messages/${uniqueFileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedBy: currentUser?.email || 'unknown'
        }
      });
      
      // Get the download URL
      const imageUrl = await getDownloadURL(storageRef);
      setNewMessage(prev => ({ ...prev, imageUrl }));
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to send messages');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create message document
      const messageData: Omit<AdminMessage, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown',
        content: newMessage.content,
        imageUrl: newMessage.imageUrl,
        referencePostId: newMessage.referencePostId,
        referencePostTitle: newMessage.referencePostTitle,
        createdAt: new Date(),
        isRead: false
      };

      await addDoc(collection(db, 'adminMessages'), messageData);
      
      // TODO: Send email notification to admin
      // This would typically be handled by a Cloud Function
      
      setShowMessageCompose(false);
      setNewMessage({
        content: '',
        imageUrl: '',
        referencePostId: '',
        referencePostTitle: ''
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
      }

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, `sarees/${uniqueFileName}`);
      
      // Upload the file with metadata
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedBy: currentUser?.email || 'unknown'
        }
      });
      
      // Get the download URL
      const imageUrl = await getDownloadURL(storageRef);
      
      if (editingSaree) {
        setEditingSaree({ ...editingSaree, image_url: imageUrl });
      } else {
        setNewSaree({ ...newSaree, image_url: imageUrl });
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <header className="bg-white shadow mb-6 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Admin Dashboard</h1>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">{currentUser?.displayName || 'Admin'}</span>
            <span className="text-xs text-gray-500">{currentUser?.email}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('sarees')}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'sarees' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Sarees
          </button>
          <button
            onClick={() => setActiveTab('pitches')}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'pitches' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Pitches
          </button>
          <button
            onClick={() => setActiveTab('adminMessages')}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'adminMessages' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Admin Messages
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <Package className="text-blue-500" size={24} />
            <div>
              <h3 className="text-lg font-medium">Total Products</h3>
              <p className="text-2xl font-bold">{sarees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <MessageCircle className="text-green-500" size={24} />
            <div>
              <h3 className="text-lg font-medium">Total Pitches</h3>
              <p className="text-2xl font-bold">{totalPitches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <TrendingUp className="text-purple-500" size={24} />
            <div>
              <h3 className="text-lg font-medium">Total Revenue</h3>
              <p className="text-2xl font-bold">₹{totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'sarees' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Sarees</h2>
            <button
              onClick={() => setShowAddSaree(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              <Plus size={20} />
              Add Saree
            </button>
          </div>

          {(showAddSaree || editingSaree) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">
                  {editingSaree ? 'Edit Saree' : 'Add New Saree'}
                </h3>
                <form onSubmit={editingSaree ? handleUpdateSaree : handleAddSaree}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editingSaree?.name || newSaree.name}
                        onChange={(e) =>
                          editingSaree
                            ? setEditingSaree({ ...editingSaree, name: e.target.value })
                            : setNewSaree({ ...newSaree, name: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingSaree?.image_url || newSaree.image_url}
                          onChange={(e) =>
                            editingSaree
                              ? setEditingSaree({ ...editingSaree, image_url: e.target.value })
                              : setNewSaree({ ...newSaree, image_url: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="Image URL"
                          required
                        />
                        <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded cursor-pointer hover:bg-gray-200">
                          <Upload size={20} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Price Type
                      </label>
                      <select
                        value={editingSaree?.price_type || newSaree.price_type}
                        onChange={(e) => {
                          const value = e.target.value as 'fixed' | 'dm';
                          editingSaree
                            ? setEditingSaree({ ...editingSaree, price_type: value })
                            : setNewSaree({ ...newSaree, price_type: value });
                        }}
                        className="w-full p-2 border rounded"
                      >
                        <option value="fixed">Fixed Price</option>
                        <option value="dm">DM for Price</option>
                      </select>
                    </div>

                    {(editingSaree?.price_type || newSaree.price_type) === 'fixed' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          value={editingSaree?.price || newSaree.price}
                          onChange={(e) =>
                            editingSaree
                              ? setEditingSaree(editingSaree ? { ...editingSaree, price: e.target.value } : null)
                              : setNewSaree({ ...newSaree, price: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Stock Status
                      </label>
                      <select
                        value={editingSaree?.stock_status || newSaree.stock_status}
                        onChange={(e) => {
                          const value = e.target.value as 'in_stock' | 'out_of_stock';
                          editingSaree
                            ? setEditingSaree({ ...editingSaree, stock_status: value })
                            : setNewSaree({ ...newSaree, stock_status: value });
                        }}
                        className="w-full p-2 border rounded"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSaree(null);
                        setShowAddSaree(false);
                      }}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      <Save size={20} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sarees.map((saree) => (
              <div key={saree.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img
                  src={saree.image_url}
                  alt={saree.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium">{saree.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-500">
                      {saree.price_type === 'fixed' ? (
                        <span>?{saree.price}</span>
                      ) : (
                        <span>DM for price</span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {saree.pitch_count} pitches
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setEditingSaree({
                        id: saree.id,
                        name: saree.name || '',
                        description: saree.description || '',
                        price: saree.price?.toString() || '',
                        image_url: saree.image_url,
                        price_type: saree.price_type,
                        stock_status: saree.stock_status,
                        pitch_count: saree.pitch_count
                      })}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      disabled={loading}
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteSaree(saree)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      disabled={loading}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pitches' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Pitches</h2>
          <div className="space-y-4">
            {pitches.map((pitch) => (
              <div
                key={pitch.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center gap-4">
                  {pitch.saree && (
                    <img
                      src={pitch.saree.image_url}
                      alt={pitch.saree.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">
                      Product: {pitch.saree?.name}
                    </div>
                    <p className="mt-1">{pitch.content}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      {new Date(pitch.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pitches.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No pitches yet
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Users</h2>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.uid}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{user.email}</h3>
                    <p className="text-sm text-gray-500">
                      {user.displayName || 'No display name'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last login: {user.lastLoginAt?.toDate().toLocaleString() || 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Role:</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as 'admin' | 'user')}
                        className="p-1 border rounded text-sm"
                        disabled={loading || user.uid === currentUser?.uid}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No users found
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'adminMessages' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Messages</h2>
            <button
              onClick={() => setShowMessageCompose(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              <Plus size={20} />
              New Message
            </button>
          </div>

          {showMessageCompose && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">New Message</h3>
                <form onSubmit={handleSubmitMessage}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full p-2 border rounded min-h-[100px]"
                        placeholder="Type your message here..."
                        required
                      />
                    </div>

                    {newMessage.imageUrl && (
                      <div className="relative">
                        <img
                          src={newMessage.imageUrl}
                          alt="Message attachment"
                          className="w-full h-40 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setNewMessage(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded cursor-pointer hover:bg-gray-200">
                        <Upload size={20} />
                        <span>Add Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleMessageFileUpload}
                        />
                      </label>
                    </div>

                    {sarees.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Reference Product (Optional)
                        </label>
                        <select
                          value={newMessage.referencePostId}
                          onChange={(e) => {
                            const saree = sarees.find(s => s.id === e.target.value);
                            setNewMessage(prev => ({
                              ...prev,
                              referencePostId: e.target.value,
                              referencePostTitle: saree?.name || ''
                            }));
                          }}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select a product</option>
                          {sarees.map(saree => (
                            <option key={saree.id} value={saree.id}>
                              {saree.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMessageCompose(false);
                        setNewMessage({
                          content: '',
                          imageUrl: '',
                          referencePostId: '',
                          referencePostTitle: ''
                        });
                      }}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  !message.isRead && isAdmin ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{message.userEmail}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!message.isRead && isAdmin && (
                      <button
                        onClick={() => handleMarkMessageRead(message.id!)}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700">{message.content}</p>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Message attachment"
                      className="w-full max-h-60 object-cover rounded mt-2"
                    />
                  )}
                  {message.referencePostId && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      Referenced Product: {message.referencePostTitle}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No messages yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
