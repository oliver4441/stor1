import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('omix_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'sw' : 'en';
      try { localStorage.setItem('omix_lang', next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    if (val === undefined) {
      // Fallback to English
      let fallback = translations.en;
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      return fallback || key;
    }
    return val;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isSwahili: lang === 'sw' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}

export default { LanguageProvider, useLang };
