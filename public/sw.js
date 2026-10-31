// Service worker Talkly.
// - /hari-ini, /aktivitas/* dan aset statis: stale-while-revalidate, agar kartu aktivitas tetap terbuka saat sinyal hilang.
// - Navigasi lain saat offline: halaman /offline.
// - /api/* tidak pernah di-cache (data keluarga).
// - push dan notificationclick membuka URL dari payload.

const CACHE = "talkly-v1";
const OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([OFFLINE, "/icon-192.png", "/manifest.webmanifest"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nama) => Promise.all(nama.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function bolehDisimpan(url) {
  if (url.pathname === "/hari-ini" || url.pathname.startsWith("/aktivitas/")) return true;
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(png|svg|ico|woff2?|css|js|webmanifest)$/.test(url.pathname);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const lama = await cache.match(request);
  const baru = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return lama || (await baru) || (await cache.match(OFFLINE));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Data RSC untuk navigasi klien ke halaman yang disimpan.
  if (bolehDisimpan(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const judul = data.title || data.judul || "Talkly";
  event.waitUntil(
    self.registration.showNotification(judul, {
      body: data.body || data.isi || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/hari-ini" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tujuan = new URL(event.notification.data?.url || "/hari-ini", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((jendela) => {
      for (const j of jendela) {
        if ("focus" in j) {
          j.navigate(tujuan);
          return j.focus();
        }
      }
      return self.clients.openWindow(tujuan);
    }),
  );
});
