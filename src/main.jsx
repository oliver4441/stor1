import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

var rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.innerHTML = '<div id="trace" style="padding:20px;font-family:monospace;font-size:14px;color:#333"><p>✅ main.jsx loaded</p></div>';
}

function trace(msg, isError) {
  var el = document.getElementById('trace');
  if (el) {
    var p = document.createElement('p');
    p.style.color = isError ? 'red' : 'inherit';
    p.textContent = (isError ? '❌ ' : '✅ ') + msg;
    el.appendChild(p);
  }
}

import('./App.jsx').then(function(mod) {
  trace('App.jsx imported');
  var App = mod.default;
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      React.createElement(React.StrictMode, null,
        React.createElement(BrowserRouter, null,
          React.createElement(App, null)
        )
      )
    );
    trace('React rendered');
  }
}).catch(function(e) {
  trace('App.jsx import failed: ' + e.message, true);
  var el = document.getElementById('trace');
  if (el) {
    var pre = document.createElement('pre');
    pre.style.color = 'red';
    pre.style.fontSize = '12px';
    pre.textContent = e.stack || e.message;
    el.appendChild(pre);
  }
});
