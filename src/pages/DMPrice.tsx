import React from 'react';
import { MessageCircle, Star, Crown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import SareeCard from '../components/SareeCard';

export default function DMPrice() {
  const { sarees, loading } = useData();

  const dmPriceSarees = sarees.filter(saree => saree.priceType === 'dm');

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-rose-gold mr-3" />
            <h1 className="font-serif text-4xl md:text-5xl text-white">
              Exclusive Collection
            </h1>
            <Crown className="w-8 h-8 text-rose-gold ml-3" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Our most exclusive and premium sarees with personalized pricing. 
            Each piece is unique and requires individual consultation for the perfect match.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 border border-rose-gold/20">
              <MessageCircle className="w-8 h-8 text-rose-gold mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Personalized Pricing</h3>
              <p className="text-gray-300 text-sm">Get custom quotes based on your specific needs and preferences</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 border border-rose-gold/20">
              <Star className="w-8 h-8 text-rose-gold mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Premium Quality</h3>
              <p className="text-gray-300 text-sm">Handpicked exclusive pieces with superior craftsmanship</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 border border-rose-gold/20">
              <Crown className="w-8 h-8 text-rose-gold mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Limited Edition</h3>
              <p className="text-gray-300 text-sm">Rare and unique designs not available elsewhere</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-gold"></div>
          </div>
        ) : dmPriceSarees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {dmPriceSarees.map((saree) => (
              <SareeCard key={saree.id} saree={saree} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-rose-gold" />
            </div>
            <h3 className="text-2xl font-serif text-white mb-4">Exclusive Collection Coming Soon</h3>
            <p className="text-gray-300 text-lg">
              We're curating an exceptional selection of premium sarees. Check back soon for our exclusive DM price collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}