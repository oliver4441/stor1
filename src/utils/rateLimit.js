/**
 * Simple frontend rate limiter to prevent brute-force attacks.
 * Uses localStorage to track attempt counts with time windows.
 */

const RATE_LIMITS = {
  login:    { maxAttempts: 5, windowMs: 60_000 },    // 5 attempts per minute
  signup:   { maxAttempts: 3, windowMs: 120_000 },   // 3 attempts per 2 minutes
  checkout: { maxAttempts: 10, windowMs: 60_000 },   // 10 attempts per minute
  contact:  { maxAttempts: 3, windowMs: 60_000 },    // 3 attempts per minute
  default:  { maxAttempts: 20, windowMs: 60_000 },   // 20 attempts per minute
};

function getStorageKey(action) {
  return `rl_${action}`;
}

function getAttempts(action) {
  try {
    const data = JSON.parse(localStorage.getItem(getStorageKey(action)) || '[]');
    const now = Date.now();
    const limit = RATE_LIMITS[action] || RATE_LIMITS.default;
    // Filter to only recent attempts within the window
    return data.filter(ts => now - ts < limit.windowMs);
  } catch {
    return [];
  }
}

function recordAttempt(action) {
  const attempts = getAttempts(action);
  attempts.push(Date.now());
  try {
    localStorage.setItem(getStorageKey(action), JSON.stringify(attempts));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Check if an action is rate-limited.
 * Returns { allowed: boolean, retryAfter: number (seconds) }
 */
export function checkRateLimit(action) {
  const limit = RATE_LIMITS[action] || RATE_LIMITS.default;
  const attempts = getAttempts(action);

  if (attempts.length >= limit.maxAttempts) {
    const oldestInWindow = attempts[0];
    const retryAfter = Math.ceil((oldestInWindow + limit.windowMs - Date.now()) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Record an action attempt. Call this before making the API request.
 */
export function recordActionAttempt(action) {
  recordAttempt(action);
}

/**
 * Clear rate limit for an action (e.g., after successful login).
 */
export function clearRateLimit(action) {
  try {
    localStorage.removeItem(getStorageKey(action));
  } catch {
    // ignore
  }
}
