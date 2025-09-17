import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user, signIn, signUp } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = isLogin
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password, formData.name);
      
      if (error) {
        let errorMessage = 'An error occurred';
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Invalid password';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'An account already exists with this email';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          default:
            errorMessage = error.message || 'An error occurred';
        }
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join Zarigaas'}
          </h1>
          <p className="text-gray-300">
            {isLogin 
              ? 'Sign in to your account to continue shopping' 
              : 'Create your account to start exploring our collection'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-rose-gold/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-gold hover:bg-rose-gold/80 text-black py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-rose-gold/25"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-rose-gold hover:text-rose-gold/80 font-medium transition-colors duration-300"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Demo Credentials:</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p><span className="text-rose-gold">Admin:</span> admin@zarigaas.com / admin123</p>
            <p><span className="text-rose-gold">User:</span> user@zarigaas.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}