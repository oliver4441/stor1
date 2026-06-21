import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import themesConfig from '../config/seasonal-themes.json';
import { supabase } from '../utils/supabase';

const SeasonalContext = createContext(null);

const THEME_STATES_KEY = 'omix_theme_states';

/**
 * Check if current date falls within a theme's date range.
 * Date format: "MM-DD" for start/end.
 * Handles year-wrap ranges (e.g. Dec 26 - Jan 5).
 */
function isDateInRange(startStr, endStr, now) {
  const year = now.getFullYear();
  const [startMonth, startDay] = startStr.split('-').map(Number);
  const [endMonth, endDay] = endStr.split('-').map(Number);

  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);

  // Handle year-wrap (e.g. Dec 26 - Jan 5)
  if (endDate < startDate) {
    const endDateNextYear = new Date(year + 1, endMonth - 1, endDay);
    if (now >= startDate && now <= endDateNextYear) return true;
    const startDatePrevYear = new Date(year - 1, startMonth - 1, startDay);
    if (now >= startDatePrevYear && now <= endDate) return true;
    return false;
  }

  return now >= startDate && now <= endDate;
}

/**
 * Find the active theme for the current date.
 * Returns the first matching enabled theme, or null.
 */
function getActiveTheme(themes, now = new Date()) {
  for (const theme of themes) {
    if (!theme.enabled) continue;
    const { start, end } = theme.dateRange;
    if (isDateInRange(start, end, now)) {
      return theme;
    }
  }
  return null;
}

/**
 * Merge themes from JSON config with saved enabled states.
 * Priority: localStorage > Supabase > JSON default
 */
function mergeThemeStates(themes) {
  let savedStates = {};
  try {
    const stored = localStorage.getItem(THEME_STATES_KEY);
    if (stored) savedStates = JSON.parse(stored);
  } catch {}
  return themes.map(t => ({
    ...t,
    enabled: savedStates[t.id] !== undefined ? savedStates[t.id] : t.enabled,
  }));
}

export function SeasonalProvider({ children, previewThemeId = null }) {
  const [previewTheme, setPreviewTheme] = useState(previewThemeId);
  const [savedStates, setSavedStates] = useState(null);

  // Load saved theme states from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'theme_enabled_states')
          .single();
        if (!cancelled && data?.value) {
          setSavedStates(data.value);
          // Also sync to localStorage for immediate use
          try { localStorage.setItem(THEME_STATES_KEY, JSON.stringify(data.value)); } catch {}
        }
      } catch {
        // Row might not exist — use defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const themes = useMemo(() => {
    if (savedStates) {
      return themesConfig.themes.map(t => ({
        ...t,
        enabled: savedStates[t.id] !== undefined ? savedStates[t.id] : t.enabled,
      }));
    }
    // Fall back to localStorage + JSON defaults
    return mergeThemeStates(themesConfig.themes);
  }, [savedStates]);

  const activeTheme = useMemo(() => {
    if (previewTheme) {
      return themes.find(t => t.id === previewTheme) || null;
    }
    return getActiveTheme(themes);
  }, [themes, previewTheme]);

  const value = useMemo(() => ({
    activeTheme,
    allThemes: themes,
    setPreviewTheme,
    clearPreview: () => setPreviewTheme(null),
    isPreviewing: !!previewTheme,
  }), [activeTheme, themes, previewTheme]);

  return (
    <SeasonalContext.Provider value={value}>
      {children}
    </SeasonalContext.Provider>
  );
}

export function useSeasonalTheme() {
  const context = useContext(SeasonalContext);
  if (!context) {
    throw new Error('useSeasonalTheme must be used within a SeasonalProvider');
  }
  return context;
}

// Convenience hook for components that just need the active theme
export function useActiveTheme() {
  const { activeTheme } = useSeasonalTheme();
  return activeTheme;
}
