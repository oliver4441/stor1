import React from 'react';

function App() {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1 style={{ color: 'green' }}>OMIX STORE - APP IS RUNNING</h1>
      <p>If you can see this, React is working.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}

export default App;
