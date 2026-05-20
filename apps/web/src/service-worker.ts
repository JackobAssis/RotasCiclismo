/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

// Placeholder service worker for PWA caching and offline support
sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(sw.skipWaiting());
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
});
