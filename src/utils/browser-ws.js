// Browser WebSocket shim — replaces Node.js 'ws' module in browser builds
// Supabase RealtimeClient tries to import 'ws' for Node.js environments
// In the browser, we use the native WebSocket API instead

const BrowserWS = typeof WebSocket !== 'undefined' ? WebSocket : null;
export default BrowserWS;
