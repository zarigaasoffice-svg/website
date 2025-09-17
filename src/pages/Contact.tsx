import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have questions about our sarees or need personalized assistance? 
            We're here to help you find the perfect piece for your special occasion.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-rose-gold/20">
              <h2 className="font-serif text-2xl text-white mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-rose-gold/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Email</h3>
                    <p className="text-gray-300">hello@zarigaas.com</p>
                    <p className="text-gray-400 text-sm">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-rose-gold/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Phone</h3>
                    <p className="text-gray-300">+91 98765 43210</p>
                    <p className="text-gray-400 text-sm">Mon-Sat, 10 AM - 7 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-rose-gold/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Address</h3>
                    <p className="text-gray-300">123 Silk Street</p>
                    <p className="text-gray-300">Mumbai, Maharashtra 400001</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-rose-gold/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Business Hours</h3>
                    <p className="text-gray-300">Monday - Saturday: 10 AM - 7 PM</p>
                    <p className="text-gray-300">Sunday: 11 AM - 5 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-rose-gold/20">
              <h2 className="font-serif text-2xl text-white mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-rose-gold mb-2">How does the pitch system work?</h3>
                  <p className="text-gray-300 text-sm">
                    Simply click "Add Pitch" on any saree you're interested in. We'll contact you with pricing and availability details.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-rose-gold mb-2">What's the difference between fixed and DM pricing?</h3>
                  <p className="text-gray-300 text-sm">
                    Fixed price sarees have transparent pricing, while DM price sarees are exclusive pieces with personalized quotes.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-rose-gold mb-2">Do you ship nationwide?</h3>
                  <p className="text-gray-300 text-sm">
                    Yes, we ship across India with careful packaging and tracking for safe delivery of your precious sarees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-rose-gold/20">
            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-rose-gold" />
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">Message Sent!</h3>
                <p className="text-gray-300 mb-6">
                  Thank you for reaching out. We'll get back to you within 24 hours with a response to your inquiry.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="bg-rose-gold hover:bg-rose-gold/80 text-black px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <MessageCircle className="w-6 h-6 text-rose-gold mr-3" />
                  <h2 className="font-serif text-2xl text-white">Send us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="Enter your name"
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
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-gold transition-colors duration-300 resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-rose-gold hover:bg-rose-gold/80 text-black py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-rose-gold/25"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}