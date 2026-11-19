/* MNEMO — utilidades, RNG com semente */
'use strict';
const M = window.M = window.M || {};

M.sleep = (ms) => new Promise(r => setTimeout(r, ms / (M.speed || 1)));
M.sleepRaw = (ms) => new Promise(r => setTimeout(r, ms));
M.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
M.lerp = (a, b, t) => a + (b - a) * t;
M.$ = (s, el = document) => el.querySelector(s);
M.$$ = (s, el = document) => [...el.querySelectorAll(s)];
M.esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

M.fmt = (n) => {
  n = Math.floor(n);
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e7) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  return n.toLocaleString('pt-BR');
};
M.fmtX = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');

/* mulberry32 — estado salvo em run.rng */
M.RNG = class {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    let t = (this.s += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  weighted(items, wfn) {
    const tot = items.reduce((s, it) => s + wfn(it), 0);
    let r = this.next() * tot;
    for (const it of items) { r -= wfn(it); if (r <= 0) return it; }
    return items[items.length - 1];
  }
};

M.hashStr = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
M.todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
M.roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
M.uid = (() => { let i = 0; return () => (Date.now().toString(36) + (i++).toString(36) + Math.random().toString(36).slice(2, 6)); })();

M.vibrate = (ms) => { try { if (M.profile && M.profile.settings.shake && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };
