/* MNEMO — service worker: o jogo funciona offline */
const CACHE = 'mnemo-v1.5.3';
const FILES = ['./', './index.html', './css/style.css', './manifest.webmanifest',
  './fonts/lilita.woff2', './fonts/nunito.woff2', './assets/icon-192.png', './assets/icon-512.png',
  ...['util', 'data', 'glyphs', 'emoji', 'audio', 'bg', 'fx', 'save', 'game', 'board', 'ui', 'meta', 'glossary', 'main'].map(f => `./js/${f}.js`),
  './audio/sfx/clique.mp3','./audio/sfx/derrota.mp3','./audio/sfx/dinheiro.mp3','./audio/sfx/erro.mp3','./audio/sfx/ficha.mp3','./audio/sfx/mult.mp3','./audio/sfx/par.mp3','./audio/sfx/vidro.mp3','./audio/sfx/virar.mp3','./audio/sfx/vitoria.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return; // músicas usam streaming (range): deixa o navegador cuidar
  e.respondWith(fetch(r).then(res => { if (res.status === 200) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r)));
});
