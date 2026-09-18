/*
 * Service worker.
 *
 * Why it exists: without one, losing the network gives a blank error page —
 * in the browser, in an installed PWA, and inside the Android shell, which
 * loads this same origin. A wrapper that shows a white screen the moment the
 * signal drops is the shape Google's Minimum Functionality policy rejects, and
 * it is a bad experience regardless of any store.
 *
 * What it does NOT do: cache anything from /api/ or from Supabase. Those carry
 * account data and AI answers, and a stale copy of either would be worse than
 * an honest failure. Only this origin's pages and hashed build assets are
 * stored. The pages are statically generated and hold no user data — the
 * signed-in state is filled in by the client — so a cached page cannot leak
 * one person's data to the next.
 *
 * Hand-written on purpose: no build step, no extra dependency.
 */

const VERSION = 'koreer-v1';
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;

// The fallback page has to be there before the network goes away, so it is the
// one thing fetched up front.
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      // addAll rejects the whole batch if any single item 404s, which would
      // leave the worker uninstalled and the app with no fallback at all.
      .then((cache) => Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** Build assets are content-hashed, so a hit is always the right file. */
function isImmutable(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Other origins — Supabase, Groq, fonts — are left entirely alone.
  if (url.origin !== self.location.origin) return;

  // Account data and AI answers are never stored.
  if (url.pathname.startsWith('/api/')) return;

  // Sign-in URLs carry one-time codes and recovery tokens in the query string.
  // The page itself holds nothing secret, but a cache entry is keyed by the
  // full URL, so caching one would write those codes to disk. Left alone.
  if (/\/auth(\/|$)/.test(url.pathname)) return;

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    // Network first: the live page is always preferred, and the cached copy is
    // only there for the moment the network is not.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline.html');
          return (
            offline ||
            new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
          );
        })
    );
  }
});

// Lets a newly installed worker take over without waiting for every tab to
// close, when the page asks it to.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
