import { useState, useEffect } from 'react';

// Laziest filter persist for admin SPA tab navigation.
// Reads sessionStorage on mount, writes on every change.
export default function usePersistFilter(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}
