import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600', 
  outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
  link: 'text-blue-500 hover:underline'
};

const sizeStyles = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantStyles[variant]} ${sizeStyles[size]} ${className} rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out`}
        {...props}
      >
        {children}
      </button>
    );
  }
);