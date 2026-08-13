// Simple server to serve the Vite-built Omix frontend
import express from 'express';
import crypto from 'crypto';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet({
  contentSecurityPolicy: false, // Allow Paystack inline scripts
  crossOriginEmbedderPolicy: false, // Allow third-party resources
}));
app.use(express.json({ limit: '1mb' }));
const port = process.env.PORT || 3000;

// ── Smart startup: ensure dist/index.html exists ─────────────────────
const distIndex = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(distIndex)) {
  console.warn('[WARN] dist/index.html not found — attempting to build...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('[OK] Build completed successfully');
  } catch (buildErr) {
    console.error('[FATAL] Build failed:', buildErr.message);
  }
}
// Used by SPA fallback to redirect if build still missing
const distMissing = () => !fs.existsSync(distIndex);

// ── Paystack Configuration ──────────────────────────────────────────
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.VITE_PAYSTACK_PUBLIC_KEY || '';

// ── Supabase Admin Key (for server-side order updates, bypasses RLS) ──
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

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

// ── Paystack Payment Endpoints ────────────────────────────────────────

// Initialize a Paystack transaction
app.post('/api/paystack/initialize', async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ status: false, message: 'Payment service not configured' });
  }

  const { email, amount, reference, callback_url, metadata } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ status: false, message: 'Email and amount are required' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        reference,
        callback_url,
        metadata,
        currency: 'KES',
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Paystack] Initialize error:', err.message);
    res.status(502).json({ status: false, message: 'Payment service error' });
  }
});

// Verify a Paystack transaction
app.get('/api/paystack/verify/:reference', async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ status: false, message: 'Payment service not configured' });
  }

  const { reference } = req.params;

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    // If payment successful, update the order in Supabase (using service_role key to bypass RLS)
    if (data.status && data.data?.status === 'success') {
      const supabaseUrl = SUPABASE_URL;
      const orderId = data.data?.metadata?.order_id;

      if (orderId && supabaseUrl && SUPABASE_SERVICE_KEY) {
        try {
          // Fetch order total and user_id
          const orderResp = await fetch(`${supabaseUrl}/rest/v1/omix_orders?id=eq.${orderId}&select=id,status,total_amount,user_id`, {
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
          });
          const orders = await orderResp.json();
          const orderData = orders?.[0];
          const alreadyPaid = orderData?.status === 'paid';

          await fetch(`${supabaseUrl}/rest/v1/omix_orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              status: 'paid',
              paystack_reference: reference,
              paid_at: new Date().toISOString(),
            }),
          });
          console.log(`[Paystack] Order ${orderId} marked as paid`);

          // Award loyalty points only on first payment (not on repeated verify calls)
          if (!alreadyPaid && orderData?.user_id && orderData?.total_amount) {
            const pointsEarned = Math.floor(orderData.total_amount / 100);
            if (pointsEarned > 0) {
              await fetch(`${supabaseUrl}/rest/v1/points_transactions`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  user_id: orderData.user_id,
                  points: pointsEarned,
                  description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
                  reference_type: 'order',
                  reference_id: orderId,
                }),
              });
              // Update profile loyalty_points
              const profileResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${orderData.user_id}&select=loyalty_points`, {
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
              });
              const profiles = await profileResp.json();
              if (profiles?.[0]) {
                await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${orderData.user_id}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify({
                    loyalty_points: (profiles[0].loyalty_points || 0) + pointsEarned,
                  }),
                });
              }
              console.log(`[Paystack] Awarded ${pointsEarned} points to user ${orderData.user_id}`);
            }

            // Check if this user was referred -> award referral reward
            try {
              const refProfileResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${orderData.user_id}&select=referred_by`, {
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
              });
              const refProfiles = await refProfileResp.json();
              const referredBy = refProfiles?.[0]?.referred_by;
              if (referredBy) {
                // Check if referral reward already exists for this order
                const existingResp = await fetch(`${supabaseUrl}/rest/v1/referral_rewards?order_id=eq.${orderId}&select=id`, {
                  headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                  },
                });
                const existing = await existingResp.json();
                if (!existing || existing.length === 0) {
                  await fetch(`${supabaseUrl}/rest/v1/referral_rewards`, {
                    method: 'POST',
                    headers: {
                      'apikey': SUPABASE_SERVICE_KEY,
                      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({
                      referrer_id: referredBy,
                      referee_id: orderData.user_id,
                      order_id: orderId,
                      reward_amount: 100,
                      status: 'confirmed',
                    }),
                  });
                  // Award 1 loyalty point to referrer for confirmed purchase
                  await fetch(`${supabaseUrl}/rest/v1/points_transactions`, {
                    method: 'POST',
                    headers: {
                      'apikey': SUPABASE_SERVICE_KEY,
                      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({
                      user_id: referredBy,
                      points: 1,
                      description: `Referral: Order #${orderId.slice(0, 8).toUpperCase()} (confirmed)`,
                      reference_type: 'referral',
                      reference_id: orderId,
                    }),
                  });
                  // Update referrer's loyalty points
                  const refProfileResp2 = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${referredBy}&select=loyalty_points`, {
                    headers: {
                      'apikey': SUPABASE_SERVICE_KEY,
                      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    },
                  });
                  const refProfiles2 = await refProfileResp2.json();
                  if (refProfiles2?.[0]) {
                    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${referredBy}`, {
                      method: 'PATCH',
                      headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                      },
                      body: JSON.stringify({
                        loyalty_points: (refProfiles2[0].loyalty_points || 0) + 1,
                      }),
                    });
                  }
                  console.log(`[Paystack] Referral reward & point awarded to ${referredBy}`);
                }
              }
            } catch (refErr) {
              console.warn('[Paystack] Referral reward failed:', refErr.message);
            }
          }
        } catch (dbErr) {
          console.error('[Paystack] DB update error:', dbErr.message);
        }
      }
    }

    res.json(data);
  } catch (err) {
    console.error('[Paystack] Verify error:', err.message);
    res.status(502).json({ status: false, message: 'Payment verification error' });
  }
});

