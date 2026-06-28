import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error.message, error.stack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="max-w-md bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-zinc-400 mb-2 text-sm">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-red-100 dark:bg-red-900/40 p-3 rounded-lg mb-4 overflow-auto max-h-40 text-red-800 dark:text-red-200">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
