import React, { useState, useEffect } from 'react';
import { Package, MessageCircle, Menu, Bell, X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LoadingSpinner } from '../components/ui/loading';
import type { Message, Saree, CreateSareeInput } from '../types/models';
import { MessageList } from '../components/MessageList';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm } from '../components/ProductForm';

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'messages'>('products');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState({
    unreadMessages: 0,
    totalNotifications: 0
  });
  const [products, setProducts] = useState<Saree[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newProductForm, setNewProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Saree | null>(null);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    setLoading(true);

    try {
      // Load sarees (products)
      const sareesQuery = query(collection(db, 'sarees'), orderBy('createdAt', 'desc'));
      unsubscribers.push(
        onSnapshot(sareesQuery, (snapshot) => {
          const sareesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Saree[];
          setProducts(sareesData);
        })
      );

      // Load messages
      const messagesQuery = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc')
      );
      unsubscribers.push(
        onSnapshot(messagesQuery, {
          next: (snapshot) => {
            const messagesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              isRead: doc.data().isRead || false,
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Message[];
            setMessages(messagesData);
            
            const unreadCount = messagesData.filter(m => !m.isRead).length;
            setNotifications(prev => ({
              ...prev,
              unreadMessages: unreadCount,
              totalNotifications: unreadCount
            }));
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            toast.error('Error loading messages');
          }
        })
      );
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      toast.error('Failed to set up real-time updates');
    }

    setLoading(false);
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProducts = searchTerm.trim() === ''
    ? products
    : products.filter((product) =>
        [
          product.name?.toLowerCase() ?? '',
          String(product.price)?.toLowerCase() ?? '',
          product.category?.toLowerCase() ?? '',
        ].some((field) => field.includes(searchTerm.toLowerCase()))
      );

  const handleNewProduct = async (productData: CreateSareeInput) => {
    try {
      const dataToSave = {
        ...productData,
        price: productData.priceType === 'dm' ? 0 : productData.price,
        stock: Number(productData.stock) || 0, // ✅ force number
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'sarees'), dataToSave);
      setNewProductForm(false);
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleProductUpdate = async (productId: string, data: Partial<Saree>) => {
    try {
      await updateDoc(doc(db, 'sarees', productId), {
        ...data,
        stock: data.stock !== undefined ? Number(data.stock) : data.stock, // ✅ normalize stock
        updatedAt: serverTimestamp(),
      });
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleProductDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'sarees', productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isRead: true,
        readAt: serverTimestamp(),
      });
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform 
          transition-transform duration-300 ease-in-out md:translate-x-0 
          transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'products' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'messages' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5" />
                <span>Messages</span>
              </div>
              {notifications.unreadMessages > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1">
                  {notifications.unreadMessages}
                </span>
              )}
            </div>
          </button>


        </nav>
      </aside>

      <main className="flex-1 overflow-auto w-full md:w-auto">
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              {notifications.totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.totalNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {activeTab === 'products' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-semibold">Products</h2>
                      <button
                        onClick={() => setNewProductForm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {newProductForm ? (
                      <ProductForm
                        onSubmit={handleNewProduct}
                        onCancel={() => setNewProductForm(false)}
                      />
                    ) : (
                      <ProductGrid
                        products={filteredProducts}
                        editingProduct={editingProduct}
                        onEdit={setEditingProduct}
                        onDelete={handleProductDelete}
                        onUpdate={handleProductUpdate}
                        onCancelEdit={() => setEditingProduct(null)}
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'messages' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-semibold">Messages</h2>
                      <div className="text-sm text-gray-500">
                        {messages.length} messages • {messages.filter((m) => !m.isRead).length} unread
                      </div>
                    </div>

                    <MessageList
                      messages={messages}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteMessage}
                      isLoading={loading}
                    />
                  </motion.div>
                )}


              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
