const CACHE_NAME = "lava-ja-static-v1";
const OFFLINE_URL = "/offline.html";
const MAX_STATIC_ENTRIES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
    OFFLINE_URL,
    "/icons/lava-ja-pwa.svg",
    "/icons/lava-ja-192.png",
    "/icons/lava-ja-512.png",
    "/icons/apple-touch-icon.png",
    "/brand/lava-ja-horizontal.svg",
  ])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("lava-ja-") && name !== CACHE_NAME).map((name) => caches.delete(name)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/api") return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
    return;
  }

  const isPublicStatic = url.search === "" && (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico"
  );
  if (!isPublicStatic || request.headers.has("authorization")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic" && response.headers.get("cache-control")?.includes("no-store") !== true) {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      if (keys.length > MAX_STATIC_ENTRIES) {
        const oldest = keys.find((key) => new URL(key.url).pathname !== OFFLINE_URL);
        if (oldest) await cache.delete(oldest);
      }
    }
    return response;
  })());
});
