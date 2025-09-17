import React from 'react';
import { useData } from '../contexts/DataContext';
import SareeCard from '../components/SareeCard';

export default function FixedPrice() {
  const { sarees, loading } = useData();

  const fixedPriceSarees = sarees.filter(saree => saree.price_type === 'fixed');

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            Fixed Price Collection
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transparent pricing for our beautiful saree collection. Each piece is carefully priced 
            to offer the best value while maintaining our commitment to quality and authenticity.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-gold"></div>
          </div>
        ) : fixedPriceSarees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {fixedPriceSarees.map((saree) => (
              <SareeCard key={saree.id} saree={saree} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🥻</span>
            </div>
            <h3 className="text-2xl font-serif text-white mb-4">No Fixed Price Sarees Available</h3>
            <p className="text-gray-300 text-lg">
              We're currently updating our fixed price collection. Please check back soon or explore our DM price collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}