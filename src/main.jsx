import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initGA } from './utils/analytics'

// GLOBAL ERROR HANDLER - catches everything including module errors
window.onerror = function(msg, url, line, col, error) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#000;color:#ff0;font-family:monospace;font-size:12px;padding:16px;z-index:99999;overflow:auto;white-space:pre-wrap;word-break:break-all;';
  el.textContent = 'FATAL ERROR:\n' + msg + '\n\nURL: ' + url + '\nLine: ' + line + '\nCol: ' + col + '\n\nStack:\n' + (error && error.stack ? error.stack : 'N/A');
  document.body.appendChild(el);
  return false;
};

window.onunhandledrejection = function(event) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#000;color:#ff0;font-family:monospace;font-size:12px;padding:16px;z-index:99999;overflow:auto;white-space:pre-wrap;word-break:break-all;';
  el.textContent = 'UNHANDLED PROMISE REJECTION:\n' + (event.reason && event.reason.stack ? event.reason.stack : String(event.reason));
  document.body.appendChild(el);
};

// Apply theme before React renders
(function() {
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
  } catch(e) {}
})();

try { initGA(); } catch(e) {}

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch(e) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#000;color:#ff0;font-family:monospace;font-size:12px;padding:16px;z-index:99999;overflow:auto;white-space:pre-wrap;word-break:break-all;';
    el.textContent = 'REACT RENDER ERROR:\n' + e.message + '\n\n' + e.stack;
    document.body.appendChild(el);
  }
}
