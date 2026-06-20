import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initGA } from './utils/analytics'

// Show a visible error on screen instead of white screen
function showFatalError(error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif;background:#fff;">
        <div style="max-width:500px;text-align:center;padding:40px;border-radius:16px;border:2px solid #ef4444;background:#fef2f2;">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <h1 style="color:#dc2626;font-size:24px;margin-bottom:12px;">Omix Store failed to load</h1>
          <p style="color:#666;margin-bottom:16px;font-size:14px;">This is a temporary issue. Try the steps below:</p>
          <div style="text-align:left;background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;font-size:13px;color:#444;">
            <p style="margin:0 0 8px;"><strong>1.</strong> Hard refresh: <code>Ctrl+Shift+R</code> (or <code>Cmd+Shift+R</code> on Mac)</p>
            <p style="margin:0 0 8px;"><strong>2.</strong> Clear browser cache and reload</p>
            <p style="margin:0 0 8px;"><strong>3.</strong> Try opening in an incognito/private window</p>
            <p style="margin:0;"><strong>4.</strong> If the problem persists, try a different browser</p>
          </div>
          <button onclick="window.location.reload()" style="background:#dc2626;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold;">
            Reload Page
          </button>
          <details style="margin-top:16px;text-align:left;font-size:12px;color:#888;">
            <summary style="cursor:pointer;">Technical details</summary>
            <pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto;margin-top:8px;white-space:pre-wrap;word-break:break-all;">${error?.message || error?.toString() || 'Unknown error'}</pre>
          </details>
        </div>
      </div>
    `;
  }
  console.error('Fatal app error:', error);
}

// Apply theme before React renders to prevent flash
(function tryTheme() {
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
  } catch (e) {
    // localStorage not available — ignore
  }
})();

// Trace helper — writes to both console and a visible on-screen log
window.__traceLog = [];
function trace(msg) {
  window.__traceLog.push(msg);
  console.log('[TRACE]', msg);
  // Also write to a visible debug div
  var dbg = document.getElementById('trace-debug');
  if (dbg) {
    dbg.innerHTML += msg + '\n';
    dbg.scrollTop = dbg.scrollHeight;
  }
}

try {
  trace('1. Starting bootstrap');
  
  // Initialize Google Analytics (non-blocking)
  try { initGA(); trace('2. GA init done'); } catch(e) { console.warn('GA init failed:', e); trace('2. GA init failed: ' + e.message); }

  trace('3. About to render React');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
  
  trace('4. React render called');
  
  // Signal that the app loaded successfully
  window.__appLoaded = true;
  // Hide the initial loader
  var loader = document.getElementById('initial-loader');
  if (loader) loader.style.display = 'none';
  
  trace('5. Loader hidden');
} catch (error) {
  trace('ERROR: ' + (error?.message || error));
  showFatalError(error);
}
