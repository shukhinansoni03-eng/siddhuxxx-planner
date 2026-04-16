const CACHE_NAME = 'siddhu-cache-v3';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache core files
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: network-first for API-like requests, cache-first for static
self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  const url = new URL(evt.request.url);

  // For navigation requests, try network then fallback to cache
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request).then(resp => {
        return caches.open(CACHE_NAME).then(cache => { cache.put(evt.request, resp.clone()); return resp; });
      }).catch(()=>caches.match('/index.html'))
    );
    return;
  }

  // For other GETs, try cache first then network
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(resp => {
        return caches.open(CACHE_NAME).then(cache => {
          try { cache.put(evt.request, resp.clone()); } catch(e){}
          return resp;
        });
      }).catch(()=>caches.match('/index.html'));
    })
  );
});
