// Service worker with custom message handling for manual updates
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Handle navigation requests
const navigationRoute = new NavigationRoute(new NetworkFirst({
    cacheName: 'navigations',
}));
registerRoute(navigationRoute);

// Handle manual update messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Claim clients when service worker activates
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});