import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';

// Error component for global error handling
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4">
      <p>Something went wrong:</p>
      <pre className="text-red-500">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Global error handler for uncaught errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Unhandled error:', error);
      // Here you can send the error to an error reporting service
      // e.g., Sentry.captureException(error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Here you can send the error to an error reporting service
      // e.g., Sentry.captureException(event.reason);
    };

    // Add event listeners for unhandled errors and promise rejections
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection as EventListener);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection as EventListener);
    };
  }, []);

  // Set the document direction based on the current locale (for RTL support)
  useEffect(() => {
    const dir = router.locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = router.locale || 'en';
  }, [router.locale]);

  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log the error to an error reporting service
        console.error('Error caught by error boundary:', error, errorInfo);
      }}
    >
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default appWithTranslation(MyApp);
