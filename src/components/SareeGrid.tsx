import React from 'react';
import { Saree } from '../types/models';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';

interface SareeGridProps {
  sarees: Saree[];
  onEdit: (saree: Saree) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const SareeGrid: React.FC<SareeGridProps> = ({ sarees, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse h-64"></div>
        ))}
      </div>
    );
  }

  if (!sarees.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No sarees found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {sarees.map((saree) => (
        <motion.div
          key={saree.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="relative aspect-square">
            <img
              src={saree.imageUrl}
              alt={saree.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 space-x-2">
              <button
                onClick={() => onEdit(saree)}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(saree.id)}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <p className="font-semibold truncate">{saree.name}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                ₹{saree.price.toLocaleString()}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${
                saree.stock > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {saree.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{saree.category || 'Uncategorized'}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SareeGrid;