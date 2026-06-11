// Simple server to serve the Vite-built Omix frontend
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint (must be before static middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stor1-frontend', timestamp: new Date().toISOString() });
});

// ── Nia AI Chat Proxy ──────────────────────────────────────────────
// Proxies OpenCode Zen API calls so the API key stays server-side
app.use('/api/nia', express.json());

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
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// For client-side routing, serve index.html for all non-file routes
app.use((req, res, next) => {
  // Skip API-like paths and files with extensions
  if (req.path.includes('.') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Nia AI proxy: ${process.env.VITE_OPENCODE_API_KEY ? 'ENABLED' : 'DISABLED'}`);
});
