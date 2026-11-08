const CACHE_NAME = "brat-animator-v11-windows7-tiktok-phase5";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/css/editor-v5.css",
"./assets/css/studio-dashboard.css",
  "./assets/css/aero-theme.css",
  "./assets/css/classic-desktop.css",
  "./assets/css/win7-app.css",
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
"./assets/js/supabase-config.js",
"./assets/js/auth-client.js",
  "./assets/js/bratcode.js",
  "./assets/js/backup-reminders.js",
"./assets/js/sound-hub.js",
  "./assets/js/studio-dashboard.js",
  "./assets/js/win7-shell.js",
  "./assets/js/tiktok-config.js",
  "./assets/js/tiktok-link.js",
  "./assets/js/sound-hub-ui.js",
  "./assets/js/dashboard-audio.js",
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

  // HTML navigations and public auth configuration must not remain stuck
  // behind old cache-first responses after the site has been updated.
  const freshFirst = event.request.mode === "navigate"
    || requestUrl.pathname.endsWith("/assets/js/supabase-config.js");
  if (freshFirst) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match(new URL("./index.html", self.registration.scope).href);
        }
        return Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
        }
        return response;
      }))
  );
});
