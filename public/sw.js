const CACHE = "shirley-static-v2";
const CACHE_STATIC = !new URL(self.location.href).searchParams.has("development");
const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/offline.html"];
self.addEventListener("install", (event) => { event.waitUntil((CACHE_STATIC ? caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)) : Promise.resolve()).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("shirley-static-") && (!CACHE_STATIC || key !== CACHE)).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  if (!CACHE_STATIC) return;
  const request = event.request; if (request.method !== "GET") return; const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  const isStatic = url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2|css|js)$/.test(url.pathname); if (!isStatic) return;
  let cacheWrite = Promise.resolve();
  const response = caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      cacheWrite = caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
    }
    return response;
  }));
  event.respondWith(response);
  event.waitUntil(response.then(() => cacheWrite).catch(() => undefined));
});
self.addEventListener("push", (event) => {
  let payload = { title: "Lanchonete Shirley", body: "Há uma atualização na operação.", url: "/admin/notificacoes", event_id: undefined };
  try { payload = { ...payload, ...event.data.json() }; } catch { /* payload padrão sem dados pessoais */ }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: payload.url, event_id: payload.event_id }, tag: payload.event_id || "shirley-operacao" }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); const requested = new URL(event.notification.data?.url || "/admin/notificacoes", self.location.origin); const target = requested.origin === self.location.origin ? requested.href : new URL("/admin/notificacoes", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => { const existing = clients.find((client) => new URL(client.url).origin === self.location.origin); if (existing) { existing.navigate(target); return existing.focus(); } return self.clients.openWindow(target); }));
});

