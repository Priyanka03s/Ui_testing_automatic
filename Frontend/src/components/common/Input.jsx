import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full rounded-lg bg-gray-900/90 border px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ${
          error ? 'border-red-500/80 focus:ring-red-500' : 'border-gray-700/80 hover:border-gray-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};
