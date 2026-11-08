const CACHE_NAME = "brat-animator-v7-local-workspace-1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/css/editor-v5.css",
  "./assets/js/core.js",
  "./vendor/js-yaml.min.js",
  "./assets/js/lyrics.js",
  "./assets/js/lyrics-sources.js",
  "./assets/js/timing.js",
  "./assets/js/media.js",
  "./assets/js/export.js",
  "./assets/js/i18n.js",
  "./assets/js/local-workspace.js",
"./assets/js/app.js",
  "./assets/js/motion.js",
  "./assets/js/kinetic.js",
  "./assets/js/project-assets.js",
  "./assets/js/editor-v5.js",
  "./assets/js/italian-ui.js",
  "./assets/js/studio-shell.js",
  "./vendor/mp4-muxer.mjs",
  "./vendor/fflate.min.js",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./social-preview.png",
  "./site.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS.map((url) => new URL(url, self.registration.scope).href)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }))
  );
});
