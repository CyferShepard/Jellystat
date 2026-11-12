// Service worker so Jellystat can be installed as an app (PWA).
// Data (API, socket, images) is NEVER cached - statistics must always be current.
// Only the app shell (index.html, JS, CSS, icons, translations) is cached, as an offline fallback.
const CACHE = "jellystat-shell-v1";
const NO_CACHE = /^\/(api|auth|proxy|stats|sync|backup|logs|utils|socket\.io|swagger)(\/|$)|^\/env\.js$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // strip the configured base path (JS_BASE_URL) before matching the data routes
  const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
  const path = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) || "/" : url.pathname;
  if (NO_CACHE.test(path)) return;

  // network-first: always try the network, fall back to the cache only when the server is unreachable
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("./") : undefined)))
  );
});
