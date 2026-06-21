// CACHE_BUST: 1782023892.3194256
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { supabase } from './utils/supabase';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }).catch(err => {
        console.error('getSession error:', err);
        if (mounted) setLoading(false);
      });
    } catch(e) {
      console.error('AuthProvider error:', e);
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function Home() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:20,textAlign:'center'}}>
      <h1 style={{fontSize:28,fontWeight:800,color:'#ff385c',margin:'0 0 8px'}}>Omix Store</h1>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'16px 24px',color:'#166534'}}>
        <p style={{margin:0,fontWeight:600}}>✅ AuthProvider with try-catch works!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SeasonalProvider>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </SeasonalProvider>
    </ErrorBoundary>
  );
}

export default App;
