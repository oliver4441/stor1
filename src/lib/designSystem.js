/**
 * Omix Design System Tokens
 * Dark-mode design constants for the Omix PWA.
 * Dark navy/blue theme — inspired by Figma bike app design.
 */

// ─── Colors ────────────────────────────────────────────────────────────────
export const colors = {
  primary: '#007AFF',
  primaryHover: '#0066CC',
  accent: '#007AFF',
  danger: '#dc2626',
  surface: '#242C3B',
  surfaceAlt: '#28303F',
  border: '#353F54',
  textPrimary: '#FAFAFA',
  textSecondary: '#4A5771',
  textMuted: '#4A5771',
  success: '#4ade80',
  priceColor: '#38B8EA',
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
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
};

// ─── Border Radius ─────────────────────────────────────────────────────────
export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
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
  primary: 'bg-[#007AFF] text-white hover:bg-[#0066CC] transition-colors duration-150',
  secondary: 'bg-[#28303F] text-white border border-[#353F54] hover:bg-[#323B4F] transition-colors duration-150',
  ghost: 'bg-transparent text-[#4A5771] hover:text-white transition-colors duration-150',
  danger: 'bg-red-600 text-white hover:bg-red-700 transition-colors duration-150',
};

// ─── Transitions ───────────────────────────────────────────────────────────
export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
};

// ─── Z-Index Layers ────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 40,
  sticky: 50,
  fixed: 60,
  modal: 70,
  popover: 80,
  tooltip: 90,
};