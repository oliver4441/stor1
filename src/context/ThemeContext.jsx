import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Dark mode CSS: warm dark with depth, teal accents
function buildDarkModeCSS() {
  return `
/* ── DARK MODE: Warm depth with teal accent ── */
html[data-theme="dark"] { background-color: #0a0a09; }

/* Section backgrounds — warm layered depths */
html[data-theme="dark"] [class*="bg-[#1E2A3D]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#1E2A3D\\\\]"],
html[data-theme="dark"] [class*="bg-[#242C3B]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#242C3B\\\\]"] { background-color: #0f0f0d !important; }

html[data-theme="dark"] [class*="bg-[#28303F]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#28303F\\\\]"] { background-color: #141311 !important; }

html[data-theme="dark"] [class*="bg-[#08080a]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#08080a\\\\]"],
html[data-theme="dark"] [class*="bg-[#0a0a0a]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#0a0a0a\\\\]"] { background-color: #0a0a09 !important; }

html[data-theme="dark"] [class*="bg-[#141414]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#141414\\\\]"] { background-color: #121210 !important; }

html[data-theme="dark"] [class*="bg-[#1f1f1f]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#1f1f1f\\\\]"] { background-color: #1a1916 !important; }

/* Borders — warm grey */
html[data-theme="dark"] [class*="border-[#353F54]"],
html[data-theme="dark"] [class*="border-\\\\[\\\\#353F54\\\\]"],
html[data-theme="dark"] [class*="border-[#1f1f1f]"],
html[data-theme="dark"] [class*="border-\\\\[\\\\#1f1f1f\\\\]"],
html[data-theme="dark"] [class*="border-[#1a1a1a]"],
html[data-theme="dark"] [class*="border-\\\\[\\\\#1a1a1a\\\\]"] { border-color: #22201c !important; }

/* Text colors — warm greys */
html[data-theme="dark"] [class*="text-[#8E9BB5]"],
html[data-theme="dark"] [class*="text-\\\\[\\\\#8E9BB5\\\\]"] { color: #8a8580 !important; }

html[data-theme="dark"] [class*="text-[#4A5771]"],
html[data-theme="dark"] [class*="text-\\\\[\\\\#4A5771\\\\]"],
html[data-theme="dark"] [class*="text-[#525252]"],
html[data-theme="dark"] [class*="text-\\\\[\\\\#525252\\\\]"] { color: #6b6660 !important; }

html[data-theme="dark"] [class*="bg-zinc-800"] { background-color: #1a1916 !important; }
html[data-theme="dark"] [class*="bg-zinc-900"] { background-color: #121210 !important; }
html[data-theme="dark"] [class*="bg-zinc-950"] { background-color: #0a0a09 !important; }

/* Accent — teal */
html[data-theme="dark"] [class*="bg-accent"],
html[data-theme="dark"] [class*="bg-[#71717a]"],
html[data-theme="dark"] [class*="bg-\\\\[\\\\#71717a\\\\]"] { background-color: #0d9488 !important; }

html[data-theme="dark"] [class*="text-accent"],
html[data-theme="dark"] [class*="text-accent-content"],
html[data-theme="dark"] [class*="text-[#71717a]"],
html[data-theme="dark"] [class*="text-\\\\[\\\\#71717a\\\\]"] { color: #14b8a6 !important; }

html[data-theme="dark"] [class*="border-accent"],
html[data-theme="dark"] [class*="border-[#71717a]"],
html[data-theme="dark"] [class*="border-\\\\[\\\\#71717a\\\\]"] { border-color: #0d9488 !important; }

html[data-theme="dark"] [style*="--seasonal-primary"],
html[data-theme="dark"] [style*="--seasonal-primary,#71717a"] {
  --seasonal-primary: #14b8a6 !important;
}

/* Surface colors via CSS variables */
html[data-theme="dark"] .bg-surface { background-color: #0f0f0d !important; }
html[data-theme="dark"] .bg-surface-alt { background-color: #141311 !important; }
html[data-theme="dark"] .text-primary { color: #f5f3f0 !important; }
html[data-theme="dark"] .text-muted { color: #6b6660 !important; }

/* Cards */
html[data-theme="dark"] .fusion-recessed-card { 
  background-color: #0f0f0d !important;
  border-color: #22201c !important;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.7),
              inset 0 -1px 0 rgba(255,255,255,0.03),
              0 1px 0 rgba(255,255,255,0.04),
              0 12px 24px rgba(0,0,0,0.5) !important;
}

/* Wallet specific cards */
html[data-theme="dark"] .wallet-balance-card {
  background: linear-gradient(135deg, #0f0f0d 0%, #141311 100%) !important;
  border: 1px solid #22201c !important;
  border-radius: 22px !important;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.7),
              inset 0 -1px 0 rgba(255,255,255,0.03),
              0 12px 24px rgba(0,0,0,0.5) !important;
}

html[data-theme="dark"] .wallet-transaction-card {
  background-color: #0f0f0d !important;
  border: 1px solid #22201c !important;
  border-radius: 22px !important;
}

html[data-theme="dark"] nav { 
  background-color: rgba(10,10,9,0.9) !important;
  border-bottom-color: #22201c !important;
}

html[data-theme="dark"] footer { background-color: #0a0a09 !important; }

html[data-theme="dark"] input,
html[data-theme="dark"] select,
html[data-theme="dark"] textarea {
  background-color: #141311 !important;
  border-color: #22201c !important;
  color: #f5f3f0 !important;
}

html[data-theme="dark"] [class*="hover:bg-\\\\[\\\\#28303F\\\\]"]:hover,
html[data-theme="dark"] [class*="hover:bg-zinc-800"]:hover { background-color: #1a1916 !important; }

html[data-theme="dark"] .leaflet-container { background-color: #0f0f0d !important; }
`;
}

