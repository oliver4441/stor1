import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Dark mode CSS: replaces navy/blue/grey tones with pure dark
function buildDarkModeCSS() {
  return `
/* ── DARK MODE: Pure dark overrides (replaces blue/grey tones) ── */
html[data-theme="dark"] { background-color: #050505; }

html[data-theme="dark"] [class*="bg-[#1E2A3D]"],
html[data-theme="dark"] [class*="bg-\\[\\#1E2A3D\\]"] { background-color: #0a0a0a !important; }

html[data-theme="dark"] [class*="bg-[#28303F]"],
html[data-theme="dark"] [class*="bg-\\[\\#28303F\\]"] { background-color: #0d0d0d !important; }

html[data-theme="dark"] [class*="bg-[#242C3B]"],
html[data-theme="dark"] [class*="bg-\\[\\#242C3B\\]"] { background-color: #0a0a0a !important; }

html[data-theme="dark"] [class*="border-[#353F54]"],
html[data-theme="dark"] [class*="border-\\[\\#353F54\\]"] { border-color: #1a1a1a !important; }

html[data-theme="dark"] [class*="text-[#8E9BB5]"],
html[data-theme="dark"] [class*="text-\\[\\#8E9BB5\\]"] { color: #525252 !important; }

html[data-theme="dark"] [class*="text-[#4A5771]"],
html[data-theme="dark"] [class*="text-\\[\\#4A5771\\]"] { color: #404040 !important; }

html[data-theme="dark"] .fusion-recessed-card {
  background-color: #0a0a0a !important;
  border-color: #1a1a1a !important;
}

html[data-theme="dark"] nav { 
  background-color: rgba(5,5,5,0.9) !important;
  border-bottom-color: #1a1a1a !important;
}

html[data-theme="dark"] footer { background-color: #050505 !important; }

html[data-theme="dark"] input,
html[data-theme="dark"] select,
html[data-theme="dark"] textarea {
  background-color: #0d0d0d !important;
  border-color: #1a1a1a !important;
  color: #fafafa !important;
}
`;
}

// Light mode CSS overrides
function buildLightModeCSS() {
  return `
/* ── LIGHT MODE: Clean white/light overrides ── */
html[data-theme="light"] { background-color: #fafafa; }

html[data-theme="light"] [class*="bg-[#08080a]"],
html[data-theme="light"] [class*="bg-\\[\\#08080a\\]"] { background-color: #fafafa !important; }

html[data-theme="light"] [class*="bg-[#1E2A3D]"],
html[data-theme="light"] [class*="bg-\\[\\#1E2A3D\\]"],
html[data-theme="light"] [class*="bg-[#242C3B]"],
html[data-theme="light"] [class*="bg-\\[\\#242C3B\\]"] { background-color: #ffffff !important; }

html[data-theme="light"] [class*="bg-[#28303F]"],
html[data-theme="light"] [class*="bg-\\[\\#28303F\\]"],
html[data-theme="light"] [class*="bg-[#0d0d0d]"],
html[data-theme="light"] [class*="bg-\\[\\#0d0d0d\\]"] { background-color: #f5f5f5 !important; }

html[data-theme="light"] [class*="bg-[#0a0a0a]"],
html[data-theme="light"] [class*="bg-\\[\\#0a0a0a\\]"] { background-color: #fafafa !important; }

html[data-theme="light"] [class*="bg-[#141414]"],
html[data-theme="light"] [class*="bg-\\[\\#141414\\]"] { background-color: #f5f5f5 !important; }

html[data-theme="light"] [class*="bg-[#1f1f1f]"],
html[data-theme="light"] [class*="bg-\\[\\#1f1f1f\\]"] { background-color: #e5e5e5 !important; }

html[data-theme="light"] [class*="border-[#353F54]"],
html[data-theme="light"] [class*="border-\\[\\#353F54\\]"],
html[data-theme="light"] [class*="border-[#1f1f1f]"],
html[data-theme="light"] [class*="border-\\[\\#1f1f1f\\]"],
html[data-theme="light"] [class*="border-[#1a1a1a]"],
html[data-theme="light"] [class*="border-\\[\\#1a1a1a\\]"] { border-color: #e5e5e5 !important; }

html[data-theme="light"] [class*="text-[#8E9BB5]"],
html[data-theme="light"] [class*="text-\\[\\#8E9BB5\\]"] { color: #737373 !important; }

html[data-theme="light"] [class*="text-[#4A5771]"],
html[data-theme="light"] [class*="text-\\[\\#4A5771\\]"],
html[data-theme="light"] [class*="text-[#525252]"],
html[data-theme="light"] [class*="text-\\[\\#525252\\]"] { color: #a3a3a3 !important; }

html[data-theme="light"] [class*="bg-zinc-800"],
html[data-theme="light"] [class*="bg-zinc-900"],
html[data-theme="light"] [class*="bg-zinc-950"] { background-color: #f5f5f5 !important; }

html[data-theme="light"] [class*="bg-black"] { background-color: #ffffff !important; }

html[data-theme="light"] [class*="text-white"]:not([class*="hover"]):not(nav *):not(button *):not(a *) { color: #0a0a0a !important; }

html[data-theme="light"] .fusion-recessed-card {
  background-color: #ffffff !important;
  border-color: #e5e5e5 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
}

html[data-theme="light"] footer { background-color: #fafafa !important; }

html[data-theme="light"] nav { 
  background-color: rgba(255,255,255,0.9) !important;
  border-bottom-color: #e5e5e5 !important;
}

html[data-theme="light"] input,
html[data-theme="light"] select,
html[data-theme="light"] textarea {
  background-color: #fafafa !important;
  border-color: #e5e5e5 !important;
  color: #0a0a0a !important;
}

html[data-theme="light"] [class*="hover:bg-\\[\\#28303F\\]"]:hover,
html[data-theme="light"] [class*="hover:bg-zinc-800"]:hover { background-color: #e5e5e5 !important; }

html[data-theme="light"] .leaflet-container { background-color: #f5f5f5 !important; }
`;
}

const THEME_STORAGE_KEY = 'omix_theme_mode';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(THEME_STORAGE_KEY) || 'dark'; }
    catch { return 'dark'; }
  });

  // Apply theme: set attribute + inject/remove CSS
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}

    let styleEl = document.getElementById('omix-theme-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'omix-theme-overrides';
      document.head.appendChild(styleEl);
    }

    if (theme === 'light') {
      styleEl.textContent = buildDarkModeCSS() + '\n' + buildLightModeCSS();
    } else {
      styleEl.textContent = buildDarkModeCSS();
    }

    document.documentElement.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t) => {
    if (t === 'dark' || t === 'light') setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark', isLight: theme === 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
