import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';

function Home() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:20,textAlign:'center'}}>
      <h1 style={{fontSize:28,fontWeight:800,color:'#ff385c',margin:'0 0 8px'}}>Omix Store</h1>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'16px 24px',color:'#166534'}}>
        <p style={{margin:0,fontWeight:600}}>✅ ErrorBoundary + SeasonalProvider work!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SeasonalProvider>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </SeasonalProvider>
    </ErrorBoundary>
  );
}

export default App;
