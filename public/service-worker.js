// Self-unregistering service worker — clears old Netlify/Vercel cache issues
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        // Delete all existing caches to fix stale asset issues
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            // Unregister this SW and take control so the page reloads cleanly
            return self.registration.unregister();
        }).then(() => {
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach((client) => {
                if (client.url && 'navigate' in client) {
                    client.navigate(client.url);
                }
            });
        })
    );
});
