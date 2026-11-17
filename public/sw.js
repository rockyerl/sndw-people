// SUNDAWA People PWA Service Worker
const CACHE_NAME = "sndw-people-pwa-v2";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/brand/sundawa-people-symbol.svg",
  "/icons/app-icon-192x192.png",
  "/icons/app-icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.ico",
];

// Install: Simpan aset dasar aplikasi
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[PWA SW] Precache partial error (ignored):", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Bersihkan cache versi lama dan klaim kontrol client segera
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
    })
  );
  self.clients.claim();
});

// Fetch: Strategi cerdas (Network-First untuk navigasi & API, Cache-First untuk aset statis)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan cache API routes atau mutasi non-GET
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Aset Statis Next.js, Fonts & Gambar: Cache-First dengan Network Fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Navigasi Halaman HTML: Network-First dengan Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          return new Response(
            `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Offline | SUNDAWA People</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#F3F6FA;color:#17263B;}.card{background:#fff;padding:24px;border-radius:16px;max-width:380px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,0.06);}button{background:#0056AA;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;margin-top:16px;cursor:pointer;}</style></head><body><div class="card"><h2>Anda Sedang Offline</h2><p>Koneksi internet terputus. Buka kembali saat perangkat Anda terhubung.</p><button onclick="window.location.reload()">Coba Lagi</button></div></body></html>`,
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }
});
