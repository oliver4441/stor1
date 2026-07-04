// ── Admin Push Notification Sender ──────────────────────────
// Sends push notifications to all subscribed users via Supabase Edge Function.
// Falls back to direct web-push if Edge Function is not configured.

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';
const EDGE_FUNCTION_URL = import.meta.env.VITE_PUSH_FUNCTION_URL || (API_BASE_URL + '/api/push/send');
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY || '';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_CLAIMS = { sub: 'mailto:admin@omix.store' };

/**
 * Fetch all push subscriptions from Supabase.
 * @returns {Promise<Array<{ endpoint, p256dh_key, auth_key }>>}
 */
export async function fetchAllSubscriptions() {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key');

  if (error) {
    console.error('Failed to fetch push subscriptions:', error);
    return [];
  }
  return data || [];
}

/**
 * Send a push notification to all subscribed users.
 * Uses Supabase Edge Function if configured, otherwise logs instructions.
 *
 * @param {Object} payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} [payload.url] - URL to open on click (default: '/')
 * @param {string} [payload.tag] - Notification tag for grouping
 * @param {string} [payload.icon] - Icon URL
 * @param {string} [payload.image] - Hero image URL
 * @param {Array}  [payload.actions] - Action buttons [{action, title, icon}]
 * @param {boolean} [payload.requireInteraction] - Keep until user interacts
 * @returns {Promise<{success: boolean, sent: number, failed: number, error?: string}>}
 */
export async function sendPushToAll(payload) {
  const subscriptions = await fetchAllSubscriptions();

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0, error: 'No subscribers found.' };
  }

  // If Edge Function is configured, use it (recommended — keeps VAPID key server-side)
  if (EDGE_FUNCTION_URL) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'x-api-key': import.meta.env.VITE_OMIX_API_KEY || '',
        },
        body: JSON.stringify({
          subscriptions,
          payload: {
            title: payload.title || 'Omix Store',
            body: payload.body || '',
            url: payload.url || '/',
            tag: payload.tag || 'omix-broadcast',
            icon: payload.icon || '/logo192.png',
            image: payload.image || undefined,
            actions: payload.actions || [],
            requireInteraction: payload.requireInteraction || false,
          },
        }),
      });

      const result = await response.json();
      return {
        success: true,
        sent: result.sent || 0,
        failed: result.failed || 0,
      };
    } catch (err) {
      console.error('Edge Function push failed:', err);
      return { success: false, sent: 0, failed: subscriptions.length, error: err.message };
    }
  }

  // No Edge Function — return instructions
  return {
    success: false,
    sent: 0,
    failed: subscriptions.length,
    error: 'VITE_PUSH_FUNCTION_URL not configured. Set up a Supabase Edge Function to send push notifications.',
  };
}

/**
 * Delete a subscription (e.g., after it fails to deliver).
 * @param {string} endpoint
 */
export async function deleteSubscription(endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Failed to delete subscription:', error);
  }
}

/**
 * Get subscriber count.
 * @returns {Promise<number>}
 */
export async function getSubscriberCount() {
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Failed to count subscribers:', error);
    return 0;
  }
  return count || 0;
}
