// sw.js (Service Worker)

const CACHE_NAME = 'debrid-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/assets/styles.css',  // Example of caching a CSS file
  '/favicon.ico',        // Example of caching a favicon
  '/scripts/',           // Cache all files in /scripts
];

// Install event - caching essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate event - removing old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serving cached files
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;  // Return the cached file if found
      }
      return fetch(event.request);  // Otherwise, fetch the file from the network
    })
  );
});
