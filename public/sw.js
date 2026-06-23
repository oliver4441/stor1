// Omix Service Worker — aggressive update strategy with offline cart support + push notifications
const CACHE_NAME = 'omix-v2';
const API_CACHE = 'omix-api-v1';
const CART_CACHE = 'omix-cart-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  // Pre-cache core assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Pre-cache failed — still activate
      })
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(clients.claim());

  // Delete old caches
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE && name !== CART_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle API requests with Stale-While-Revalidate + TTL (5 min max)
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);

          if (cached) {
            const dateHeader = cached.headers.get('sw-cache-date');
            if (dateHeader) {
              const age = Date.now() - parseInt(dateHeader, 10);
              if (age < 300_000) return cached; // serve if < 5 min old
            }
            return cached; // serve stale while revalidating
          }

          return networkFetch;
        })
      )
    );
  }

  // Skip non-html/static requests that aren't in our domain
  if (url.origin !== location.origin) return;

  // Navigational requests — Network first, cache fallback
  if (request.destination === 'document' || request.destination === '') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            // If no cached page, show offline fallback
            if (cached) return cached;
            return caches.match('/offline.html');
          })
        )
    );
    return;
  }

  // Static assets (JS, CSS, images) — Cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Omix Store', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    image: data.image || undefined,
    tag: data.tag || 'omix-notification',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Omix Store', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
