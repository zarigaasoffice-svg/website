import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function FloatingChatButton() {
  const openWhatsApp = () => {
    const message = "Hi, I'm interested in your sarees collection!";
    const whatsappUrl = `https://wa.me/918838043994?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <button
        onClick={openWhatsApp}
        className="bg-rose-gold hover:bg-rose-gold/90 text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </motion.div>
  );
}
