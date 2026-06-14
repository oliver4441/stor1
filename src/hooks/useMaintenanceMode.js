import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const CACHE_KEY = 'omix_maintenance_mode';
const CACHE_TTL = 60_000; // 1 minute cache

/**
 * Global maintenance mode hook.
 * Fetches the `maintenance_mode` flag from Supabase app_settings.
 * Caches in localStorage for 60s to avoid excessive requests.
 * Returns { isMaintenance, loading, refetch, setMaintenance }.
 *
 * Usage:
 *   const { isMaintenance } = useMaintenanceMode();
 *   if (isMaintenance) showBanner();
 */
export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(() => {
    // Check localStorage cache first for instant render
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { value, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return value;
      }
    } catch { /* ignore */ }
    return false;
  });
  const [loading, setLoading] = useState(true);

  const fetchMode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (error) throw error;

      const mode = data?.value === true;
      setIsMaintenance(mode);

      // Cache in localStorage
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode, ts: Date.now() }));
      } catch { /* ignore */ }

      return mode;
    } catch (err) {
      console.warn('Failed to fetch maintenance mode:', err.message);
      // On error, fall back to cached value or false
      return isMaintenance;
    } finally {
      setLoading(false);
    }
  }, [isMaintenance]);

  // Fetch on mount
  useEffect(() => {
    fetchMode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30s for changes (admin may toggle at any time)
  useEffect(() => {
    const interval = setInterval(fetchMode, 30_000);
    return () => clearInterval(interval);
  }, [fetchMode]);

  // Allow admin to update maintenance mode
  const setMaintenance = useCallback(async (enabled) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: enabled, updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode');

      if (error) throw error;

      setIsMaintenance(enabled);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ value: enabled, ts: Date.now() }));
      } catch { /* ignore */ }

      return true;
    } catch (err) {
      console.error('Failed to update maintenance mode:', err.message);
      return false;
    }
  }, []);

  return { isMaintenance, loading, refetch: fetchMode, setMaintenance };
}

/**
 * Non-reactive version — just checks localStorage cache synchronously.
 * Use this in event handlers where you can't use hooks.
 */
export function isMaintenanceCached() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { value, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return value;
    }
  } catch { /* ignore */ }
  return false;
}
