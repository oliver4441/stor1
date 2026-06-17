// ── Push Notification Utilities ──────────────────────────────
// Handles service worker registration, push subscription, and
// communication with the Supabase push_subscriptions table.

import { supabase } from './supabase';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Check if the browser supports push notifications and service workers.
 * @returns {boolean}
 */
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request permission from the user to send push notifications.
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported in this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Subscribe the current user to push notifications.
 * Registers a service worker, then subscribes to push and stores
 * the subscription in the push_subscriptions table.
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported.' };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Notification permission denied.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Subscribe the user to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be logged in to subscribe to push notifications.' };
    }

    // Store subscription in Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth_key: arrayBufferToBase64(subscription.getKey('auth')),
      }, {
        onConflict: 'user_id, endpoint',
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to subscribe to push:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unsubscribe the current user from push notifications.
 * Removes the push subscription from the browser and deletes
 * the record from Supabase.
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true }; // Already unsubscribed
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Remove from Supabase
    if (user) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to unsubscribe from push:', err);
    return { success: false, error: err.message };
  }
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Convert a base64-encoded VAPID key to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
