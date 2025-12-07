import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/core/logging';
import { normalizeError } from '@/core/errors';

interface Props {
  children: ReactNode;
  featureName?: string;
  onReset?: () => void;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = normalizeError(error);

    // Log error with full context
    logger.error('ErrorBoundary caught an error', {
      feature: this.props.featureName || 'unknown',
      error: appError.message,
      code: appError.code,
      componentStack: errorInfo.componentStack,
      stack: error.stack
    });

    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {this.props.featureName ? `Error in ${this.props.featureName}` : 'Oops! Something went wrong'}
            </h1>

            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>

            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="text-xs bg-red-50 p-2 rounded">
                    <div className="font-semibold text-red-800 mb-1">Error:</div>
                    <pre className="text-red-600 overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-semibold text-gray-800 mb-1">Stack Trace:</div>
                      <pre className="text-gray-600 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      <div className="font-semibold text-blue-800 mb-1">Component Stack:</div>
                      <pre className="text-blue-600 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
