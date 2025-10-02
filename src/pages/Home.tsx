import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import SareeCard from '../components/SareeCard';

export default function Home() {
  const { sarees, loading } = useData();

  const featuredSarees = sarees.slice(0, 6);
  const topPitchedSarees = sarees
    .filter(saree => (saree as any).pitch_count > 0)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div 
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/ddxc429ot/image/upload/v1759376502/rosehd_1_fzy6xi.png')`,
            backgroundSize: '60%',
            backgroundPosition: 'center',
            transform: 'scale(1.0)'
          }}
        />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 leading-tight">
            Exquisite
            <span className="text-rose-gold block">Silk Sarees</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
            Discover timeless elegance with our curated collection of premium silk sarees. 
            From direct manufacturers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/fixed-price"
              className="bg-rose-gold hover:bg-rose-gold/80 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center space-x-2 hover:shadow-lg hover:shadow-rose-gold/25 transform hover:-translate-y-1"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dm-price"
              className="border-2 border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Exclusive Pieces
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-gold/30 transition-colors duration-300">
                <Sparkles className="w-8 h-8 text-rose-gold" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{sarees.length}</h3>
              <p className="text-gray-300">Premium Sarees</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-gold/30 transition-colors duration-300">
                <TrendingUp className="w-8 h-8 text-rose-gold" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">
                {sarees.reduce((sum, saree) => sum + saree.pitch_count, 0)}
              </h3>
              <p className="text-gray-300">Total Pitches</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-gold/30 transition-colors duration-300">
                <Users className="w-8 h-8 text-rose-gold" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">500+</h3>
              <p className="text-gray-300">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
              Featured Collection
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Handpicked sarees that showcase the finest craftsmanship and timeless beauty
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-gold"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredSarees.map((saree) => (
                <SareeCard key={saree.id} saree={saree} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/fixed-price"
              className="inline-flex items-center space-x-2 bg-transparent border-2 border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <span>View All Sarees</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Pitched Section */}
      {topPitchedSarees.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
                Most Popular Picks
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                These sarees are generating the most interest from our customers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topPitchedSarees.map((saree) => (
                <SareeCard key={saree.id} saree={saree} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Find Your Perfect Saree
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of satisfied customers who have found their dream sarees with us
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/fixed-price"
              className="bg-rose-gold hover:bg-rose-gold/80 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center space-x-2 hover:shadow-lg hover:shadow-rose-gold/25 transform hover:-translate-y-1"
            >
              <span>Shop Fixed Price</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dm-price"
              className="border-2 border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Explore DM Collection
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}