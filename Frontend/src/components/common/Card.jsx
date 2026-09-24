import React from 'react';

export const Card = ({ children, className = '', glow = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-xl p-6 transition-all duration-200 ${
        glow ? 'glow-blue' : ''
      } ${onClick ? 'cursor-pointer hover:border-gray-600' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
