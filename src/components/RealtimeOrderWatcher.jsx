// ── Realtime Order Watcher ───────────────────────────────────
// Listens for order status changes via Supabase Realtime
// and fires in-app notifications when an order is shipped/delivered/cancelled.

import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { sendTypedNotification, storeNotification } from '../utils/notifications';
import { sounds } from '../utils/sounds';

const STATUS_NOTIF_MAP = {
  processing: {
    type: 'ORDER_CONFIRMED',
    title: 'Order is Being Processed',
    body: 'Your order is now being prepared for dispatch.',
    sound: 'checkout',
  },
  shipped: {
    type: 'ORDER_SHIPPED',
    title: 'Order Shipped!',
    body: 'Your order has been shipped and is on its way!',
    sound: 'orderUpdate',
  },
  delivered: {
    type: 'ORDER_DELIVERED',
    title: 'Order Delivered',
    body: 'Your package has arrived. We hope you love it!',
    sound: 'delivery',
  },
  cancelled: {
    type: 'cancel', // No NotifType for cancel, use generic
    title: 'Order Cancelled',
    body: 'Your order has been cancelled. If you did not request this, please contact support.',
    sound: 'cancel',
  },
};

export default function RealtimeOrderWatcher() {
  useEffect(() => {
    let subscription = null;
    let userId = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      // Subscribe to order changes for this user
      subscription = supabase
        .channel('user-orders')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'omix_orders',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newStatus = payload.new?.status;
            const oldStatus = payload.old?.status;
            const orderId = payload.new?.id;

            if (!newStatus || newStatus === oldStatus) return;

            const config = STATUS_NOTIF_MAP[newStatus];
            if (!config) return;

            // Play sound
            if (sounds[config.sound]) sounds[config.sound]();

            // Send typed notification for happy-path types
            if (config.type !== 'cancel') {
              sendTypedNotification(config.type, {
                title: config.title,
                body: `${config.body} Order #${String(orderId).slice(0, 8).toUpperCase()}`,
                tag: `order_${orderId}`,
              });
            } else {
              // Cancellation — store notification directly
              storeNotification({
                type: 'ORDER_CANCELLED',
                title: config.title,
                body: `${config.body} Order #${String(orderId).slice(0, 8).toUpperCase()}`,
                tag: `order_${orderId}`,
              });
            }
          }
        )
        .subscribe();
    }).catch(() => {});

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  return null; // This component does not render anything
}
