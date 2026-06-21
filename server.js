// Simple server to serve the Vite-built Omix frontend
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));
const port = process.env.PORT || 3000;

// ── VAPID Keys for Push Notifications ──────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:omixsystems@gmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('Push notifications: ENABLED');
} else {
  console.log('Push notifications: DISABLED (missing VAPID keys in env)');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stor1-frontend', timestamp: new Date().toISOString() });
});

// ── Push Notification Endpoint ──────────────────────────────────────
// Frontend calls this to send a push notification to all subscribers
app.post('/api/push/broadcast', async (req, res) => {
  const { title, body, url, tag, image } = req.body;
  const apiKey = req.headers['x-api-key'];

  // Simple API key check to prevent abuse
  if (apiKey !== process.env.VITE_OPENCODE_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Fetch all subscriptions from Supabase
    // Note: We use fetch directly to avoid importing supabase-js in Node ESM
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xmdyovfcjogkarwxiyhb.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    const subResponse = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!subResponse.ok) {
      console.error('[Push] Failed to fetch subscriptions:', await subResponse.text());
      return res.status(502).json({ error: 'Failed to fetch subscriptions' });
    }

    const subscriptions = await subResponse.json();
    
    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ sent: 0, total: 0 });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/',
      tag: tag || 'omix-notification',
      image: image || null,
      renotify: true,
      requireInteraction: true,
    });

    let sent = 0;
    let failed = 0;

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        }, payload);
        sent++;
      } catch (err) {
        failed++;
        // If subscription is expired/invalid, delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
              method: 'DELETE',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            });
          } catch {}
        }
      }
    });

    await Promise.allSettled(sendPromises);
    
    console.log(`[Push] Sent: ${sent}, Failed: ${failed}, Total: ${subscriptions.length}`);
    res.json({ sent, failed, total: subscriptions.length });
  } catch (err) {
    console.error('[Push] Broadcast error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Nia AI Chat Proxy ──────────────────────────────────────────────
// Proxies OpenCode Zen API calls so the API key stays server-side

app.post('/api/nia/chat', async (req, res) => {
  const apiKey = process.env.VITE_OPENCODE_API_KEY;
  
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  const { messages, model = 'mimo-v2.5-free' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are Nia, the Omix Store assistant. You help customers with:
- Browsing products on the marketplace
- Tracking orders
- Payment questions (M-Pesa via Paystack STK Push)
- Delivery information (Kericho, Kenya)
- General app guidance

Be concise, friendly, and helpful. Use short bullet points. Never make up product info or prices. If you don't know something, say so honestly and offer to connect to human support (omixsystems@gmail.com or +254 768 213 649).

Keep responses under 80 words. Answer directly without any reasoning or thinking process. Just give the answer.`,
          },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Nia Proxy] OpenCode API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content?.trim() || null;

    if (!content) {
      console.error('[Nia Proxy] Empty response from OpenCode');
      return res.status(502).json({ error: 'AI returned empty response' });
    }

    res.json({ content });
  } catch (err) {
    console.error('[Nia Proxy] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  index: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// SPA fallback — serve index.html for all non-API, non-file routes
// NEVER cache HTML so Cloudflare always gets fresh index.html with correct bundle hash
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('CDN-Cache-Control', 'no-cache');
  res.set('Cloudflare-CDN-Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Nia AI proxy: ${process.env.VITE_OPENCODE_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Push notifications: ${VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY ? 'ENABLED' : 'DISABLED'}`);
});
