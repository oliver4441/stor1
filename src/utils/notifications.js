// ── Omix Notification Service ─────────────────────────────
// Unified notification system: sounds + native browser notifications
// + in-app history + Android vibration
//
// In-app notifications are stored in localStorage (persists across
// sessions). For full multi-device sync, a Supabase table is used
// when the user is logged in.

import { sounds } from './sounds';
import { supabase } from './supabase';

// ── In-app notification store (localStorage + Supabase) ───

const LOCAL_STORE_KEY = 'omix_notifications';
const MAX_LOCAL_NOTIFS = 50;

/**
 * Get all in-app notifications from localStorage.
 */
function getLocalNotifs() {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save in-app notifications to localStorage.
 */
function setLocalNotifs(notifs) {
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(notifs.slice(0, MAX_LOCAL_NOTIFS)));
  } catch {
    /* storage full — silently drop */
  }
}

/**
 * Add a notification to the in-app history.
 */
export function storeNotification({ type, title, body, icon, url, tag }) {
  const notif = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: type || 'default',
    title,
    body,
    icon: icon || '/icon-192.png',
    url: url || null,
    tag: tag || null,
    read: false,
    created_at: new Date().toISOString(),
  };

  // Store locally
  const local = getLocalNotifs();
  local.unshift(notif);
  setLocalNotifs(local);

  // Try Supabase if logged in (fire-and-forget)
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          icon: notif.icon,
          url: notif.url,
          tag: notif.tag,
        })
        .then(() => {})
        .catch(() => {});
    }
  }).catch(() => {});

  return notif;
}

/**
 * Get all in-app notifications.
 * Returns local notifications merged with Supabase ones (user-scoped).
 */
export async function getNotifications() {
  const local = getLocalNotifs();

  // Try to get Supabase notifications
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbNotifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_LOCAL_NOTIFS);

      if (!error && dbNotifs?.length) {
        // Merge: Supabase is source of truth for DB records, local for offline
        const existingIds = new Set(dbNotifs.map(n => n.id));
        const uncached = local.filter(n => !existingIds.has(n.id));
        return [...uncached, ...dbNotifs].slice(0, MAX_LOCAL_NOTIFS);
      }
    }
  } catch {
    /* offline — use local only */
  }

  return local;
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(id) {
  // Local
  const local = getLocalNotifs();
  const idx = local.findIndex(n => n.id === id);
  if (idx !== -1) {
    local[idx].read = true;
    setLocalNotifs(local);
  }

  // Supabase
  try {
    await supabase
      .from('in_app_notifications')
      .update({ read: true })
      .eq('id', id);
  } catch {
    /* ignore */
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead() {
  const local = getLocalNotifs();
  local.forEach(n => { n.read = true; });
  setLocalNotifs(local);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Clear all notifications.
 */
export async function clearNotifications() {
  try {
    localStorage.removeItem(LOCAL_STORE_KEY);
  } catch { /* ignore */ }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Get unread count from local storage (fast, no async).
 */
export function getUnreadCount() {
  const local = getLocalNotifs();
  return local.filter(n => !n.read).length;
}

// ── Android vibration patterns per type ─────────────────────

const VIBRATE_PATTERNS = {
  ORDER_CONFIRMED: [100, 50, 100],
  ORDER_SHIPPED: [100, 50, 150, 50, 100],
  ORDER_DELIVERED: [200, 100, 200],
  CART_REMINDER: [80, 50, 80, 50, 80],
  WISHLIST_REMINDER: [80, 80],
  PRICE_DROP: [100, 50, 100, 50, 100],
  BACK_IN_STOCK: [150, 50, 100],
  NIA_NUDGE: [60, 30, 60],
  UPDATE_AVAILABLE: [50, 30, 50],
  REFUND_PROCESSED: [100, 50, 100, 50, 200],
  DELIVERY_ALERT: [200, 100, 300],
  RATING_REMINDER: [60, 40, 80],
  ACHIEVEMENT: [100, 50, 100, 50, 150, 50, 200],
  REFERRAL_SIGNUP: [80, 40, 80, 40, 80],
  REFERRAL_CONVERTED: [100, 80, 100, 80, 200],
  PROMOTION: [80, 40, 80],
};

function triggerVibrate(pattern) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* no-op */ }
  }
}

// ── Sound name mapping per type ────────────────────────────

const SOUND_NAMES = {
  ORDER_CONFIRMED: 'checkout',
  ORDER_SHIPPED: 'orderUpdate',
  ORDER_DELIVERED: 'delivery',
  CART_REMINDER: 'notification',
  WISHLIST_REMINDER: 'wishlist',
  PRICE_DROP: 'notification',
  BACK_IN_STOCK: 'notification',
  NIA_NUDGE: 'chat',
  UPDATE_AVAILABLE: 'notification',
  REFUND_PROCESSED: 'refund',
  DELIVERY_ALERT: 'delivery',
  RATING_REMINDER: 'rating',
  ACHIEVEMENT: 'achievement',
  REFERRAL_SIGNUP: 'notification',
  REFERRAL_CONVERTED: 'achievement',
  PROMOTION: 'coupon',
};

// ── Send notification (sound + native + store) ─────────────

export function sendNotification({ title, body, icon, tag, url, sound = 'notification', type, store = false }) {
  // Play sound
  if (sounds[sound]) {
    sounds[sound]();
  }

  // Vibrate based on type
  if (type && VIBRATE_PATTERNS[type]) {
    triggerVibrate(VIBRATE_PATTERNS[type]);
  }

  // Try native notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: icon || '/icon-192.png',
        tag: tag || 'default',
        vibrate: VIBRATE_PATTERNS[type] || [200, 100, 200],
        data: { url, type },
        requireInteraction: true,
      });

      if (url) {
        notif.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      }
    } catch (e) {
      console.warn('[Notif] Native notif failed:', e.message);
    }
  }

  // Store in-app
  if (store) {
    storeNotification({ type, title, body, icon, url, tag });
  }
}

