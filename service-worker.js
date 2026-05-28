/**
 * service-worker.js - PWA offline cache
 */
const CACHE = "nnv-v2-0-0";
const SCOPE = self.registration && self.registration.scope ? self.registration.scope : self.location.href.replace(/service-worker\.js.*$/, "");
const ASSETS = ["", "index.html", "manifest.webmanifest",
  "assets/css/style.css",
  "assets/js/tvmi-data.js", "assets/js/tvmi-logic.js", "assets/js/geo.js",
  "assets/js/storage.js", "assets/js/photos.js", "assets/js/version.js",
  "assets/js/export.js", "assets/js/app.js", "assets/js/app-v2.js",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js",
  "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"
];
self.addEventListener("install", (e) => { e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await Promise.all(ASSETS.map(a => c.add(SCOPE + a).catch(() => {})));
  await Promise.all(CDN.map(u => c.add(u).catch(() => {})));
  self.skipWaiting();
})()); });
self.addEventListener("activate", (e) => { e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  self.clients.claim();
})()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isVersion = url.pathname.endsWith("/VERSION.json");
  const isGeo = /nominatim|openstreetmap/i.test(url.hostname);
  if (isVersion || isGeo) { e.respondWith(fetch(req).catch(() => caches.match(req))); return; }
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === "basic") {
        const c = await caches.open(CACHE); c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.destination === "document") return caches.match(SCOPE + "index.html");
      return new Response("Offline", { status: 503 });
    }
  })());
});
