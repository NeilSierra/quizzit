const CACHE_NAME = "quizzit-pwa-v3-5";
const PRECACHE_URLS = [
  "/",
  "/library",
  "/import",
  "/history",
  "/settings",
  "/help",
  "/quiz/offline/setup",
  "/quiz/offline/play",
  "/quiz/offline/results",
  "/quiz/offline/review",
  "/icon.png",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/mascot/logo.png",
  "/mascot/wave.png",
  "/mascot/thumbs-up.png",
  "/mascot/sad.png",
];

function getQuizFallbackUrl(pathname) {
  const match = pathname.match(/^\/quiz\/[^/]+\/(setup|play|results|review)$/);
  if (match) {
    return `/quiz/offline/${match[1]}`;
  }
  return "/";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth/")) return;

  // Network-first with cache fallback for HTML navigations & RSC payloads
  if (
    request.mode === "navigate" ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1"
  ) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((m) => {
            if (m) return m;
            const fallback = getQuizFallbackUrl(url.pathname);
            return caches
              .match(fallback)
              .then((fb) => fb || caches.match("/") || Response.error());
          })
        )
    );
    return;
  }

  // Stale-while-revalidate for static bundles, fonts, and mascot images
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/mascot/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.png" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
