import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className = '' }: LoadingIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full h-full">
        <motion.div
          className="absolute inset-0 border-t-2 border-indigo-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  showSpinner?: boolean;
}

export const LoadingWrapper = ({
  loading,
  children,
  className = '',
  showSpinner = true
}: LoadingWrapperProps) => {
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {loading && showSpinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{
          opacity: loading ? 0.5 : 1,
          scale: loading ? 0.98 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};