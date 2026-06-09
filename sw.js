const CACHE_NAME = 'siges-v5';

// Solo cachear recursos esenciales (no páginas completas)
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css'
  // Los JS se cachearán dinámicamente al usarse
];

// Instalación: cachear solo lo esencial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache falló:', err))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Fetch: estrategia "network first" para navegación, "cache first" para recursos
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Para navegación (HTML), usar network first con fallback a index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Para recursos estáticos (CSS, JS, etc.), usar cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});