import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import './styles/fusion.css'
import './styles/marketplace.css'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
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
      React.createElement(HelmetProvider, null,
        React.createElement(BrowserRouter, null,
          React.createElement(App, null)
        )
      )
    )
  );
}
