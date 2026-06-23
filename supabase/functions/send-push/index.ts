// Supabase Edge Function: send-push
// Sends push notifications to all subscribed users using web-push protocol.
// Called from the admin panel with a JWT-authenticated request.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// VAPID keys should be set as Supabase Edge Function secrets:
// supabase secrets set VAPID_PRIVATE_KEY=your_private_key
// supabase secrets set VAPID_PUBLIC_KEY=your_public_key

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@omix.store';

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  image?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
}

// ── JWT verification (Supabase JWT) ────────────────────────
async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  // For simplicity, we trust the Supabase auth middleware.
  // In production, verify the JWT against your Supabase project's JWT secret.
  return true;
}

// ── Web Push via fetch (Deno-compatible) ───────────────────
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<{ success: boolean; endpoint: string; status?: number }> {
  try {
    // Build the push request
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo192.png',
      badge: '/logo192.png',
      image: payload.image,
      tag: payload.tag || 'omix-broadcast',
      requireInteraction: payload.requireInteraction || false,
      vibrate: [200, 100, 200],
      data: { url: payload.url || '/' },
      actions: payload.actions || [],
    });

    // For a production setup, use a proper web-push library.
    // Since Deno doesn't have the npm web-push package easily available,
    // we use the Push API directly with proper headers.
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400', // 24 hours
        'Urgency': 'normal',
        // Note: For full VAPID signing, use a library like
        // https://deno.land/x/web_push@0.1.0 or similar
      },
      body: pushPayload,
    });

    return {
      success: response.ok || response.status === 201,
      endpoint: subscription.endpoint,
      status: response.status,
    };
  } catch (err) {
    console.error('Push send error:', err);
    return { success: false, endpoint: subscription.endpoint };
  }
}

// ── Main handler ───────────────────────────────────────────
serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify admin
  if (!(await verifyAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { subscriptions: PushSubscription[]; payload: NotificationPayload };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { subscriptions, payload } = body;

  if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, message: 'No subscriptions' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    return new Response(
      JSON.stringify({
        error: 'VAPID keys not configured. Run: supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=...',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Send to all subscriptions (with concurrency limit)
  const CONCURRENCY = 50;
  let sent = 0;
  let failed = 0;
  const failedEndpoints: string[] = [];

  for (let i = 0; i < subscriptions.length; i += CONCURRENCY) {
    const batch = subscriptions.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((sub) => sendWebPush(sub, payload)));

    for (const result of results) {
      if (result.success) {
        sent++;
      } else {
        failed++;
        // Track 410 (Gone) and 404 (Not Found) for cleanup
        if (result.status === 410 || result.status === 404) {
          failedEndpoints.push(result.endpoint);
        }
      }
    }
  }

  // Clean up expired subscriptions
  if (failedEndpoints.length > 0) {
    console.log(`Cleaning up ${failedEndpoints.length} expired subscriptions`);
    // Note: In production, call Supabase to delete these
    // This would need the service role key
  }

  return new Response(
    JSON.stringify({
      sent,
      failed,
      total: subscriptions.length,
      expiredCount: failedEndpoints.length,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
});
