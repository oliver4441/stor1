import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

function Home() {
  return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}>
      <h1 style={{fontSize:32,fontWeight:800,color:'#ff385c'}}>Omix Store</h1>
      <p>Testing Navbar...</p>
    </div>
  );
}

function App() {
  return (
    <SeasonalProvider>
    <LanguageProvider>
    <AuthProvider>
    <CartProvider>
    <NiaChatProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
    </NiaChatProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
    </SeasonalProvider>
  )
}

export default App;
