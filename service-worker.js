const CACHE_NAME = 'wordle-cache-v3';

const FILES_TO_CACHE = [
  './',                     // resolves to repo root
  './index.html',
  './manifest.json',
  './solver.js',
  './RussianFreq.txt',
  './RussianJunk.txt',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Force all requests into repo subfolder
  let requestURL = new URL(event.request.url);
  if (requestURL.origin === location.origin && requestURL.pathname.startsWith('/')) {
    if (!requestURL.pathname.startsWith('/wordlersolver/')) {
      requestURL.pathname = '/wordlersolver' + requestURL.pathname;
      event.respondWith(fetch(requestURL.toString()));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
