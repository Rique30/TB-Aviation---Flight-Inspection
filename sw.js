// TB Aviation — Service Worker
// Caches all app files so the checklist works offline in the hangar.

var CACHE = 'tb-aviation-v177';
var VERSION = 'v177';

var LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/script-vti-vte.js',
  '/firebase-sync.js',
  '/manifest.json'
];

// CDN scripts needed for offline PDF generation and XLSX export
var CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
];

// ── Install: cache everything ──────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache local files (must succeed)
      var localPromise = cache.addAll(LOCAL_ASSETS);

      // Cache CDN files (best-effort — don't fail install if CDN is slow)
      var cdnPromise = Promise.all(
        CDN_ASSETS.map(function(url) {
          return fetch(url, {mode: 'cors'})
            .then(function(res) {
              if (res.ok) return cache.put(url, res);
            })
            .catch(function() {}); // ignore CDN failures during install
        })
      );

      return Promise.all([localPromise, cdnPromise]);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: remove old caches ───────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Message: version query + skip-waiting trigger ────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'GET_VERSION') {
    e.ports[0].postMessage({version: VERSION});
  }
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: serve from cache, fallback to network ──────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Skip non-GET and browser-extension requests
  if (e.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension://')) return;

  // For MSAL / Upstash / OneDrive — always try network (auth/sync)
  if (url.includes('login.microsoftonline.com') ||
      url.includes('graph.microsoft.com') ||
      url.includes('upstash.io')) {
    return; // let the browser handle normally
  }

  // Network-first for the app shell (navigation + local JS/CSS): always
  // prefer a fresh copy so deployed fixes show up without waiting for a
  // cache-version bump, but fall back to cache when offline in the hangar.
  var isNavigation = e.request.mode === 'navigate';
  var isLocalAsset = LOCAL_ASSETS.some(function(a) { return url.indexOf(a) !== -1; });

  if (isNavigation || isLocalAsset) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || (isNavigation ? caches.match('/index.html') : undefined);
        });
      })
    );
    return;
  }

  // Cache-first for pinned CDN assets (immutable versioned URLs)
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(e.request).then(function(res) {
        if (!res || !res.ok || res.type === 'opaque') return res;
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return res;
      }).catch(function() {});
    })
  );
});