// ── Notification type presets ───────────────────────────────

export const NotifType = {
  ORDER_CONFIRMED: {
    title: 'Order Confirmed',
    body: 'Your order has been placed successfully!',
    tag: 'order',
    sound: 'checkout',
  },
  ORDER_SHIPPED: {
    title: 'Order Shipped',
    body: 'Your order is on its way! Track it now.',
    tag: 'order',
    sound: 'orderUpdate',
  },
  ORDER_DELIVERED: {
    title: 'Order Delivered',
    body: 'Your package has arrived. Enjoy!',
    tag: 'order',
    sound: 'delivery',
  },
  CART_REMINDER: {
    title: 'Complete Your Order',
    body: "You still have items in your cart. Don't miss out!",
    tag: 'cart',
    sound: 'notification',
  },
  WISHLIST_REMINDER: {
    title: 'Items Still Waiting',
    body: 'Your saved items are still available. Prices may change!',
    tag: 'wishlist',
    sound: 'wishlist',
  },
  PRICE_DROP: {
    title: 'Price Dropped',
    body: 'An item in your wishlist just got cheaper!',
    tag: 'price',
    sound: 'notification',
  },
  BACK_IN_STOCK: {
    title: 'Back in Stock!',
    body: 'An item you wanted is available again.',
    tag: 'stock',
    sound: 'notification',
  },
  NIA_NUDGE: {
    title: 'Nia Has a Tip',
    body: 'Need help finding something? Ask Nia!',
    tag: 'nia',
    sound: 'chat',
  },
  UPDATE_AVAILABLE: {
    title: 'Update Available',
    body: 'A new version of Omix Store is ready.',
    tag: 'update',
    sound: 'notification',
  },
  REFUND_PROCESSED: {
    title: 'Refund Processed',
    body: 'Your refund has been processed successfully.',
    tag: 'order',
    sound: 'refund',
  },
  DELIVERY_ALERT: {
    title: 'Delivery Update',
    body: 'Your delivery is approaching. Get ready!',
    tag: 'delivery',
    sound: 'delivery',
  },
  RATING_REMINDER: {
    title: 'Rate Your Purchase',
    body: 'How was your recent order? Share your feedback!',
    tag: 'rating',
    sound: 'rating',
  },
  ACHIEVEMENT: {
    title: 'Achievement Unlocked',
    body: 'You reached a new milestone on Omix Store!',
    tag: 'achievement',
    sound: 'achievement',
  },
  REFERRAL_SIGNUP: {
    title: 'New Referral Signup',
    body: 'Someone signed up using your referral link!',
    tag: 'referral',
    sound: 'notification',
  },
  REFERRAL_CONVERTED: {
    title: 'Commission Earned!',
    body: 'A referral placed an order and you earned a commission!',
    tag: 'commission',
    sound: 'achievement',
  },
  PROMOTION: {
    title: 'Special Offer',
    body: 'Check out the latest deals and discounts just for you!',
    tag: 'promo',
    sound: 'coupon',
  },
};

/**
 * Send a typed notification with optional overrides.
 * Also stores in-app history and triggers Android vibration.
 */
export function sendTypedNotification(type, overrides = {}) {
  const defaults = NotifType[type];
  if (!defaults) {
    console.warn('[Notif] Unknown type:', type);
    return;
  }
  sendNotification({
    ...defaults,
    type, // pass type for vibration lookup
    ...overrides,
    store: true, // always store typed notifications in-app
  });
}