// Light mode CSS: warm off-white, refined, comfortable
function buildLightModeCSS() {
  return `
/* ── LIGHT MODE: Warm, refined, comfortable ── */
html[data-theme="light"] { background-color: #f3f0eb; }

html[data-theme="light"] [class*="bg-[#08080a]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#08080a\\\\]"] { background-color: #f3f0eb !important; }

html[data-theme="light"] [class*="bg-[#1E2A3D]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#1E2A3D\\\\]"],
html[data-theme="light"] [class*="bg-[#242C3B]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#242C3B\\\\]"] { background-color: #faf8f5 !important; }

html[data-theme="light"] [class*="bg-[#28303F]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#28303F\\\\]"],
html[data-theme="light"] [class*="bg-[#0d0d0d]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#0d0d0d\\\\]"] { background-color: #f0ede8 !important; }

html[data-theme="light"] [class*="bg-[#0a0a0a]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#0a0a0a\\\\]"] { background-color: #f3f0eb !important; }

html[data-theme="light"] [class*="bg-[#141414]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#141414\\\\]"] { background-color: #f0ede8 !important; }

html[data-theme="light"] [class*="bg-[#1f1f1f]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#1f1f1f\\\\]"] { background-color: #e8e4de !important; }

/* Borders */
html[data-theme="light"] [class*="border-[#353F54]"],
html[data-theme="light"] [class*="border-\\\\[\\\\#353F54\\\\]"],
html[data-theme="light"] [class*="border-[#1f1f1f]"],
html[data-theme="light"] [class*="border-\\\\[\\\\#1f1f1f\\\\]"],
html[data-theme="light"] [class*="border-[#1a1a1a]"],
html[data-theme="light"] [class*="border-\\\\[\\\\#1a1a1a\\\\]"] { border-color: #ddd8d0 !important; }

/* Text — warm black */
html[data-theme="light"] [class*="text-[#8E9BB5]"],
html[data-theme="light"] [class*="text-\\\\[\\\\#8E9BB5\\\\]"] { color: #8a8580 !important; }

html[data-theme="light"] [class*="text-[#4A5771]"],
html[data-theme="light"] [class*="text-\\\\[\\\\#4A5771\\\\]"],
html[data-theme="light"] [class*="text-[#525252]"],
html[data-theme="light"] [class*="text-\\\\[\\\\#525252\\\\]"] { color: #8a8580 !important; }

html[data-theme="light"] [class*="bg-zinc-800"],
html[data-theme="light"] [class*="bg-zinc-900"],
html[data-theme="light"] [class*="bg-zinc-950"] { background-color: #f0ede8 !important; }

html[data-theme="light"] [class*="bg-black"] { background-color: #ffffff !important; }

/* Text white → warm-black (selectively — not in buttons/nav) */
html[data-theme="light"] .text-primary { color: #1c1815 !important; }

html[data-theme="light"] [class*="text-white"]:not(.bg-accent *):not(nav *):not(button *):not(a *):not(.fusion-clay-btn *) { 
  color: #1c1815 !important; 
}

html[data-theme="light"] .text-muted { color: #8a8580 !important; }

/* Accent — teal on warm background (higher contrast for light mode) */
html[data-theme="light"] [class*="bg-accent"],
html[data-theme="light"] [class*="bg-[#71717a]"],
html[data-theme="light"] [class*="bg-\\\\[\\\\#71717a\\\\]"] { background-color: #0d9488 !important; }

html[data-theme="light"] [class*="text-accent"],
html[data-theme="light"] [class*="text-accent-content"],
html[data-theme="light"] [class*="text-[#71717a]"],
html[data-theme="light"] [class*="text-\\\\[\\\\#71717a\\\\]"] { color: #0d9488 !important; }

html[data-theme="light"] [class*="border-accent"],
html[data-theme="light"] [class*="border-[#71717a]"],
html[data-theme="light"] [class*="border-\\\\[\\\\#71717a\\\\]"] { border-color: #0d9488 !important; }

/* Cards */
html[data-theme="light"] .fusion-recessed-card {
  background-color: #faf8f5 !important;
  border-color: #ddd8d0 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03) !important;
}

/* Wallet cards */
html[data-theme="light"] .wallet-balance-card {
  background: linear-gradient(135deg, #faf8f5 0%, #f5f2ec 100%) !important;
  border: 1px solid #ddd8d0 !important;
  border-radius: 22px !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04),
              0 4px 12px rgba(0,0,0,0.03) !important;
}

html[data-theme="light"] .wallet-transaction-card {
  background-color: #faf8f5 !important;
  border: 1px solid #ddd8d0 !important;
  border-radius: 22px !important;
}

html[data-theme="light"] footer { background-color: #f3f0eb !important; }

html[data-theme="light"] nav { 
  background-color: rgba(243,240,235,0.9) !important;
  border-bottom-color: #ddd8d0 !important;
}

html[data-theme="light"] input,
html[data-theme="light"] select,
html[data-theme="light"] textarea {
  background-color: #faf8f5 !important;
  border-color: #ddd8d0 !important;
  color: #1c1815 !important;
}

html[data-theme="light"] [class*="hover:bg-\\\\[\\\\#28303F\\\\]"]:hover,
html[data-theme="light"] [class*="hover:bg-zinc-800"]:hover { background-color: #e8e4de !important; }

html[data-theme="light"] .leaflet-container { background-color: #f0ede8 !important; }
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
