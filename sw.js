/* MNEMO — service worker: o jogo funciona offline */
const CACHE = 'mnemo-v1.1.1';
const FILES = ['./', './index.html', './css/style.css', './manifest.webmanifest',
  './fonts/lilita.woff2', './fonts/nunito.woff2', './assets/icon-192.png', './assets/icon-512.png',
  ...['util', 'data', 'glyphs', 'audio', 'bg', 'fx', 'save', 'game', 'board', 'ui', 'main'].map(f => `./js/${f}.js`),
  './audio/sfx/bell.mp3','./audio/sfx/bong.mp3','./audio/sfx/chip1.mp3','./audio/sfx/chip2.mp3','./audio/sfx/chip3.mp3','./audio/sfx/click.mp3','./audio/sfx/close.mp3','./audio/sfx/collide.mp3','./audio/sfx/confirm.mp3','./audio/sfx/dice.mp3','./audio/sfx/error.mp3','./audio/sfx/fan.mp3','./audio/sfx/flip1.mp3','./audio/sfx/flip2.mp3','./audio/sfx/flip3.mp3','./audio/sfx/glass.mp3','./audio/sfx/handle.mp3','./audio/sfx/hover.mp3','./audio/sfx/j_HIT09.mp3','./audio/sfx/j_NES03.mp3','./audio/sfx/j_PIZZI02.mp3','./audio/sfx/j_PIZZI05.mp3','./audio/sfx/j_SAX04.mp3','./audio/sfx/j_SAX07.mp3','./audio/sfx/j_SAX10.mp3','./audio/sfx/j_STEEL04.mp3','./audio/sfx/lowdown.mp3','./audio/sfx/metal.mp3','./audio/sfx/open.mp3','./audio/sfx/packopen.mp3','./audio/sfx/phaserup.mp3','./audio/sfx/place1.mp3','./audio/sfx/place2.mp3','./audio/sfx/place3.mp3','./audio/sfx/pluck.mp3','./audio/sfx/powerup.mp3','./audio/sfx/punch.mp3','./audio/sfx/select.mp3','./audio/sfx/shatter.mp3','./audio/sfx/shove.mp3','./audio/sfx/shuffle.mp3','./audio/sfx/stack1.mp3','./audio/sfx/stack2.mp3','./audio/sfx/takeout.mp3','./audio/sfx/threetone.mp3','./audio/sfx/thud.mp3','./audio/sfx/tick.mp3','./audio/sfx/zapup.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return; // músicas usam streaming (range): deixa o navegador cuidar
  e.respondWith(fetch(r).then(res => { if (res.status === 200) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r)));
});
