import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-push.js').then(reg => {
      console.log('SW registered for push notifications');
    }).catch(err => {
      console.warn('SW registration failed:', err.message);
    });
  });
}

var rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    React.createElement(React.StrictMode, null,
      React.createElement(BrowserRouter, null,
        React.createElement(App, null)
      )
    )
  );
}
