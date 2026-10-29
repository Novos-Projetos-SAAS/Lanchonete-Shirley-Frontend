const CACHE = "shirley-static-v1";
const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/offline.html"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  const request = event.request; if (request.method !== "GET") return; const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  const isStatic = url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2|css|js)$/.test(url.pathname); if (!isStatic) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok && response.type === "basic") caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
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

