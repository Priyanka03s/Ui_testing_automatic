import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const styles = {
    // Status variants
    open: 'bg-red-500/10 text-red-400 border-red-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ignored: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    regressed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',

    // Severity variants
    critical: 'bg-red-950/60 text-red-400 border-red-800/50 font-bold',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20 font-semibold',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',

    // Test results
    passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
    running: 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse',
    queued: 'bg-purple-500/10 text-purple-400 border-purple-500/30',

    // Roles
    SUPER_ADMIN: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/30 font-semibold',
    ADMIN_L2: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    ADMIN_L3: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    USER: 'bg-gray-800 text-gray-300 border-gray-700',

    neutral: 'bg-gray-800 text-gray-300 border-gray-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const selectedStyle = styles[variant] || styles.neutral;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider ${selectedStyle} ${selectedSize} ${className}`}
    >
      {children}
    </span>
  );
};
