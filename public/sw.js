const CACHE_NAME = "mpsms-cache-v5";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and external API calls (e.g. Supabase DB/functions)
  if (event.request.method !== "GET" || event.request.url.includes("/functions/v1/") || event.request.url.includes("supabase.co")) {
    return;
  }

  const isCodeOrAsset = 
    event.request.mode === "navigate" || 
    event.request.headers.get("accept")?.includes("text/html") ||
    event.request.url.endsWith(".js") ||
    event.request.url.endsWith(".css") ||
    event.request.url.includes("/assets/");

  // Network-First strategy for HTML documents, JS, CSS, and compiled assets
  if (isCodeOrAsset) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fall back to cached index.html or specific assets if offline
          if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html") || caches.match(event.request);
          }
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-While-Revalidate for other static local assets (images, icons, manifest.json)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // No resource in cache and network offline
        });
    })
  );
});
