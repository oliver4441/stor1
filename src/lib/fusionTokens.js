/**
 * Omix Fusion UI — design tokens
 * One consistent identity: every screen blends Glassmorphism (45%),
 * Skeuomorphism (30%), Claymorphism (20%), Chrome (5%) in fixed proportions.
 * Backgrounds stay monochrome charcoal; vibrant color is reserved for
 * text, prices, badges, and interactive states (per brief).
 *
 * These are consumed by fusion.css (CSS vars) and the Fusion* primitives.
 * We EXTEND designSystem.js, never replace it.
 */

// Deep charcoal monochrome background scale (backgrounds only — no hue)
export const charcoal = {
  950: '#08080a', // app base
  900: '#0d0d10', // raised surface
  850: '#121216', // card recess
  800: '#18181b', // card face
  750: '#1f1f24', // hover
  700: '#27272a', // border / divider
  600: '#3f3f46', // disabled
};

// Vibrant accents — used ONLY for text/price/badge/interactive (brief rule)
export const vibe = {
  primary: '#4ade80',   // price / success / primary action text
  accent: '#d4a017',    // gold — premium chrome companion
  info: '#71717a',      // links / active
  danger: '#f87171',    // errors / remove
  warn: '#fbbf24',
};

// Glassmorphism (45%) — frosted panel recipe
export const glass = {
  bg: 'rgba(24,24,27,0.55)',
  bgStrong: 'rgba(24,24,27,0.72)',
  border: 'rgba(255,255,255,0.10)',
  blur: '18px',
  // subtle top reflection (the "glass edge")
  reflect: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)',
};

// Claymorphism (20%) — soft puffy buttons/cards
export const clay = {
  bg: '#1c1c20',
  shadowOut: '8px 8px 16px rgba(0,0,0,0.55), -6px -6px 14px rgba(255,255,255,0.04)',
  shadowIn: 'inset 6px 6px 12px rgba(0,0,0,0.5), inset -4px -4px 10px rgba(255,255,255,0.05)',
  radius: '24px',
};

// Skeuomorphism (30%) — realistic recessed product cards
export const recessed = {
  bg: '#0f0f12',
  inner: 'inset 0 2px 6px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.04)',
  depth: '0 1px 0 rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.5)',
  radius: '22px',
};

// Chrome (5%) — metallic highlight, PREMIUM ACTIONS + BADGES ONLY
export const chrome = {
  // linear-gradient simulating brushed metal; gold-leaning to pair with vibe.accent
  gradient: 'linear-gradient(135deg, #f5f5f5 0%, #b8b8b8 25%, #fafafa 50%, #8a8a8a 75%, #e8e8e8 100%)',
  border: 'linear-gradient(135deg, #ffffff 0%, #9a9a9a 50%, #dcdcdc 100%)',
  text: '#1a1a1a', // dark text on chrome for contrast
  radius: '9999px',
  glow: '0 0 12px rgba(212,160,23,0.35)',
};

// Radii used app-wide (brief: 20–28px)
export const radii = {
  card: '22px',
  panel: '24px',
  button: '20px',
  pill: '9999px',
};

// Touch target floor (Samsung One UI ergonomics — one-handed)
export const touch = {
  min: '48px',
  comfortable: '56px',
};

// Motion — 60fps via transform/opacity only; respects reduced-motion (index.css)
export const motion = {
  spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
  tap: 'scale(0.96)',
  dur: '220ms',
};

export const fusion = { charcoal, vibe, glass, clay, recessed, chrome, radii, touch, motion };
export default fusion;
