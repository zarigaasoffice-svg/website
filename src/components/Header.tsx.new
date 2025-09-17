import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-black/95 backdrop-blur-sm border-b border-rose-gold/20 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-serif text-rose-gold hover:text-rose-gold/80 transition-colors duration-300"
          >
            Zarigaas
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/') 
                  ? 'text-rose-gold' 
                  : 'text-white hover:text-rose-gold'
              }`}
            >
              Home
            </Link>
            <Link
              to="/fixed-price"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/fixed-price') 
                  ? 'text-rose-gold' 
                  : 'text-white hover:text-rose-gold'
              }`}
            >
              Fixed Price Sarees
            </Link>
            <Link
              to="/dm-price"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/dm-price') 
                  ? 'text-rose-gold' 
                  : 'text-white hover:text-rose-gold'
              }`}
            >
              DM Price Sarees
            </Link>
            <Link
              to="/messages"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/messages') 
                  ? 'text-rose-gold' 
                  : 'text-white hover:text-rose-gold'
              }`}
            >
              Messages
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-white">
                  <User className="w-4 h-4" />
                  <span className="text-sm">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive('/admin') ? 'text-rose-gold' : 'text-white hover:text-rose-gold'
                      }`}
                    >
                      Admin
                    </Link>
                    <Link
                      to="/admin/messages"
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive('/admin/messages') ? 'text-rose-gold' : 'text-white hover:text-rose-gold'
                      }`}
                    >
                      Admin Messages
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-white hover:text-rose-gold transition-colors duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-rose-gold hover:bg-rose-gold/80 text-black px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-rose-gold transition-colors duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/95 border-t border-rose-gold/20">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/fixed-price"
                className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Fixed Price Sarees
              </Link>
              <Link
                to="/dm-price"
                className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                DM Price Sarees
              </Link>
              <Link
                to="/messages"
                className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
              </Link>
              
              {user ? (
                <div className="border-t border-rose-gold/20 pt-4 mt-4">
                  <div className="flex items-center px-3 py-2 text-white">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </div>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/messages"
                        className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Messages
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-white hover:text-rose-gold transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
