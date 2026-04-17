// Tinkú service worker — Ola 1 minimal.
// Cache-first para assets estáticos (iconos, manifest, next/static). Network-first para todo lo demás.
// Offline fallback simple: si falla navegación, sirve un mensaje básico embebido.

const CACHE_NAME = 'tinku-v1';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/tinku.svg',
  '/icons/tinku-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    /\.(woff2?|ttf|otf|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)
  );
}

const OFFLINE_HTML = `<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tinkú — sin conexión</title><body style="font-family:system-ui;background:#F6F3EC;color:#1D2B2F;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;margin:0;"><div style="max-width:420px;text-align:center;"><div style="font-size:72px">🛶</div><h1>Nos quedamos sin internet</h1><p>Volvé a conectarte para seguir aprendiendo. Tu progreso está guardado.</p></div></body></html>`;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cachear server actions / rutas sensibles
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/auth/')) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        });
      })
    );
    return;
  }

  // Navigations: network-first con fallback offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    );
  }
});
