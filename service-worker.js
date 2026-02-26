const CACHE_NAME = "aygun-cache-v1";
const urlsToCache = [
  "/Aygun/",
  "/Aygun/index.html",
  "/Aygun/data/urunler.json",
  "/Aygun/data/kullanicilar.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
