// Registers the service worker so the app opens with no signal.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(
    () => navigator.serviceWorker.ready.then(() => {
      document.getElementById("offline-state").textContent = "Ready to use offline.";
    }),
    (err) => console.error("Service worker failed to register", err),
  );
}
