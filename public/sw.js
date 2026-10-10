// DaySpark Service Worker — offline-first caching
// Uses relative paths derived from the SW's own location so it works
// under any base path (e.g. /DaySpark/ on GitHub Pages).
const CACHE_NAME = 'dayspark-v1';
const BASE = self.registration.scope; // e.g. https://user.github.io/DaySpark/

const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin requests (fonts, external resources)
  if (url.origin !== self.location.origin) return;

  // Skip non-http(s) protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip requests outside our scope
  if (!url.href.startsWith(BASE)) return;

  // Network-first for navigation requests (so users get updates),
  // fall back to cached app shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(BASE + 'index.html').then((r) => r || caches.match(BASE))
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
