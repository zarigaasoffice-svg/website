import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Upload, Save, Package, MessageCircle, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CloudinaryImage } from '../components/CloudinaryImage';
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
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { uploadImage, getOptimizedImageUrl } from '../lib/cloudinary';

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

// Initialize empty message object
const emptyMessage = {
  content: '',
  imageUrl: '',
  referencePostId: '',
  referencePostTitle: '',
  replyTo: ''
};

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

  // Function to reset form to initial state
  const resetForm = () => {
    setNewSaree({
      name: '',
      description: '',
      price: '',
      image_url: '',
      price_type: 'fixed',
      stock_status: 'in_stock',
      pitch_count: 0
    });
    setEditingSaree(null);
    setError(null);
  };

  // Error and loading states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Message states
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [showMessageCompose, setShowMessageCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [newMessage, setNewMessage] = useState(emptyMessage);

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

  const handleCancel = () => {
    setNewSaree(emptyProduct);
    setEditingSaree(null);
    setShowAddSaree(false);
    setError(null);
  };

  const handleAddSaree = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAdminAccess()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Basic validation
      if (!newSaree.name.trim()) {
        throw new Error('Please enter a product name');
      }

      // Price validation for fixed price items
      let price: number | null = null;
      if (newSaree.price_type === 'fixed') {
        const parsedPrice = parseFloat(newSaree.price?.toString() || '');
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new Error('Please enter a valid price');
        }
        price = parsedPrice;
      }

      // Image validation
      if (!newSaree.image_url) {
        throw new Error('Please provide a product image');
      }

      // If it's a Cloudinary URL, accept it directly
      if (newSaree.image_url.includes('res.cloudinary.com')) {
        // URL is already from Cloudinary, use it as is
      } else if (newSaree.image_url.startsWith('http')) {
        // For external URLs, try to upload to Cloudinary
        try {
          const response = await fetch(newSaree.image_url);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });
          const uploadResult = await uploadImage(file);
          if (!uploadResult || !uploadResult.url) {
            throw new Error('Failed to process external image');
          }
          newSaree.image_url = uploadResult.url;
        } catch (err) {
          throw new Error('Failed to process the provided image URL. Please try uploading the image directly.');
        }
      } else {
        throw new Error('Please provide a valid image URL or upload an image');
      }

      // Prepare data for saving
      const sareeToAdd = {
        name: newSaree.name.trim(),
        description: newSaree.description?.trim() || '',
        price,
        image_url: newSaree.image_url,
        price_type: newSaree.price_type as 'fixed' | 'dm',
        stock_status: newSaree.stock_status as 'in_stock' | 'out_of_stock',
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

      console.log('Saving saree with image URL:', sareeToAdd.image_url);
      const docRef = await addDoc(collection(db, 'sarees'), sareeToAdd);
      console.log('Saved saree document with ID:', docRef.id);
      await refreshSarees();
      setShowAddSaree(false);
      resetForm();
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
      // Basic validation
      if (!editingSaree.name.trim()) {
        throw new Error('Product name is required');
      }

      // Parse and validate price
      let price: number | null = null;
      if (editingSaree.price_type === 'fixed') {
        const parsedPrice = parseFloat(editingSaree.price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new Error('Please enter a valid price');
        }
        price = parsedPrice;
      }

      // Image validation and processing
      if (editingSaree.image_url && !editingSaree.image_url.includes('res.cloudinary.com')) {
        if (editingSaree.image_url.startsWith('http')) {
          try {
            const response = await fetch(editingSaree.image_url);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: blob.type });
            const uploadResult = await uploadImage(file);
            if (!uploadResult || !uploadResult.url) {
              throw new Error('Failed to process external image');
            }
            editingSaree.image_url = uploadResult.url;
          } catch (err) {
            throw new Error('Failed to process the provided image URL. Please try uploading the image directly.');
          }
        } else {
          throw new Error('Please provide a valid image URL or upload an image');
        }
      }

      // Prepare update data
      const updateData = {
        name: editingSaree.name.trim(),
        description: editingSaree.description?.trim() || '',
        price: editingSaree.price_type === 'fixed' ? price : null,
        image_url: editingSaree.image_url,
        price_type: editingSaree.price_type as 'fixed' | 'dm',
        stock_status: editingSaree.stock_status as 'in_stock' | 'out_of_stock',
        updated_at: serverTimestamp()
      };

      console.log('Updating saree with data:', { id: editingSaree.id, ...updateData });
      const sareeRef = doc(db, 'sarees', editingSaree.id);
      await updateDoc(sareeRef, updateData); // updateData already includes updated_at
      await refreshSarees();
      setShowAddSaree(false);
      setEditingSaree(null);
      resetForm();
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
      
      // With Cloudinary, we don't need to manually delete images
      // Images can be managed through the Cloudinary dashboard or Admin API
      if (saree.image_url) {
        console.log('Image URL will remain in Cloudinary:', saree.image_url);
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

      if (!currentUser) {
        throw new Error('You must be logged in to upload files.');
      }

      // Prepare form data for Cloudinary upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "zarigaas/messages");

      // Add metadata
      formData.append("context", JSON.stringify({
        alt: file.name,
        caption: `Message attachment by ${currentUser.email || 'unknown'}`,
        userId: currentUser.uid
      }));

      console.log('Starting file upload to Cloudinary...');
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload successful:', data);

      // Get the secure URL from Cloudinary
      const imageUrl = data.secure_url;
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
        referencePostTitle: '',
        replyTo: ''
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAdminAccess()) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type and size
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
      }

      if (!currentUser) {
        throw new Error('You must be logged in to upload files.');
      }

      // Upload to Cloudinary
      const uploadResult = await uploadImage(file);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Failed to upload image');
      }
      console.log('Cloudinary upload successful:', uploadResult);

      // Use the direct secure URL from Cloudinary
      const optimizedUrl = uploadResult.url;

      // Update state with the optimized image URL
      if (editingSaree) {
        setEditingSaree({ ...editingSaree, image_url: optimizedUrl });
      } else {
        setNewSaree({ ...newSaree, image_url: optimizedUrl });
      }
      
      console.log('Image URL updated in state:', optimizedUrl);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  // Handle message selection
  const handleSelectMessage = (message: AdminMessage) => {
    setSelectedMessage(message);
    if (!message.isRead && isAdmin) {
      handleMarkMessageRead(message.id!);
    }
  };

  // Handle new message submission with error handling
  const resetMessage = () => {
    setNewMessage(emptyMessage);
    setShowMessageCompose(false);
    setSelectedMessage(null);
  };

  const handleNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to send messages');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messageData = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown',
        content: newMessage.content.trim(),
        imageUrl: newMessage.imageUrl,
        replyTo: newMessage.replyTo,
        createdAt: new Date(),
        isRead: false
      };

      await addDoc(collection(db, 'adminMessages'), messageData);
      resetMessage();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const emptyProduct: SareeFormData = {
    name: '',
    description: '',
    price: '',
    image_url: '',
    price_type: 'fixed' as const,
    stock_status: 'in_stock' as const,
    pitch_count: 0
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <header className="bg-white shadow mb-6 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Admin Dashboard</h1>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">{currentUser?.displayName || 'Admin'}</span>
            <span className="text-xs text-gray-500">{currentUser?.email}</span>
            {!isAdmin && (
              <button
                onClick={() => setShowMessageCompose(true)}
                className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <MessageCircle size={16} />
                Message Admin
              </button>
            )}
          </div>
        </div>

        {/* Message Compose Modal */}
        {showMessageCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-lg font-medium mb-4">Message Admin</h3>
              <form onSubmit={handleNewMessage} className="space-y-4">
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

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetMessage}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newMessage.content.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Mobile Menu */}
        <div className="block md:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as AdminTab)}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="sarees">Sarees</option>
            <option value="pitches">Pitches</option>
            <option value="adminMessages">Admin Messages</option>
          </select>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('sarees')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'sarees' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package size={18} />
              <span>Sarees</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pitches')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'pitches' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span>Pitches</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('adminMessages')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'adminMessages' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span>Messages</span>
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-medium">Total Products</h3>
              <p className="text-xl md:text-2xl font-bold">{sarees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <MessageCircle className="text-green-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-medium">Total Pitches</h3>
              <p className="text-xl md:text-2xl font-bold">{totalPitches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-medium">Total Revenue</h3>
              <p className="text-xl md:text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
                <h3 className="text-lg font-medium mb-4">
                  {editingSaree ? 'Edit Saree' : 'Add New Saree'}
                </h3>
                <form onSubmit={editingSaree ? handleUpdateSaree : handleAddSaree} className="space-y-6">
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                      <div>
                        {(editingSaree?.image_url || newSaree.image_url) ? (
                          <div className="mb-2">
                            <CloudinaryImage 
                              src={editingSaree?.image_url || newSaree.image_url} 
                              alt="Preview" 
                              className="h-32 w-32 object-cover rounded"
                              width={128}
                              height={128}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded cursor-pointer hover:bg-gray-200">
                            <Upload size={20} />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </label>
                          
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Or paste image URL here"
                              value={editingSaree?.image_url || newSaree.image_url}
                              onChange={(e) => {
                                const url = e.target.value;
                                if (editingSaree) {
                                  setEditingSaree({ ...editingSaree, image_url: url });
                                } else {
                                  setNewSaree({ ...newSaree, image_url: url });
                                }
                              }}
                              className="w-full p-2 border rounded pr-20"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingSaree) {
                                  setEditingSaree({ ...editingSaree, image_url: '' });
                                } else {
                                  setNewSaree({ ...newSaree, image_url: '' });
                                }
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
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
                        setNewSaree(emptyProduct);
                        setError(null);
                      }}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={loading || (!newSaree.image_url && !editingSaree?.image_url)}
                    >
                      <Save size={20} />
                      {loading ? 'Saving...' : editingSaree ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sarees.map((saree) => (
              <div key={saree.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative w-full aspect-[3/4]">
                  <CloudinaryImage
                    src={saree.image_url}
                    alt={saree.name}
                    className="w-full h-full object-cover"
                    width={600}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{saree.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-500">
                      {saree.price_type === 'fixed' ? (
                        <span>₹{saree.price}</span>
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
                      src={pitch.saree?.image_url}
                      alt={pitch.saree?.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error(`Failed to load pitch image for ${pitch.saree?.name || 'unknown'}:`, pitch.saree?.image_url);
                        target.src = `https://images.pexels.com/photos/7673219/pexels-photo-7673219.jpeg?auto=compress&cs=tinysrgb&w=600`;
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded pitch image for ${pitch.saree?.name || 'unknown'}:`, pitch.saree?.image_url);
                      }}
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
                          referencePostTitle: '',
                          replyTo: ''
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
