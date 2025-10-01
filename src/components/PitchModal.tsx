import React, { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Saree } from '../contexts/DataContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PitchModalProps {
  saree: Saree;
  isOpen: boolean;
  onClose: () => void;
}

export default function PitchModal({ saree, isOpen, onClose }: PitchModalProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    proposedPrice: '',
    rememberMe: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '',
      message: '', 
      proposedPrice: '',
      rememberMe: false 
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to localStorage if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('zarigaas_user_name', formData.name);
        localStorage.setItem('zarigaas_user_email', formData.email);
      } else {
        localStorage.removeItem('zarigaas_user_name');
        localStorage.removeItem('zarigaas_user_email');
      }

      // Send pitch to Firebase
      const pitchesRef = collection(db, 'pitches');
      const timestamp = serverTimestamp();
      
      // Format the data according to the Firestore schema
      const pitchData: Record<string, any> = {
        sareeId: saree.id,
        userId: user?.uid || '',
        pitch: formData.message || '',  // Main pitch content
        message: formData.message || '', // Keep same as pitch for compatibility
        email: formData.email,
        name: formData.name,
        phone: formData.phone || '',
        sareeName: saree.name,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Add optional fields only if they have values
      const proposedPrice = formData.proposedPrice ? parseFloat(formData.proposedPrice) : null;
      if (proposedPrice !== null && !isNaN(proposedPrice)) {
        pitchData.proposed_price = proposedPrice;
      }

      console.log('Adding pitch to Firebase:', pitchData);
      await addDoc(pitchesRef, pitchData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting pitch:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Pre-fill from localStorage if remember me was checked before
      const savedName = localStorage.getItem('zarigaas_user_name');
      const savedEmail = localStorage.getItem('zarigaas_user_email');
      
      if (savedName && savedEmail) {
        setFormData(prev => ({
          ...prev,
          name: savedName,
          email: savedEmail,
          rememberMe: true,
        }));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-rose-gold" />
            <h2 className="text-xl font-serif text-white">Add a Pitch</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-rose-gold" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Pitch Submitted!</h3>
              <p className="text-gray-300 mb-4">
                Thank you for your interest in <span className="text-rose-gold font-medium">{saree.name}</span>. 
                We'll get back to you soon with pricing and availability details.
              </p>
              <button
                onClick={handleClose}
                className="bg-rose-gold hover:bg-rose-gold/80 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-300"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Saree Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
                <img
                  src={saree.imageUrl}
                  alt={saree.name}
                  className="w-16 h-20 object-cover rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.pexels.com/photos/7673219/pexels-photo-7673219.jpeg?auto=compress&cs=tinysrgb&w=200`;
                  }}
                />
                <div>
                  <h3 className="font-medium text-white">{saree.name}</h3>
                  <p className="text-rose-gold text-sm">
                    {saree.priceType === 'fixed' ? `₹${saree.price?.toLocaleString()}` : 'Rate on Request'}
                  </p>
                  <p className="text-gray-400 text-xs">{saree.pitch_count} pitches so far</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300 resize-none"
                    placeholder="Any specific requirements or questions?"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 text-rose-gold bg-gray-800 border-gray-600 rounded focus:ring-rose-gold focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300">
                    Remember me for future pitches
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-gold hover:bg-rose-gold/80 text-black py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-rose-gold/25"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Pitch</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}