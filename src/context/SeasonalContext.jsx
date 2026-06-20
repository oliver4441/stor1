import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import themesConfig from '../config/seasonal-themes.json';

const SeasonalContext = createContext(null);

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
    // Range wraps into next year
    const endDateNextYear = new Date(year + 1, endMonth - 1, endDay);
    if (now >= startDate && now <= endDateNextYear) return true;
    // Also check if we're in the early part of the range (Jan 1-5)
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

export function SeasonalProvider({ children, previewThemeId = null }) {
  const [previewTheme, setPreviewTheme] = useState(previewThemeId);

  const activeTheme = useMemo(() => {
    if (previewTheme) {
      return themesConfig.themes.find(t => t.id === previewTheme) || null;
    }
    return getActiveTheme(themesConfig.themes);
  }, [previewTheme]);

  // Provide theme data + preview controls
  const value = useMemo(() => ({
    activeTheme,
    allThemes: themesConfig.themes,
    setPreviewTheme,
    clearPreview: () => setPreviewTheme(null),
    isPreviewing: !!previewTheme,
  }), [activeTheme, previewTheme]);

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
