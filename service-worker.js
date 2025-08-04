
const CACHE_NAME = 'dw-helper-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/app_data.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});


self.addEventListener('activate', event => {
  const allowedCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (!allowedCaches.includes(key)) {
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});
