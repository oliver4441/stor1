import { createContext, useContext, useState, useMemo } from 'react';
import themesConfig from '../config/seasonal-themes.json';

const SeasonalContext = createContext(null);

function isDateInRange(startStr, endStr, now) {
  const year = now.getFullYear();
  const [startMonth, startDay] = startStr.split('-').map(Number);
  const [endMonth, endDay] = endStr.split('-').map(Number);

  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);

  if (endDate < startDate) {
    const endDateNextYear = new Date(year + 1, endMonth - 1, endDay);
    if (now >= startDate && now <= endDateNextYear) return true;
    const startDatePrevYear = new Date(year - 1, startMonth - 1, startDay);
    if (now >= startDatePrevYear && now <= endDate) return true;
    return false;
  }

  return now >= startDate && now <= endDate;
}

function getActiveTheme(themes, now = new Date()) {
  // First pass: find a matching seasonal (non-default) theme
  for (const theme of themes) {
    if (!theme.enabled || theme.id === 'default') continue;
    const { start, end } = theme.dateRange;
    if (isDateInRange(start, end, now)) {
      return theme;
    }
  }
  // Fallback: default theme
  return themes.find(t => t.id === 'default') || null;
}

export function SeasonalProvider({ children, previewThemeId = null }) {
  const [previewTheme, setPreviewTheme] = useState(previewThemeId);

  const activeTheme = useMemo(() => {
    if (previewTheme) {
      return themesConfig.themes.find(t => t.id === previewTheme) || null;
    }
    return getActiveTheme(themesConfig.themes);
  }, [previewTheme]);

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

export function useActiveTheme() {
  const { activeTheme } = useSeasonalTheme();
  return activeTheme;
}
