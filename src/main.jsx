import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initGA } from './utils/analytics'

// Visible debug overlay for mobile debugging
const debugId = 'omix-debug-trace';
function addDebug(msg) {
  let el = document.getElementById(debugId);
  if (!el) {
    el = document.createElement('div');
    el.id = debugId;
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;font-size:11px;padding:4px 8px;line-height:1.4;max-height:50vh;overflow-y:auto;white-space:pre-wrap;word-break:break-all;';
    document.body.appendChild(el);
  }
  el.textContent += msg + '\n';
  console.log(msg);
}

addDebug('[1] main.jsx loaded');

// Apply theme before React renders to prevent flash
(function() {
  addDebug('[2] theme IIFE running');
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
    addDebug('[3] theme OK');
  } catch(e) {
    addDebug('[3] theme ERR: ' + e.message);
  }
})();

try { initGA(); addDebug('[4] GA OK'); } catch(e) { addDebug('[4] GA ERR: ' + e.message); }

addDebug('[5] about to createRoot');

try {
  const rootEl = document.getElementById('root');
  addDebug('[6] root: ' + (rootEl ? 'found' : 'MISSING'));
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
    addDebug('[7] render called');
  } else {
    addDebug('[FATAL] no #root element');
  }
} catch(e) {
  addDebug('[FATAL] ' + e.message);
}
