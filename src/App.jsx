import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { supabase } from './utils/supabase';

// Safe AuthProvider with error handling
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <div style={{padding:20,color:'red',fontFamily:'monospace',fontSize:12,whiteSpace:'pre-wrap'}}>
        AUTH ERROR: {error}
      </div>
    );
  }

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
        <p style={{margin:0,fontWeight:600}}>✅ AuthProvider works!</p>
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
