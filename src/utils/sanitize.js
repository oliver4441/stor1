/**
 * Input sanitization utilities to prevent XSS attacks.
 * Use these before rendering user-generated content or storing it.
 */

/**
 * Escape HTML entities to prevent XSS when rendering user input.
 * Use this for any user-generated content displayed in JSX.
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return str;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize a string for safe display.
 * Strips all HTML tags and escapes entities.
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  // Remove any HTML tags
  const stripped = str.replace(/<[^>]*>/g, '');
  // Escape entities
  return escapeHtml(stripped);
}

/**
 * Validate and sanitize an email address.
 * Returns sanitized email or null if invalid.
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Validate and sanitize a phone number (Kenyan format).
 * Returns sanitized phone or null if invalid.
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.trim().replace(/[^0-9]/g, '');
  if (!/^(?:254|0)?7[0-9]{8}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Sanitize a name — allow only letters, spaces, hyphens, apostrophes.
 */
export function sanitizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/[^\p{L}\p{M}\s'-]/gu, '').slice(0, 100);
}

/**
 * Sanitize a URL — only allow http/https protocols.
 * Returns sanitized URL or null if invalid/dangerous.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}
