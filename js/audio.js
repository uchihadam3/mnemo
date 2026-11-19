/* MNEMO — áudio: músicas reais (Kevin MacLeod, CC BY 4.0) e efeitos gravados (Kenney, CC0) */
'use strict';
(function () {
  const A = M.audio = { sfxVol: 0.7, musVol: 0.45, started: false, fever: false };
  let ctx = null, master, sfxBus, musBus, musFilter;
  const buf = {};
  const SFX = ['flip1', 'flip2', 'flip3', 'place1', 'place2', 'place3', 'shove', 'shuffle', 'fan', 'packopen', 'takeout',
    'chip1', 'chip2', 'chip3', 'stack1', 'stack2', 'collide', 'handle', 'dice', 'click', 'select', 'error', 'glass', 'confirm',
    'open', 'close', 'tick', 'pluck', 'bong', 'hover', 'shatter', 'bell', 'punch', 'metal', 'thud', 'powerup', 'phaserup',
    'threetone', 'zapup', 'lowdown', 'j_SAX04', 'j_SAX10', 'j_SAX07', 'j_PIZZI02', 'j_PIZZI05', 'j_NES03', 'j_HIT09', 'j_STEEL04'];
  const TRACKS = { menu: 'menu', round1: 'round1', round2: 'round2', boss: 'boss', shop: 'shop' };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -10; master.ratio.value = 3;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.sfxVol; sfxBus.connect(master);
    musFilter = ctx.createBiquadFilter(); musFilter.type = 'lowpass'; musFilter.frequency.value = 20000; musFilter.Q.value = 0.7;
    musBus = ctx.createGain(); musBus.gain.value = A.musVol;
    musFilter.connect(musBus); musBus.connect(master);
    SFX.forEach(load);
  }
  async function load(name) {
    try {
      const r = await fetch(`audio/sfx/${name}.mp3`);
      const ab = await r.arrayBuffer();
      buf[name] = await ctx.decodeAudioData(ab);
      A.loaded = (A.loaded || 0) + 1;
    } catch (e) { buf[name] = 'el'; }
  }

  // toca um sample; rate muda o tom
  function s(name, { vol = 1, rate = 1, t = 0, jitter = 0.04 } = {}) {
    if (!ctx || A.sfxVol <= 0) return;
    const b = buf[name];
    if (b === 'el' || !b) { // sem Web Audio decodificado (ex.: arquivo local): usa <audio>
      if (b !== 'el') return;
      const el = new Audio(`audio/sfx/${name}.mp3`); el.volume = Math.min(1, vol * A.sfxVol); el.playbackRate = rate;
      setTimeout(() => el.play().catch(() => { }), t * 1000); return;
    }
    const src = ctx.createBufferSource(); src.buffer = b;
    src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter);
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(sfxBus);
    src.start(ctx.currentTime + t);
  }
  const pick = (...a) => a[Math.floor(Math.random() * a.length)];
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  const semi = (n) => Math.pow(2, n / 12);

  A.sfx = {
    hover() { s('hover', { vol: 0.18, rate: 1.2 }); },
    click() { s('click', { vol: 0.5 }); },
    flip() { s(pick('flip1', 'flip2', 'flip3'), { vol: 0.9, rate: 1.05, jitter: 0.08 }); },
    flipDown() { s(pick('place1', 'place2', 'place3'), { vol: 0.35, rate: 1.2 }); },
    deal(i = 0) { if (i % 2 === 0) s(pick('place1', 'place2', 'place3'), { vol: 0.4, rate: 1 + (i % 12) * 0.02 }); },
    match(combo = 1) {
      const n = PENTA[Math.min(combo - 1, PENTA.length - 1)];
      s('bell', { vol: 0.55, rate: 0.9 * semi(n), jitter: 0 });
      s('chip' + (1 + (combo % 3)), { vol: 0.8, t: 0.02 });
      if (combo >= 3) s('pluck', { vol: 0.5, rate: semi(n + 12) * 0.5, t: 0.08, jitter: 0 });
    },
    mismatch() { s('error', { vol: 0.55, rate: 0.9 }); s('thud', { vol: 0.7, rate: 0.8 }); },
    chips(i = 0) { s(pick('chip1', 'chip2', 'chip3'), { vol: 0.75, rate: 1 + Math.min(i, 14) * 0.045 }); },
    mult(i = 0) { s('tick', { vol: 0.8, rate: 0.8 + Math.min(i, 14) * 0.06, jitter: 0 }); s('chip2', { vol: 0.4, rate: 0.8 }); },
    xmult() { s('metal', { vol: 0.55, rate: 1.1 }); s('zapup', { vol: 0.3, rate: 1.2 }); },
    coin() { s('handle', { vol: 0.8, rate: 1.15 }); },
    score(big = false) { s(big ? 'stack2' : 'stack1', { vol: 1 }); if (big) { s('punch', { vol: 0.8, rate: 0.8 }); s('bong', { vol: 0.45, rate: 0.8 }); } },
    buy() { s('confirm', { vol: 0.5 }); s('collide', { vol: 0.8 }); },
    sell() { s('handle', { vol: 0.9 }); s('chip1', { vol: 0.6, t: 0.06 }); },
    reroll() { s('shuffle', { vol: 0.8, rate: 1.25 }); },
    pack() { s('packopen', { vol: 1 }); s('j_NES03', { vol: 0.45, t: 0.18 }); },
    take() { s('takeout', { vol: 0.9 }); },
    use() { s('phaserup', { vol: 0.35 }); s('glass', { vol: 0.5, t: 0.05 }); },
    peek() { s('glass', { vol: 0.6, rate: 1.1 }); },
    shatter() { s('shatter', { vol: 0.9 }); },
    clear() { s('fan', { vol: 0.9 }); s('j_PIZZI02', { vol: 0.7, t: 0.1 }); },
    win() { s('j_SAX10', { vol: 0.85 }); s('stack2', { vol: 0.7, t: 0.15 }); },
    lose() { s('j_PIZZI05', { vol: 0.8 }); s('lowdown', { vol: 0.35, t: 0.2 }); },
    unlock() { s('j_SAX04', { vol: 0.8 }); s('threetone', { vol: 0.3, t: 0.1 }); },
    tick() { s('tick', { vol: 0.5 }); },
    boss() { s('j_HIT09', { vol: 0.8 }); s('metal', { vol: 0.6, rate: 0.55 }); },
    swap() { s('shove', { vol: 0.8 }); },
    shuffle() { s('shuffle', { vol: 0.9 }); },
    fever() { s('powerup', { vol: 0.5 }); s('j_STEEL04', { vol: 0.6, t: 0.05 }); },
    feverEnd() { s('lowdown', { vol: 0.4 }); },
    dice() { s('dice', { vol: 0.8 }); },
  };
  A.play = (name, ...a) => { try { if (A.sfx[name]) A.sfx[name](...a); } catch (e) { } };

  /* ---------------- Música ---------------- */
  const mus = { cur: null, name: null, want: null };
  A.music = (name) => {
    mus.want = name;
    if (!A.started) return;
    if (mus.name === name && mus.cur) return;
    const old = mus.cur;
    mus.name = name;
    if (!name) { fadeOut(old); mus.cur = null; return; }
    const el = new Audio(`audio/music/${TRACKS[name] || name}.mp3`);
    el.loop = true; el.preload = 'auto';
    const node = { el, g: null };
    if (ctx) {
      try {
        const src = ctx.createMediaElementSource(el);
        node.g = ctx.createGain(); node.g.gain.value = 0.0001;
        src.connect(node.g); node.g.connect(musFilter);
        node.g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      } catch (e) { node.g = null; }
    }
    if (!node.g) { el.volume = A.musVol; }
    el.play().catch(() => { });
    mus.cur = node;
    fadeOut(old);
  };
  function fadeOut(n) {
    if (!n) return;
    if (n.g && ctx) {
      n.g.gain.cancelScheduledValues(ctx.currentTime);
      n.g.gain.setValueAtTime(Math.max(0.0001, n.g.gain.value), ctx.currentTime);
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      setTimeout(() => { n.el.pause(); n.el.src = ''; }, 1200);
    } else { n.el.pause(); }
  }
  // muda o "clima": no salão a música fica levemente abafada e abre na Febre
  A.mood = (m) => {
    if (!ctx) return;
    const f = m === 'fever' ? 20000 : m === 'round' ? 5200 : m === 'tense' ? 1600 : 20000;
    musFilter.frequency.cancelScheduledValues(ctx.currentTime);
    musFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.35);
    if (mus.cur && mus.cur.el) mus.cur.el.playbackRate = m === 'fever' ? 1.04 : 1;
  };

  A.unlock = () => {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { } // iPhone: toca mesmo no modo silencioso
    init();
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(() => { });
      // som vazio dentro do gesto destrava o áudio no iOS
      try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch (e) { }
    }
    if (!A.started) { A.started = true; if (mus.want) A.music(mus.want); }
    else if (mus.cur && mus.cur.el.paused && !document.hidden) mus.cur.el.play().catch(() => { });
  };
  A.state = () => ({ ctx: ctx && ctx.state, loaded: A.loaded || 0, music: mus.name, playing: !!(mus.cur && !mus.cur.el.paused) });
  A.setVol = (sfx, musV) => {
    A.sfxVol = sfx; A.musVol = musV;
    if (sfxBus) sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
    if (musBus) musBus.gain.setTargetAtTime(musV, ctx.currentTime, 0.1);
    if (mus.cur && !mus.cur.g) mus.cur.el.volume = musV;
  };
  // compat: alguns lugares setam intensidade
  Object.defineProperty(A, 'intensity', { set(v) { }, get() { return 0; } });
  document.addEventListener('visibilitychange', () => {
    if (!mus.cur) return;
    if (document.hidden) mus.cur.el.pause(); else if (A.started) mus.cur.el.play().catch(() => { });
  });
})();
