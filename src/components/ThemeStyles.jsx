import { useEffect } from 'react';
import { useActiveTheme } from '../context/SeasonalContext';

/**
 * ThemeStyles — applies the active seasonal theme as CSS custom properties
 * on :root and sets body-level background/pattern classes.
 * This lets ANY component use var(--seasonal-*) in CSS/Tailwind.
 */
const CSS_VAR_MAP = {
  primary: '--seasonal-primary',
  secondary: '--seasonal-secondary',
  accent: '--seasonal-accent',
  heroFrom: '--seasonal-hero-from',
  heroVia: '--seasonal-hero-via',
  heroTo: '--seasonal-hero-to',
  heroText: '--seasonal-hero-text',
  heroSubtext: '--seasonal-hero-subtext',
  heroAccent: '--seasonal-hero-accent',
  heroOverlay: '--seasonal-hero-overlay',
  ctaBg: '--seasonal-cta-bg',
  ctaText: '--seasonal-cta-text',
  ctaHover: '--seasonal-cta-hover',
  badgeBg: '--seasonal-badge-bg',
  badgeText: '--seasonal-badge-text',
  navAccent: '--seasonal-nav-accent',
  navAccentText: '--seasonal-nav-accent-text',
  navBgFrom: '--seasonal-nav-bg-from',
  navBgTo: '--seasonal-nav-bg-to',
  surface: '--seasonal-surface',
  surfaceAlt: '--seasonal-surface-alt',
  border: '--seasonal-border',
  muted: '--seasonal-muted',
  textPrimary: '--seasonal-text-primary',
  textSecondary: '--seasonal-text-secondary',
  footerBg: '--seasonal-footer-bg',
  footerText: '--seasonal-footer-text',
  footerLink: '--seasonal-footer-link',
  cardBg: '--seasonal-card-bg',
  cardBorder: '--seasonal-card-border',
  priceColor: '--seasonal-price-color',
  buttonBg: '--seasonal-button-bg',
  buttonText: '--seasonal-button-text',
  shadow: '--seasonal-shadow',
  glow: '--seasonal-glow',
};

export default function ThemeStyles() {
  const theme = useActiveTheme();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const colors = theme?.colors || {};

    // Set all CSS vars from theme colors
    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
      if (colors[key]) {
        root.style.setProperty(cssVar, colors[key]);
      } else {
        root.style.removeProperty(cssVar);
      }
    });

    // Set background pattern
    if (theme?.backgroundPattern) {
      root.style.setProperty('--seasonal-bg-pattern', theme.backgroundPattern);
    } else {
      root.style.removeProperty('--seasonal-bg-pattern');
    }

    // Set sticker
    if (theme?.sticker) {
      root.style.setProperty('--seasonal-sticker', `"${theme.sticker}"`);
    } else {
      root.style.removeProperty('--seasonal-sticker');
    }

    // Apply vibe class to body for CSS targeting
    const vibe = theme?.vibe || 'default';
    body.dataset.themeVibe = vibe;
    body.dataset.themeId = theme?.id || 'none';

    // Cleanup on unmount
    return () => {
      Object.values(CSS_VAR_MAP).forEach(cssVar => {
        root.style.removeProperty(cssVar);
      });
      root.style.removeProperty('--seasonal-bg-pattern');
      root.style.removeProperty('--seasonal-sticker');
      delete body.dataset.themeVibe;
      delete body.dataset.themeId;
    };
  }, [theme]);

  // This component renders nothing — purely side-effect
  return null;
}
