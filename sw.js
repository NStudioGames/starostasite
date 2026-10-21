// Сервіс-воркер: дозволяє працювати без інтернету.
// Змінюєш index.html — підніми номер версії, щоб телефони оновили кеш.
const V = "attendance-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const EXTRA = ["https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"];
const HOSTS = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all([
    c.addAll(CORE),
    ...EXTRA.map(u => fetch(u, {mode: "no-cors"}).then(r => c.put(u, r)).catch(() => {}))
  ])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !HOSTS.includes(url.hostname)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) return hit;                                   // миттєво з кешу, оновлення — у фоні
    return (await net) || (req.mode === "navigate" ? c.match("index.html") : Response.error());
  }));
});
