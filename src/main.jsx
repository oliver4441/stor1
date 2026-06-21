import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

console.log('🔵 main.jsx executing, imports done');

var rootEl = document.getElementById('root');
console.log('🔵 root element:', rootEl ? 'found' : 'NOT FOUND');

if (rootEl) {
  try {
    var root = ReactDOM.createRoot(rootEl);
    console.log('🔵 React root created');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(BrowserRouter, null,
          React.createElement(App, null)
        )
      )
    );
    console.log('🔵 React render called');
  } catch(e) {
    console.error('🔴 Error:', e.message);
    document.body.innerHTML = '<div style="padding:20px;color:red;font-family:monospace;word-break:break-all"><h2>Error</h2><p>' + e.message + '</p><pre style="font-size:11px;overflow:auto">' + (e.stack||'') + '</pre></div>';
  }
}
