import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initGA } from './utils/analytics'

// Register service worker for PWA install support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Check for updates every time the page loads
      reg.update();
      
      // If a new SW is waiting, force it to activate
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Listen for new SW installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW is installed but waiting — prompt user to reload
            // The PWAUpdateChecker component handles this
          }
        });
      });
    }).catch(() => {
      // Service worker registration failed — app still works as normal website
    });
    
    // Listen for controller change (new SW activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Apply theme before React renders to prevent flash
(function() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    if (stored === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } else {
    // No stored preference — follow system
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
})();

// Initialize Google Analytics
initGA();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
