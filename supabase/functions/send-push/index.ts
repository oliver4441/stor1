// Supabase Edge Function: send-push
// Sends push notifications to subscribed users.
// Called from the admin panel with a Supabase JWT.

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Supabase middleware already verified the JWT (verify_jwt: true)
  // So any request that reaches here is authenticated

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { subscriptions, payload } = body;

  if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, message: 'No subscriptions' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    return new Response(
      JSON.stringify({
        error: 'VAPID keys not configured.',
        hasPrivate: !!VAPID_PRIVATE_KEY,
        hasPublic: !!VAPID_PUBLIC_KEY,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  // Send push to each subscription
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const pushPayload = JSON.stringify({
        title: payload?.title || 'Omix Store',
        body: payload?.body || '',
        icon: payload?.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: payload?.tag || 'omix-broadcast',
        data: { url: payload?.url || '/' },
      });

      const response = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'TTL': '86400',
        },
        body: pushPayload,
      });

      if (response.ok || response.status === 201) {
        sent++;
      } else if (response.status === 410 || response.status === 404) {
        failed++;
        // TODO: cleanup expired subscription
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ sent, failed, total: subscriptions.length }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    },
  );
});
