import React from 'react';
import { Tabs } from '../components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsWrapperProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabsWrapper: React.FC<TabsWrapperProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <nav className="mt-4 flex space-x-4">
              <button
                onClick={() => onTabChange('products')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'products'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onTabChange('messages')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'messages'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => onTabChange('pitches')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'pitches'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pitches
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </Tabs>
  );
};

export default TabsWrapper;