import { NextPageContext } from 'next';
import { ErrorProps } from 'next/error';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    
    // This is needed to make the stack trace appear in the error boundary
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const handleApiError = (error: unknown): { message: string; status: number } => {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return { message: error.message, status: error.statusCode };
  }
  
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  
  return { message: 'An unexpected error occurred', status: 500 };
};

export const getErrorPageProps = (
  error: Error & { statusCode?: number },
  ctx?: NextPageContext
): ErrorProps => {
  const statusCode = error.statusCode || (ctx?.res?.statusCode ?? 500);
  
  // Handle 404 errors
  if (statusCode === 404) {
    return { statusCode: 404, title: 'Page Not Found' };
  }
  
  // Handle client-side errors
  if (process.browser) {
    console.error('Client-side error:', error);
    return { statusCode, title: error.message };
  }
  
  // Server-side error logging
  console.error('Server-side error:', error);
  
  return { statusCode, title: error.message };
};

// Error codes and their corresponding messages
export const ERROR_MESSAGES: Record<string, string> = {
  'auth/unauthorized': 'You are not authorized to access this resource.',
  'auth/forbidden': 'You do not have permission to perform this action.',
  'validation/required': 'This field is required.',
  'validation/invalid-email': 'Please enter a valid email address.',
  'network/offline': 'You appear to be offline. Please check your internet connection.',
  'server/unavailable': 'The server is currently unavailable. Please try again later.',
  'timeout': 'The request timed out. Please try again.',
};

export const getErrorMessage = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
  if (!error) return defaultMessage;
  
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error || defaultMessage;
  }
  
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message || defaultMessage;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.message && typeof err.message === 'string') {
      return ERROR_MESSAGES[err.message] || err.message || defaultMessage;
    }
  }
  
  return defaultMessage;
};
