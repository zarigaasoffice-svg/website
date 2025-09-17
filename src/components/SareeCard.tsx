import React, { useState } from 'react';
import { Heart, MessageCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PitchModal from './PitchModal';
import type { Saree } from '../contexts/DataContext';

interface SareeCardProps {
  saree: Saree;
}

export default function SareeCard({ saree }: SareeCardProps) {
  const [showPitchModal, setShowPitchModal] = useState(false);
  const { user } = useAuth();
  const { addPitch } = useData();

  const handleQuickPitch = async () => {
    if (!user) {
      setShowPitchModal(true);
      return;
    }

    const name = user.user_metadata?.full_name || user.email || '';
    const email = user.email || '';
    
    await addPitch(saree.id, name, email, 'Quick pitch from logged-in user', user.id);
  };

  const isOutOfStock = saree.stock_status === 'out_of_stock';

  return (
    <>
      <div className={`group relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-xl border border-gray-800 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isOutOfStock ? 'opacity-75' : ''}`}>
        {/* Image Container */}
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={saree.image_url}
            alt={saree.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.pexels.com/photos/7673219/pexels-photo-7673219.jpeg?auto=compress&cs=tinysrgb&w=600`;
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-gold/80 hover:text-black transition-colors duration-300">
              <Heart className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-gold/80 hover:text-black transition-colors duration-300">
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold text-lg tracking-wider">OUT OF STOCK</span>
            </div>
          )}

          {/* Pitch Count Badge */}
          <div className="absolute top-4 left-4 bg-rose-gold/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>{saree.pitch_count} pitches</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-serif text-xl text-white mb-2 group-hover:text-rose-gold transition-colors duration-300">
            {saree.name}
          </h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-rose-gold font-semibold text-lg">
              {saree.price_type === 'fixed' ? (
                `₹${saree.price?.toLocaleString()}`
              ) : (
                'Rate on Request'
              )}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              isOutOfStock 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </div>
          </div>

          {/* Pitch Button */}
          <button
            onClick={user ? handleQuickPitch : () => setShowPitchModal(true)}
            disabled={isOutOfStock}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              isOutOfStock
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-rose-gold hover:bg-rose-gold/80 text-black hover:shadow-lg hover:shadow-rose-gold/25 transform hover:-translate-y-0.5'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{user ? 'Add Pitch' : 'Add a Pitch'}</span>
          </button>
        </div>
      </div>

      {/* Pitch Modal */}
      <PitchModal
        saree={saree}
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
      />
    </>
  );
}