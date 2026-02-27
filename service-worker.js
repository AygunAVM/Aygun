const CACHE_NAME = "aygun-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./data/urunler.json",
  "./data/kullanicilar.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./favicon.ico"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
