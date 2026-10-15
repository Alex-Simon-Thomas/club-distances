// Offline support. Serves the app from the cache, and refreshes the cache in the
// background, so a new version applies the next time the app opens and never mid-round.
importScripts("files.js");

// Bump on every release: a changed sw.js is what makes an installed app fetch the new files,
// and the new cache name lets the old one be cleared once the new version takes over.
const VERSION = "1.1.0";
const CACHE = `club-distances-${VERSION}`;

// Every network read skips the browser's HTTP cache (GitHub Pages lets it keep files for
// 10 minutes), so a pushed version is picked up on the next online launch, not minutes later.
self.addEventListener("install", (event) => {
  const fresh = self.APP_FILES.map((f) => new Request(f, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(fresh)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const refresh = fetch(request, { cache: "no-cache" })
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);
      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      return (await refresh) || (request.mode === "navigate" ? cache.match("./") : Response.error());
    }),
  );
});
