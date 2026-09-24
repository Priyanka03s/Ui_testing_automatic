import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 focus:ring-blue-500 border border-blue-500/30',
    secondary:
      'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 focus:ring-gray-600 shadow-sm',
    outline:
      'bg-transparent hover:bg-gray-800/60 text-gray-300 hover:text-white border border-gray-700 focus:ring-gray-500',
    danger:
      'bg-red-600/90 hover:bg-red-500 text-white shadow-md shadow-red-500/20 focus:ring-red-500 border border-red-500/30',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 focus:ring-emerald-500 border border-emerald-500/30',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-200 focus:ring-gray-600',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
