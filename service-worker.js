const CACHE_NAME = "english-word-trainer-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./english-word-trainer.html",
  "./manifest.webmanifest",
  "./icons/icon-32.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./english-word-trainer.html"));
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type !== "SHOW_NOTIFICATION") return;
  const title = event.data.title || "Новое сообщение";
  const options = {
    body: event.data.body || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-32.png",
    tag: event.data.tag || "couple-chat-message",
    data: { url: event.data.url || "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("push", event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Новое сообщение", body: event.data?.text() || "" };
  }
  event.waitUntil(self.registration.showNotification(payload.title || "Новое сообщение", {
    body: payload.body || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-32.png",
    tag: payload.tag || "couple-chat-message",
    data: { url: payload.url || "./" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "./";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    })
  );
});
