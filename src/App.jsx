import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';

function Home() {
  return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}>
      <h1 style={{fontSize:32,fontWeight:800,color:'#ff385c'}}>Omix Store</h1>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'12px 24px',color:'#166534',fontWeight:600}}>
        Seasonal + Language + Auth: OK
      </div>
    </div>
  );
}

function App() {
  return (
    <SeasonalProvider>
    <LanguageProvider>
    <AuthProvider>
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
    </AuthProvider>
    </LanguageProvider>
    </SeasonalProvider>
  )
}

export default App;
