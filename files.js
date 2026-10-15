// Every file the app needs offline. The service worker caches these on install.
// tests/files.test.js fails if an app file is missing from this list.
self.APP_FILES = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "js/bagfile.js",
  "js/clubs.js",
  "js/icons.js",
  "js/ladder.js",
  "js/storage.js",
  "js/units.js",
  "fonts/oxanium-latin.woff2",
  "fonts/ibm-plex-sans-latin.woff2",
  "fonts/OFL-Oxanium.txt",
  "fonts/OFL-IBM-Plex-Sans.txt",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];
