import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initGA } from './utils/analytics'

console.log('[TRACE 1] main.jsx loaded');

// Apply theme before React renders to prevent flash
(function() {
  console.log('[TRACE 2] IIFE theme check running');
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      if (stored === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
    console.log('[TRACE 3] Theme applied OK');
  } catch(e) {
    console.error('[TRACE 3] Theme error:', e);
  }
})();

// Initialize Google Analytics
try {
  initGA();
  console.log('[TRACE 4] GA init OK');
} catch(e) {
  console.error('[TRACE 4] GA init error:', e);
}

console.log('[TRACE 5] About to createRoot');

try {
  const rootEl = document.getElementById('root');
  console.log('[TRACE 6] root element:', rootEl ? 'found' : 'NOT FOUND');
  if (!rootEl) {
    document.body.innerHTML = '<div style="padding:20px;color:red;font-family:monospace"><h1>FATAL: #root not found</h1></div>';
  } else {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
    console.log('[TRACE 7] createRoot.render called');
  }
} catch(e) {
  console.error('[TRACE 7] FATAL render error:', e);
  document.body.innerHTML = '<div style="padding:20px;color:red;font-family:monospace"><h1>FATAL: Render crashed</h1><pre>' + e.message + '\n' + e.stack + '</pre></div>';
}
