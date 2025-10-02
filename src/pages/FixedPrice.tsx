import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import SareeCard from '../components/SareeCard';

export default function FixedPrice() {
  const { sarees, loading } = useData();
  const [selectedSort, setSelectedSort] = useState<'price-asc' | 'price-desc' | 'latest'>('latest');
  const [selectedType, setSelectedType] = useState<'all' | 'handloom' | 'powerloom'>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  // Filter fixed price sarees
  const fixedPriceSarees = sarees.filter(saree => saree.priceType === 'fixed');

  // Apply price filter and sorting
  const filterAndSortSarees = (sareesToFilter: typeof sarees) => {
    return sareesToFilter
      .filter(saree => {
        const matchesPrice = saree.price >= priceRange.min && saree.price <= priceRange.max;
        const matchesType = selectedType === 'all' || saree.category === selectedType;
        return matchesPrice && matchesType;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'latest':
          default:
            return b.createdAt.getTime() - a.createdAt.getTime();
        }
      });
  };



  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <section className="py-12 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-white mb-4">Fixed Price Collection</h1>
            <p className="text-xl text-gray-300">
              Browse our curated collection of handloom and powerloom silk sarees
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sort Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="minPrice" className="text-gray-300">Min Price:</label>
              <input
                type="number"
                id="minPrice"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="maxPrice" className="text-gray-300">Max Price:</label>
              <input
                type="number"
                id="maxPrice"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="type" className="text-gray-300">Loom Type:</label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="all">All Types</option>
                <option value="handloom">Hand Loom</option>
                <option value="powerloom">Power Loom</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-gray-300">Sort by:</label>
              <select
                id="sort"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as typeof selectedSort)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="latest">Latest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-gold"></div>
          </div>
        ) : (
          <div className="mt-8">
            {fixedPriceSarees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filterAndSortSarees(fixedPriceSarees).map((saree) => (
                  <SareeCard key={saree.id} saree={saree} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-300 text-lg">No sarees available in this price range.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}