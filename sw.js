/* MNEMO — service worker: jogo funciona offline */
const CACHE = 'mnemo-v1.0.0';
const FILES = ['./', './index.html', './css/style.css', './manifest.webmanifest',
  './fonts/lilita.woff2', './fonts/nunito.woff2', './assets/icon-192.png', './assets/icon-512.png',
  ...['util', 'data', 'glyphs', 'audio', 'bg', 'fx', 'save', 'game', 'board', 'ui', 'main'].map(f => `./js/${f}.js`)];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
