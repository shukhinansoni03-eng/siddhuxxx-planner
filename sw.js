const CACHE_NAME = 'siddhu-cache-noicons-v2';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;

  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request).then(resp => {
        return caches.open(CACHE_NAME).then(cache => { cache.put(evt.request, resp.clone()); return resp; });
      }).catch(()=>caches.match('/index.html'))
    );
    return;
  }

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
