import { MessageCircle } from 'lucide-react';
import type { Saree } from '../contexts/DataContext';

interface SareeCardProps {
  saree: Saree;
}

export default function SareeCard({ saree }: SareeCardProps) {
  const openWhatsApp = () => {
    const message = `Hi, I'm interested in this saree: ${saree.name} - ${saree.priceType === 'fixed' ? `Price: ₹${saree.price}` : 'DM Price'}`;
    const whatsappUrl = `https://wa.me/918838043994?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isOutOfStock = saree.stock === 0;

  return (
    <>
      <div className={`group relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-xl border border-gray-800 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}>
        {/* Loom Type Badge - Only for Fixed Price */}
        {saree.priceType === 'fixed' && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              saree.category === 'handloom' ? 'bg-rose-gold/90 text-black' : 'bg-blue-500/90 text-white'
            }`}>
              {saree.category === 'handloom' ? 'Hand Loom' : 'Power Loom'}
            </span>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isOutOfStock ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
          }`}>
            {isOutOfStock ? 'Out of Stock' : `${saree.stock} Available`}
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
          
          {/* Overlay with Quick Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button 
              onClick={openWhatsApp}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-gold hover:text-black transition-colors duration-300 transform hover:scale-110"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold text-lg tracking-wider">OUT OF STOCK</span>
            </div>
          )}

        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-serif text-xl text-white mb-2 group-hover:text-rose-gold transition-colors duration-300">
            {saree.name}
          </h3>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
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

            {/* WhatsApp Button */}
            <button
              onClick={openWhatsApp}
              disabled={isOutOfStock}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                isOutOfStock
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-rose-gold hover:bg-rose-gold/90 text-black'
              } hover:shadow-lg transform hover:-translate-y-0.5`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Contact on WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}