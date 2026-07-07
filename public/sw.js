// ── Omix Store Service Worker ───────────────────────────
// Handles push notifications, caching, and offline support
// Version: 2 (PWA installability + offline support)

const CACHE_NAME = 'omix-store-v2';
const STATIC_CACHE = 'omix-static-v2';
const PRECACHE_URLS = ['/', '/offline'];

// Assets to precache (common page resources)
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ── Install: precache and activate immediately ─────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.allSettled([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_URLS).catch(() => {});
      }),
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch(() => {});
      }),
    ])
  );
});

// ── Activate: claim clients and clean old caches ────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        );
      }),
    ])
  );
});

// ── Fetch: cache-first for static, network-first for nav ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from our origin
  if (url.origin !== self.location.origin) return;

  // Skip non-GET and API requests
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for known static assets (icons, manifest, etc.)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Cache-first for JS/CSS assets (fingerprinted via Vite)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: network-first, cache fallback, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations for offline use
          if (response.type === 'basic' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cache first
          const cached = await caches.match(request);
          if (cached) return cached;
          // Try the root cached page as SPA fallback
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          // Ultimate fallback: inline offline page
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - Omix Store</title><style>body{font-family:sans-serif;text-align:center;padding:2rem;background:#0a0a0a;color:#e4e4e7}h1{color:#1a5632}p{color:#a1a1aa}</style></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()" style="background:#1a5632;color:#fff;border:none;padding:12px 24px;border-radius:8px;margin-top:16px;font-size:16px">Retry</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
          );
        })
    );
    return;
  }

  // Default: network-only for everything else (no event.respondWith)
});

// ── Push Notification Handler ─────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    try {
      data = { title: 'Omix Store', body: event.data?.text() || 'New update from Omix Store' };
    } catch {
      data = { title: 'Omix Store', body: 'New update' };
    }
  }

  const title = data.title || 'Omix Store';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-72.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
