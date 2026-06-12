const CACHE_NAME = 'siges-v10';
const urlsToCache = [
  '/siges/',
  '/siges/index.html',
  '/siges/manifest.json',
  '/siges/css/styles.css',
  '/siges/js/main.js',
  '/siges/js/router.js',
  '/siges/js/auth.js',
  '/siges/js/mockApi.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/siges/index.html'))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});