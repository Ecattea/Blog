/* Image-only service worker cache (stale-while-revalidate) */
const CACHE_NAME = "image-cache-v1";
const MAX_ENTRIES = 60;

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  await cache.delete(keys[0]);
  await trimCache(cache, maxEntries);
}

self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.mode === "navigate") return;
  if (request.destination !== "image") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) {
        event.waitUntil(
          (async () => {
            try {
              const response = await fetch(request);
              if (response && (response.ok || response.type === "opaque")) {
                await cache.put(request, response.clone());
                await trimCache(cache, MAX_ENTRIES);
              }
            } catch {
              // Ignore network errors during background refresh.
            }
          })()
        );

        return cached;
      }

      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
        await cache.put(request, response.clone());
        await trimCache(cache, MAX_ENTRIES);
      }

      return response;
    })()
  );
});
