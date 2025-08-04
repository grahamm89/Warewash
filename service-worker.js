self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('warewash-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './ContentsEditor.html',
        './output.css'
      ]);
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
