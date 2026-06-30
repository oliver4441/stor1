// ── Omix Notification Service ─────────────────────────────
// Unified notification system: sounds + native browser notifications
// When push is subscribed, triggers real browser notifications

import { sounds } from './sounds';

/**
 * Send a notification to the user
 * Always plays the associated sound.
 * Shows native browser notification if permission granted.
 */
export function sendNotification({ title, body, icon, tag, url, sound = 'notification' }) {
  // Play sound
  if (sounds[sound]) {
    sounds[sound]();
  }

  // Try native notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: icon || '/icon-192.png',
        tag: tag || 'default',
        vibrate: [200, 100, 200],
        data: { url },
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
}

/**
 * Notification type presets
 */
export const NotifType = {
  ORDER_CONFIRMED: {
    title: 'Order Confirmed ✓',
    body: 'Your order has been placed successfully!',
    tag: 'order',
    sound: 'checkout',
  },
  ORDER_SHIPPED: {
    title: 'Order Shipped 🚚',
    body: 'Your order is on its way! Track it now.',
    tag: 'order',
    sound: 'orderUpdate',
  },
  ORDER_DELIVERED: {
    title: 'Order Delivered ✓',
    body: 'Your package has arrived. Enjoy!',
    tag: 'order',
    sound: 'checkout',
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
    title: 'Price Dropped! 🎉',
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
    title: 'Nia Has a Tip 💡',
    body: 'Need help finding something? Ask Nia!',
    tag: 'nia',
    sound: 'notification',
  },
  UPDATE_AVAILABLE: {
    title: 'Update Available ✨',
    body: 'A new version of Omix Store is ready.',
    tag: 'update',
    sound: 'notification',
  },
};

/**
 * Send a typed notification with optional overrides
 */
export function sendTypedNotification(type, overrides = {}) {
  const defaults = NotifType[type];
  if (!defaults) {
    console.warn('[Notif] Unknown type:', type);
    return;
  }
  sendNotification({ ...defaults, ...overrides });
}
