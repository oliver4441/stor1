import { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';

const REMINDER_DELAY = 30 * 60 * 1000; // 30 minutes
const REMINDER_KEY = 'omix_cart_reminder_sent';

/**
 * Shows a browser push notification when items are in cart
 * and user hasn't checked out after 30 minutes.
 */
export default function CartReminder() {
  const { getItemCount, getTotal } = useCart();
  const timerRef = useRef(null);

  useEffect(() => {
    const itemCount = getItemCount();
    if (itemCount === 0) {
      // Cart empty — reset reminder
      try { localStorage.removeItem(REMINDER_KEY); } catch {}
      return;
    }

    // Check if already reminded
    try {
      const reminded = localStorage.getItem(REMINDER_KEY);
      if (reminded) return;
    } catch {}

    // Set timer to show reminder
    timerRef.current = setTimeout(() => {
      const total = getTotal();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('🛒 Complete Your Order', {
            body: `You have ${itemCount} item${itemCount > 1 ? 's' : ''} in your cart (KES ${total.toLocaleString()}). Don't miss out!`,
            icon: '/logo.jpg',
            badge: '/logo.jpg',
            tag: 'cart-reminder',
            requireInteraction: true,
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = '/cart';
          };
        } catch {}
      }

      try { localStorage.setItem(REMINDER_KEY, Date.now().toString()); } catch {}
    }, REMINDER_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [getItemCount, getTotal]);

  return null;
}
