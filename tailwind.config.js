import { colors, fonts, spacing, borderRadius, shadows, typography } from './src/lib/designSystem';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core brand colors from design system
        primary: {
          DEFAULT: colors.primary,
          hover: colors.primaryHover,
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: colors.primary,
          600: colors.primaryHover,
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        accent: {
          DEFAULT: colors.accent,
          hover: '#0066CC',
          50: '#eff6ff',
          100: '#dbeafe',
          500: colors.accent,
          600: '#0066CC',
        },
        danger: colors.danger,
        // Surface & background tokens
        surface: {
          DEFAULT: colors.surface,
          alt: colors.surfaceAlt,
        },
        // Semantic tokens (avoid Tailwind reserved names)
        omix: {
          border: colors.border,
          muted: colors.textMuted,
          success: colors.success,
          price: colors.priceColor,
        },
      },
      fontFamily: {
        sans: fonts.sans.split(', ').map(f => f.replace(/'/g, '')),
        display: fonts.display.split(', ').map(f => f.replace(/'/g, '')),
      },
      fontSize: {
        xs: typography.xs,
        sm: typography.sm,
        base: typography.base,
        lg: typography.lg,
        xl: typography.xl,
        '2xl': typography['2xl'],
        '3xl': typography['3xl'],
        '4xl': typography['4xl'],
      },
      spacing: spacing,
      borderRadius: borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
}
