import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Saree } from '../contexts/DataContext';

interface ProductSelectorProps {
  onSelect: (saree: Saree) => void;
  onClose: () => void;
}

export default function ProductSelector({ onSelect, onClose }: ProductSelectorProps) {
  const { sarees } = useData();
  const [search, setSearch] = useState('');

  const filteredSarees = search
    ? sarees.filter(saree => 
        saree.name.toLowerCase().includes(search.toLowerCase())
      )
    : sarees;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Select a Product</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sarees..."
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-gold"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {filteredSarees.map((saree) => (
              <button
                key={saree.id}
                onClick={() => onSelect(saree)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <img
                  src={saree.image_url}
                  alt={saree.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{saree.name}</p>
                  <p className="text-sm text-gray-500">
                    {saree.price_type === 'fixed' 
                      ? `₹${saree.price?.toLocaleString()}` 
                      : 'DM Price'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
