import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import App from './App.jsx'
import './index.css'
import './styles/fusion.css'
import './styles/marketplace.css'
import './styles/admin.css'
import './styles/maintenance.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('SW registered');
    }).catch(err => {
      console.warn('SW registration failed:', err.message);
    });
  });
}

var rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    React.createElement(React.StrictMode, null,
      React.createElement(ErrorBoundary, null,
        React.createElement(QueryClientProvider, { client: queryClient },
          React.createElement(HelmetProvider, null,
            React.createElement(BrowserRouter, null,
              React.createElement(App, null)
            )
          )
        )
      )
    )
  );
}
