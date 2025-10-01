import React, { useState } from 'react';
import { Heart, MessageCircle, ShoppingBag, SendHorizonal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PitchModal from './PitchModal';
import MessageModal from './MessageModal';
import type { Saree } from '../contexts/DataContext';

interface SareeCardProps {
  saree: Saree;
}

export default function SareeCard({ saree }: SareeCardProps) {
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const { user } = useAuth();
  const { addPitch } = useData();

  const handleAction = () => {
    if (!user) {
      setShowPitchModal(true);
      return;
    }

    if (saree.priceType === 'fixed') {
      setShowMessageModal(true);
    } else {
      setShowPitchModal(true);
    }
  };

  const isOutOfStock = saree.stock === 0;
  const hasStock = typeof saree.stock === 'number' && saree.stock > 0;

  return (
    <>
      <div className={`group relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-xl border border-gray-800 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}>
        {/* Stock Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isOutOfStock ? 'bg-red-500/90 text-white' : hasStock ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
          }`}>
            {isOutOfStock ? 'Out of Stock' : hasStock ? `${saree.stock} Available` : 'Stock Status Unknown'}
          </span>
        </div>
        {/* Image Container */}
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={saree.imageUrl}
            alt={saree.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image for ${saree.name}:`, saree.imageUrl);
              // Log additional debug info
              console.error('Image load error details:', {
                sareeId: saree.id,
                imageUrl: saree.imageUrl,
                timestamp: new Date().toISOString()
              });
              target.src = `https://images.pexels.com/photos/7673219/pexels-photo-7673219.jpeg?auto=compress&cs=tinysrgb&w=600`;
            }}
            onLoad={() => {
              console.log(`Successfully loaded image for ${saree.name}:`, saree.imageUrl);
              // Log successful load details
              console.log('Image load success details:', {
                sareeId: saree.id,
                imageUrl: saree.imageUrl,
                timestamp: new Date().toISOString()
              });
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
          {isOutOfStock ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold text-lg tracking-wider">OUT OF STOCK</span>
            </div>
          ) : (
            <div className="absolute top-4 left-4">
              <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                IN STOCK
              </div>
            </div>
          )}

          {/* Pitch Count Badge */}
          <div className="absolute top-4 left-4 bg-rose-gold/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>{(saree as any).pitch_count || 0} pitches</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-serif text-xl text-white mb-2 group-hover:text-rose-gold transition-colors duration-300">
            {saree.name}
          </h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-rose-gold font-semibold text-lg">
              {saree.priceType === 'fixed' ? (
                `₹${saree.price.toLocaleString()}`
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

          {/* Pitch/Message Button */}
          <button
            onClick={handleAction}
            disabled={isOutOfStock}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              isOutOfStock
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : saree.priceType === 'fixed'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-rose-gold hover:bg-rose-gold/80 text-black'
            } hover:shadow-lg hover:shadow-current/25 transform hover:-translate-y-0.5`}
          >
            {saree.priceType === 'fixed' ? (
              <>
                <SendHorizonal className="w-4 h-4" />
                <span>Buy Now</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                <span>{user ? 'Add Pitch' : 'Request Price'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pitch Modal */}
      <PitchModal
        saree={saree}
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
      />

      {/* Message Modal */}
      <MessageModal 
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        saree={saree}
      />
    </>
  );
}