// Paystack webhook
app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!PAYSTACK_SECRET_KEY || !signature) {
    return res.status(400).send('Missing signature or key');
  }

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.body).digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  try {
    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const orderId = metadata?.order_id;
      console.log(`[Paystack Webhook] Payment success: ref=${reference} order=${orderId}`);

      // Update order asynchronously (using service_role key to bypass RLS)
      const supabaseUrl = SUPABASE_URL;

      if (orderId && supabaseUrl && SUPABASE_SERVICE_KEY) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/omix_orders?id=eq.${orderId}&select=id,status`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
          });
          const orders = await response.json();
          if (orders?.length && orders[0].status !== 'paid') {
            await fetch(`${supabaseUrl}/rest/v1/omix_orders?id=eq.${orderId}`, {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                status: 'paid',
                paystack_reference: reference,
                paid_at: new Date().toISOString(),
              }),
            });
            console.log(`[Paystack Webhook] Order ${orderId} marked as paid`);
          } else {
            console.log(`[Paystack Webhook] Order ${orderId} already paid, skipping`);
          }
        } catch (err) {
          console.error('[Paystack Webhook] DB error:', err.message);
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Paystack Webhook] Error:', err.message);
    res.status(400).send('Invalid payload');
  }
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
    // Fetch all subscriptions from Supabase (using service_role for server-side access)
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_SERVICE_KEY;

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
// Now with product awareness, user context, and Swahili support

// Fetch products for Nia context
async function fetchProducts(query = '', limit = 5) {
  try {
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) return [];

    const safe = String(query || '').replace(/[^a-zA-Z0-9\s\-.]/g, '').trim();
    let url = `${supabaseUrl}/rest/v1/listings?select=id,title,price,compare_at_price,avg_rating,review_count,purchase_count,quantity,status,category_id,brand,images,location_city,created_at&status=eq.active&order=created_at.desc&limit=${limit}`;
    if (safe) {
      url = `${supabaseUrl}/rest/v1/listings?select=id,title,price,compare_at_price,avg_rating,review_count,purchase_count,quantity,status,category_id,brand,images,location_city,created_at&status=eq.active&or=(title.ilike.*${encodeURIComponent(safe)}*,brand.ilike.*${encodeURIComponent(safe)}*)&order=created_at.desc&limit=${limit}`;
    }

    const resp = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

// Fetch user's recent orders for Nia context
async function fetchUserOrders(userId, limit = 3) {
  try {
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey || !userId) return [];

    const resp = await fetch(
      `${supabaseUrl}/rest/v1/omix_orders?select=id,status,total_amount,created_at,order_items:omix_order_items(product_id,quantity,price)&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

// Fetch user profile for Nia context
async function fetchUserProfile(userId) {
  try {
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey || !userId) return null;

    const resp = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=full_name,loyalty_points,referral_code`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

app.post('/api/nia/chat', async (req, res) => {
  const apiKey = process.env.VITE_OPENCODE_API_KEY;
  
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  const { messages, model = 'nemotron-3-ultra-free', userId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    // Gather context in parallel
    const [userProfile, recentOrders] = await Promise.all([
      userId ? fetchUserProfile(userId) : null,
      userId ? fetchUserOrders(userId) : [],
    ]);

    // Detect if user is asking about products
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
    const isProductQuery = /product|item|buy|shop|find|search|price|cost|available|stock|recommend|suggest/i.test(lastUserMsg);
    
    let productContext = '';
    if (isProductQuery) {
      // Extract search terms from the message
      const searchTerms = lastUserMsg.replace(/^(show|find|search|look|get|i want|i need|do you have|any|recommend|suggest|what|where)\s*/i, '').trim();
      const products = await fetchProducts(searchTerms, 5);
      if (products.length > 0) {
        productContext = '\n\n## Available Products (real catalog only):\n' + products.map(p =>
          `- ${p.title}: KES ${Number(p.price || 0).toLocaleString()}${p.avg_rating ? ` • ${p.avg_rating}★` : ''}${p.brand ? ` • ${p.brand}` : ''}`
        ).join('\n');
      }
    }
    if (pageContext) productContext += `\n\n## Current page context:\n${typeof pageContext === 'string' ? pageContext : JSON.stringify(pageContext)}`;
    if (Array.isArray(cartItems) && cartItems.length) {
      productContext += '\n\n## Cart items:\n' + cartItems.slice(0, 8).map((item) => `- ${item.name || item.title || item.id}`).join('\n');
    }

    // Build user context
    let userContext = '';
    if (userProfile) {
      userContext = `\n\n## User Info:\n- Name: ${userProfile.full_name || 'Customer'}\n- Loyalty Points: ${userProfile.loyalty_points || 0}`;
      if (userProfile.referral_code) {
        userContext += `\n- Referral Code: ${userProfile.referral_code}`;
      }
    }
    if (recentOrders.length > 0) {
      userContext += '\n\n## Recent Orders:\n' + recentOrders.map(o =>
        `- Order #${String(o.id).slice(0, 8).toUpperCase()}: ${o.status} (KES ${o.total_amount?.toLocaleString() || '?'}) - ${new Date(o.created_at).toLocaleDateString('en-KE')}`
      ).join('\n');
    }

    // Detect Swahili
    const isSwahili = /jambo|habari|naomba|nataka|bei|pesa|shilingi|asante|ndio|hapana|nini|wapi|vipi|ngapi/i.test(lastUserMsg);

    const systemPrompt = `You are Nia, the AI assistant for Omix Store — a Kenya-wide online marketplace.

## What you help with:
- Product search and recommendations (use the product list provided)
- Order tracking and status updates
- Payment questions (M-Pesa via Paystack STK Push)
- Delivery info (nationwide, 2-5 days)
- Loyalty points (1 point per KES 100 spent, 100 points = KES 50 off)
- Referral program (share code, both get KES 100 off)
- Returns policy (7 days electronics, 3 days clothing/shoes)
- General app navigation

## Store Info:
- Location: Kenya
- Payment: M-Pesa STK Push via Paystack
- Contact: omixsystems@gmail.com | +254 768 213 649
- Website: stor1-web.onrender.com

## Rules:
- Be warm, concise, and helpful. Use short bullet points.
- If products are listed, recommend specific ones with prices.
- If user asks about their orders, reference the order info provided.
- Never make up prices or product info not in the context.
- If you don't know, say so and offer human support.
- Keep responses under 100 words.
- ${isSwahili ? 'Respond in Swahili (Kiswahili) since the user is speaking Swahili. Keep it natural and conversational.' : 'Respond in English.'}
- End with a relevant suggestion or question to keep the conversation going.
- Never output reasoning or thinking process. Just the answer.${userContext}${productContext}`;

    const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 600,
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

    let products = [];
    if (isProductQuery) {
      const searchTerms = lastUserMsg.replace(/^(show|find|search|look|get|i want|i need|do you have|any|recommend|suggest|what|where)\s*/i, '').trim();
      products = await fetchProducts(searchTerms, 5);
    }
    res.json({ content, products, suggestions: [] });
  } catch (err) {
    console.error('[Nia Proxy] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Nia Product Search Endpoint ────────────────────────────────────
// Returns products for Nia to reference in conversations
app.get('/api/nia/products', async (req, res) => {
  const products = await fetchProducts(req.query.q || '', parseInt(req.query.limit) || 10);
  res.json({ products });
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
  if (distMissing()) {
    return res.redirect(301, 'https://market.omixsystems.store' + req.originalUrl);
  }
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
