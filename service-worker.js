const CACHE_NAME = "aygun-v4";
const assets = [
  "./index.html",
  "./manifest.json",
  "./data/urunler.json",
  "./data/kullanicilar.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(assets)));
});

self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
