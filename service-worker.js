
const CACHE_NAME = 'speedy-shopping-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le nouveau service worker à devenir actif immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Nettoyage des anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend le contrôle des clients immédiatement
});

self.addEventListener('fetch', (event) => {
  // On ne cache que les requêtes GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Stratégie Stale-While-Revalidate :
        // 1. On lance une requête réseau pour mettre à jour le cache
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Si la réponse est valide, on la met en cache
            if (networkResponse && networkResponse.status === 200) {
               cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
             // En cas d'échec réseau (offline), on ne fait rien de spécial,
             // on espère avoir une réponse en cache.
             console.log('Network fetch failed', err);
          });

        // 2. Si on a une réponse en cache, on la retourne immédiatement.
        // Sinon, on attend la réponse réseau.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
