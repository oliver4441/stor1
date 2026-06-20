import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    // Also catch unhandledErrors that happen outside React
    this._errorHandler = (event) => {
      console.error('Global error caught:', event.error || event.message);
      this.setState({ 
        hasError: true, 
        error: event.error || new Error(event.message || 'Unknown error')
      });
    };
    this._rejectionHandler = (event) => {
      console.error('Unhandled rejection:', event.reason);
      this.setState({ 
        hasError: true, 
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      });
    };
    window.addEventListener('error', this._errorHandler);
    window.addEventListener('unhandledrejection', this._rejectionHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this._errorHandler);
    window.removeEventListener('unhandledrejection', this._rejectionHandler);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorText = this.state.error?.message || this.state.error?.toString() || 'Unknown error';
      const stackText = this.state.error?.stack || this.state.errorInfo?.componentStack || '';
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="max-w-lg bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
            <div className="text-5xl mb-4">Something went wrong</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">App crashed</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
              An unexpected error occurred. Try reloading the page.
            </p>
            <button
              onClick={this.handleRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors mr-2 mb-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-6 py-2 rounded-xl font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors mb-2"
            >
              Reload Page
            </button>
            {errorText && (
              <details className="mt-4 text-left text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">Error details</summary>
                <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg overflow-auto whitespace-pre-wrap text-red-800 dark:text-red-200 max-h-40">
                  {errorText}
                  {stackText ? `\n\n${stackText}` : ''}
                </pre>
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
