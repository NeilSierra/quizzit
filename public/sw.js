const CACHE_NAME = "quizzit-pwa-v4-0";
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

async function precacheAppShellAndAssets(cache) {
  await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));

  const assetUrls = new Set();
  for (const pageUrl of PRECACHE_URLS) {
    try {
      const res = await cache.match(pageUrl);
      if (!res) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;
      const html = await res.text();
      const matches = html.match(/\/_next\/static\/[^"'\s<>)]+/g);
      if (matches) {
        for (const m of matches) assetUrls.add(m);
      }
    } catch {
      // ignore individual page parse errors
    }
  }

  await Promise.allSettled(
    Array.from(assetUrls).map(async (assetUrl) => {
      try {
        await cache.add(assetUrl);
        if (assetUrl.endsWith(".css")) {
          const cssRes = await cache.match(assetUrl);
          if (cssRes) {
            const cssText = await cssRes.text();
            const fontMatches = cssText.match(/\/_next\/static\/[^"'\s)]+/g);
            if (fontMatches) {
              await Promise.allSettled(
                fontMatches.map((f) => cache.add(f))
              );
            }
          }
        }
      } catch {
        // ignore individual asset cache errors
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => precacheAppShellAndAssets(cache))
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

  // Network-first with cache fallback for HTML navigations
  if (request.mode === "navigate") {
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
          caches.match(url.pathname, { ignoreSearch: true }).then((m) => {
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

  // Network-first for Next.js RSC payloads; on cache miss offline return network error
  // so App Router falls back to a standard navigation handled above.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") {
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
          caches.match(request).then((m) => m || Response.error())
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
