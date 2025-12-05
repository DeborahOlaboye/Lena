import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use the provided fallback or the default one
      return this.props.fallback || <DefaultErrorBoundary error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error boundary UI component
const DefaultErrorBoundary = ({ error }: { error?: Error }) => {
  const { t } = useTranslation('common');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t('error.something_went_wrong')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('error.please_try_again')}
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <details className="text-left text-sm text-gray-600 bg-gray-50 p-3 rounded-md overflow-auto max-h-40">
            <summary className="font-medium cursor-pointer mb-2">
              {t('error.details')}
            </summary>
            <pre className="whitespace-pre-wrap">
              {error.message}\n\n{error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {t('error.reload_page')}
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
