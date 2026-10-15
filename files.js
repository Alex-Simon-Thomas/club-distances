// Every file the app needs offline. The service worker caches these on install.
// tests/files.test.js fails if an app file is missing from this list.
self.APP_FILES = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];
