/**
 * Omix Design System Tokens
 * TRUE DARK theme — pure black base, no blue/grey tint.
 * Light mode overrides managed by ThemeContext CSS injection.
 */

// ─── Colors ────────────────────────────────────────────────────────────────
export const colors = {
  primary: '#a3a3a3',
  primaryHover: '#a3a3a3',
  accent: '#a3a3a3',
  danger: '#ef4444',
  surface: '#0a0a0a',
  surfaceAlt: '#141414',
  border: '#1f1f1f',
  textPrimary: '#fafafa',
  textSecondary: '#525252',
  textMuted: '#525252',
  success: '#4ade80',
  priceColor: '#38B8EA',
};

// Light mode overrides (applied via CSS injection by ThemeContext)
export const lightColors = {
  surface: '#ffffff',
  surfaceAlt: '#f5f5f5',
  border: '#e5e5e5',
  textPrimary: '#0a0a0a',
  textSecondary: '#a3a3a3',
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
  primary: 'bg-[#a3a3a3] text-black hover:bg-[#a3a3a3] transition-colors duration-150',
  secondary: 'bg-[#141414] text-white border border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors duration-150',
  ghost: 'bg-transparent text-[#525252] hover:text-white transition-colors duration-150',
  danger: 'bg-red-600 text-white hover:bg-red-700 transition-colors duration-150',
};

// ─── Transitions ───────────────────────────────────────────────────────────
export const transitions = { fast: '150ms ease', normal: '200ms ease' };

// ─── Z-Index Layers ────────────────────────────────────────────────────────
export const zIndex = { base: 0, dropdown: 40, sticky: 50, fixed: 60, modal: 70, popover: 80, tooltip: 90 };
