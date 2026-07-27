/**
 * Omix Design System Tokens
 * Dark theme with vibrant accent colors — pure dark backgrounds,
 * teal/emerald accent for life, warm amber for energy.
 */

// ─── Colors ────────────────────────────────────────────────────────────────
export const colors = {
  // Primary accent — vibrant teal (pops beautifully on dark backgrounds)
  primary: '#14b8a6',
  primaryHover: '#0d9488',
  accent: '#14b8a6',

  // Semantic
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  priceColor: '#2dd4bf',

  // Dark surfaces — pure black base, no blue/grey tint
  surface: '#0a0a0a',
  surfaceAlt: '#121212',
  border: '#1f1f1f',

  // Text
  textPrimary: '#fafafa',
  textSecondary: '#737373',
  textMuted: '#525252',
};

// Light mode overrides (applied via CSS injection by ThemeContext)
export const lightColors = {
  surface: '#ffffff',
  surfaceAlt: '#f5f5f5',
  border: '#e5e5e5',
  textPrimary: '#0a0a0a',
  textSecondary: '#737373',
  textMuted: '#a3a3a3',
};

// ─── Typography ────────────────────────────────────────────────────────────
export const typography = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
};

// ─── Font Families ─────────────────────────────────────────────────────────
export const fonts = {
  sans: "'Poppins', system-ui, -apple-system, sans-serif",
  display: "'Poppins', system-ui, sans-serif",
};

// ─── Spacing Scale ─────────────────────────────────────────────────────────
export const spacing = {
  1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem',
  6: '1.5rem', 7: '1.75rem', 8: '2rem', 9: '2.25rem', 10: '2.5rem',
  11: '2.75rem', 12: '3rem',
};

// ─── Border Radius ─────────────────────────────────────────────────────────
export const borderRadius = {
  sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', full: '9999px',
};

// ─── Shadow Presets ────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,.3)',
  md: '0 4px 6px rgba(0,0,0,.4)',
  lg: '0 10px 15px rgba(0,0,0,.5)',
  xl: '0 20px 25px rgba(0,0,0,.6)',
};

// ─── Button Variants ───────────────────────────────────────────────────────
export const buttonVariants = {
  primary: 'bg-[#14b8a6] text-black hover:bg-[#0d9488] transition-colors duration-150 font-bold',
  secondary: 'bg-[#121212] text-white border border-[#1f1f1f] hover:border-[#14b8a6]/30 hover:bg-[#181818] transition-colors duration-150',
  ghost: 'bg-transparent text-[#525252] hover:text-[#14b8a6] transition-colors duration-150',
  danger: 'bg-red-600 text-white hover:bg-red-700 transition-colors duration-150',
};

// ─── Transitions ───────────────────────────────────────────────────────────
export const transitions = { fast: '150ms ease', normal: '200ms ease' };

// ─── Z-Index Layers ────────────────────────────────────────────────────────
export const zIndex = { base: 0, dropdown: 40, sticky: 50, fixed: 60, modal: 70, popover: 80, tooltip: 90 };
