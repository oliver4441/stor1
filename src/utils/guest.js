/**
 * Guest Checkout Utility
 * Manages a persistent guest identifier for users who checkout without logging in.
 */

const GUEST_ID_KEY = 'omix_guest_id';

/**
 * Generates a UUID v4 using browser's crypto API
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the existing guest_id from localStorage, or creates a new one and stores it.
 * @returns {string} The guest identifier
 */
export function generateGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Returns true if the current user is a guest (no auth session but has a guest_id).
 * @returns {boolean}
 */
export function isGuest() {
  return !!(localStorage.getItem(GUEST_ID_KEY));
}
