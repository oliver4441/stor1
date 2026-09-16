import copy from './maintenance.json';

/**
 * Omix Market — Maintenance / Transition Mode configuration.
 *
 * Single flag to gate the public storefront:
 *
 *   VITE_MAINTENANCE_MODE=true   (Vite frontend — Vercel, local dev)
 *   MAINTENANCE_MODE=true        (Express server — server.js on Render)
 *
 * Set BOTH to the same value in production so the server-level gate
 * (proper 503 + static fallback page) and the client-side gate (React)
 * stay in sync. See docs/MAINTENANCE_MODE.md.
 *
 * NOTE: this is separate from the legacy Supabase `app_settings`
 * `maintenance_mode` flag, which only disables purchases ("browse but
 * can't buy") and is managed from Admin → Settings → Site Status.
 * That behaviour is intentionally left untouched.
 */

export const maintenanceCopy = copy;

/** Frontend flag (Vite exposes only VITE_* vars to the browser). */
export function isMaintenanceModeEnabled() {
  try {
    return (
      import.meta?.env?.VITE_MAINTENANCE_MODE === 'true' ||
      import.meta?.env?.MAINTENANCE_MODE === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Paths that stay reachable while maintenance mode is on.
 * Everything else renders the maintenance experience instead.
 *
 * Kept: admin dashboard, staff login, auth callbacks, health/API
 * (APIs are never gated — see server.js), and the PWA install helper
 * assets served as static files.
 */
const ALWAYS_ALLOWED_PREFIXES = ['/admin', '/login', '/auth/', '/api/', '/health'];

const ALWAYS_ALLOWED_EXACT = new Set([
  '/health',
  '/login',
  '/auth/callback',
  '/maintenance',
]);

export function isMaintenanceBypassPath(pathname) {
  if (!pathname) return false;
  if (ALWAYS_ALLOWED_EXACT.has(pathname)) return true;
  return ALWAYS_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/** True when `pathname` should show the maintenance page (flag on + public path). */
export function shouldShowMaintenance(pathname) {
  return isMaintenanceModeEnabled() && !isMaintenanceBypassPath(pathname);
}

export const FEEDBACK_URL = copy.feedback.ctaUrl;
export const PREVIEW_URL = copy.preview.url || null;
