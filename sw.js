const CACHE_NAME = 'siges-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache inicial falló:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Solo para navegación (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Para recursos estáticos (CSS, JS, JSON)
  if (url.pathname.match(/\.(css|js|json|png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }
  
  // Para todo lo demás, ir a la red (sin cachear)
  event.respondWith(fetch(event.request));
});