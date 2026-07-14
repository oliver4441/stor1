import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'omix_offline_mode';
const OfflineModeContext = createContext(null);

export function OfflineModeProvider({ children }) {
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    // URL param ?offline=1 activates it on load
    const params = new URLSearchParams(window.location.search);
    if (params.get('offline') === '1') {
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      return true;
    }
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch {}
    return false;
  });

  const toggleOfflineMode = useCallback(() => {
    setIsOfflineMode(prev => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, 'true');
        else localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return next;
    });
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsOfflineMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <OfflineModeContext.Provider value={{ isOfflineMode, toggleOfflineMode }}>
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const ctx = useContext(OfflineModeContext);
  if (!ctx) throw new Error('useOfflineMode must be used within OfflineModeProvider');
  return ctx;
}
