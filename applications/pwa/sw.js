/**
 * RagnaTouch service worker — offline app-shell cache.
 *
 * Strategy: stale-while-revalidate for SAME-ORIGIN GET requests only. The small
 * app shell is precached on install; everything else same-origin (the app JS,
 * etc.) is cached on first fetch and refreshed in the background.
 *
 * Cross-origin requests pass straight through and are never cached — game
 * assets are served by a remote client on another origin (and already have a
 * client-side FileSystem cache), and the wsProxy uses WebSocket, not fetch.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

const CACHE = 'ragnatouch-shell-v1';
const SHELL = ['./', './index.html', './Config.js', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', event => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(CACHE).then(cache => cache.addAll(SHELL).catch(() => {}))
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', event => {
	const req = event.request;

	// Only same-origin GETs are cached. Game assets (remote client) and the
	// wsProxy are cross-origin / non-fetch and must pass through untouched.
	if (req.method !== 'GET') {
		return;
	}
	if (new URL(req.url).origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		caches.open(CACHE).then(cache =>
			cache.match(req).then(cached => {
				const network = fetch(req)
					.then(res => {
						if (res && res.status === 200 && res.type === 'basic') {
							cache.put(req, res.clone());
						}
						return res;
					})
					.catch(() => cached);
				return cached || network;
			})
		)
	);
});
