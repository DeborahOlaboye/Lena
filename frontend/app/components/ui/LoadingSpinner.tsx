import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

const colorClasses = {
  primary: 'border-indigo-500 border-t-transparent',
  secondary: 'border-gray-500 border-t-transparent',
  accent: 'border-pink-500 border-t-transparent',
  white: 'border-white border-t-transparent',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`inline-block ${className}`} role="status">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-hidden="true"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  text = 'Loading...',
  spinnerSize = 'md',
  className = '',
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
        <LoadingSpinner size={spinnerSize} />
        {text && <p className="text-gray-700 dark:text-gray-200">{text}</p>}
      </div>
    </div>
  );
}

export function InlineLoading({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
    </div>
  );
}
