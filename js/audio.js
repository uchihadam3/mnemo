/* MNEMO — áudio 100% sintetizado (efeitos + música generativa reativa ao combo) */
'use strict';
(function () {
  let ctx = null, master, sfxBus, musBus, comp, noiseBuf;
  const A = M.audio = { sfxVol: 0.7, musVol: 0.45, intensity: 0, started: false };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    sfxBus = ctx.createGain(); musBus = ctx.createGain();
    sfxBus.gain.value = A.sfxVol; musBus.gain.value = A.musVol;
    sfxBus.connect(comp); musBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // reverb simples
    A.rev = makeReverb();
    A.rev.connect(comp);
  }
  function makeReverb() {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = b.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    conv.buffer = b;
    const g = ctx.createGain(); g.gain.value = 0.28;
    conv.connect(g);
    g.connect = g.connect.bind(g);
    conv._out = g;
    return { input: conv, connect: (n) => g.connect(n) };
  }

  A.unlock = () => {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (!A.started && ctx) { A.started = true; music.start(); }
  };
  A.setVol = (sfx, mus) => {
    A.sfxVol = sfx; A.musVol = mus;
    if (sfxBus) sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
    if (musBus) musBus.gain.setTargetAtTime(mus * 0.6, ctx.currentTime, 0.2);
  };

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone({ f = 440, type = 'sine', t = 0, dur = 0.15, vol = 0.3, atk = 0.005, f2 = null, bus = sfxBus, rev = 0, detune = 0, q = null, lp = null }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, now); o.detune.value = detune;
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let last = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; if (q) fl.Q.value = q; o.connect(fl); last = fl; }
    last.connect(g); g.connect(bus);
    if (rev && A.rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(A.rev.input); }
    o.start(now); o.stop(now + dur + 0.05);
  }
  function noise({ t = 0, dur = 0.08, vol = 0.2, bp = 2000, q = 1, type = 'bandpass', bus = sfxBus, f2 = null }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(bp, now); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(fl); fl.connect(g); g.connect(bus);
    s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.02);
  }

  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];
  A.sfx = {
    hover() { tone({ f: 1800, type: 'sine', dur: 0.03, vol: 0.04 }); },
    click() { tone({ f: 900, type: 'triangle', dur: 0.06, vol: 0.12, f2: 600 }); noise({ dur: 0.03, vol: 0.05, bp: 4000 }); },
    flip() { noise({ dur: 0.07, vol: 0.18, bp: 3200, q: 0.8, f2: 1400 }); tone({ f: 520 + Math.random() * 60, type: 'triangle', dur: 0.07, vol: 0.07 }); },
    flipDown() { noise({ dur: 0.06, vol: 0.1, bp: 1800, f2: 900 }); },
    deal(i = 0) { noise({ t: 0, dur: 0.05, vol: 0.08, bp: 2600 + i * 40 }); },
    match(combo = 1) {
      const base = 72;
      const n1 = base + PENTA[Math.min(combo - 1, PENTA.length - 1)];
      tone({ f: mtof(n1), type: 'triangle', dur: 0.5, vol: 0.22, rev: 0.6 });
      tone({ f: mtof(n1 + 7), type: 'sine', t: 0.07, dur: 0.6, vol: 0.16, rev: 0.6 });
      tone({ f: mtof(n1 + 12), type: 'sine', t: 0.14, dur: 0.7, vol: 0.1, rev: 0.8 });
      if (combo >= 4) tone({ f: mtof(n1 + 19), type: 'square', t: 0.2, dur: 0.25, vol: 0.04, lp: 3000 });
    },
    mismatch() {
      tone({ f: 220, type: 'sawtooth', dur: 0.32, vol: 0.12, f2: 110, lp: 900 });
      tone({ f: 165, type: 'square', t: 0.06, dur: 0.3, vol: 0.07, f2: 80, lp: 600 });
    },
    chips(i = 0) { tone({ f: mtof(76 + (i % 12)), type: 'square', dur: 0.06, vol: 0.06, lp: 2500 }); },
    mult(i = 0) { tone({ f: mtof(64 + (i % 12)), type: 'sawtooth', dur: 0.09, vol: 0.08, lp: 1800 }); },
    xmult() { tone({ f: 110, type: 'sawtooth', dur: 0.35, vol: 0.18, f2: 440, lp: 2000 }); noise({ dur: 0.25, vol: 0.15, bp: 800, f2: 3000 }); },
    coin() { tone({ f: 1318, type: 'square', dur: 0.08, vol: 0.07, lp: 4000 }); tone({ f: 1975, type: 'square', t: 0.07, dur: 0.18, vol: 0.07, lp: 4000 }); },
    score(big = false) {
      noise({ dur: big ? 0.6 : 0.3, vol: big ? 0.25 : 0.14, bp: 400, f2: 4000, q: 0.6 });
      tone({ f: big ? 98 : 131, type: 'sine', dur: 0.5, vol: 0.28, f2: big ? 49 : 65 });
    },
    buy() { [0, 4, 7, 12].forEach((s, i) => tone({ f: mtof(72 + s), type: 'triangle', t: i * 0.05, dur: 0.2, vol: 0.12, rev: 0.3 })); A.sfx.coin(); },
    sell() { [12, 7, 4].forEach((s, i) => tone({ f: mtof(72 + s), type: 'triangle', t: i * 0.05, dur: 0.18, vol: 0.1 })); A.sfx.coin(); },
    reroll() { for (let i = 0; i < 6; i++) tone({ f: mtof(70 + i * 3), type: 'square', t: i * 0.03, dur: 0.05, vol: 0.05, lp: 3000 }); },
    pack() { noise({ dur: 0.5, vol: 0.2, bp: 600, f2: 5000, q: 0.5 }); [0, 7, 12, 19].forEach((s, i) => tone({ f: mtof(67 + s), type: 'sine', t: 0.2 + i * 0.07, dur: 0.6, vol: 0.12, rev: 0.7 })); },
    use() { tone({ f: 400, type: 'sine', dur: 0.4, vol: 0.15, f2: 1600, rev: 0.6 }); noise({ dur: 0.3, vol: 0.08, bp: 3000, f2: 8000 }); },
    peek() { tone({ f: 1200, type: 'sine', dur: 0.25, vol: 0.08, f2: 1800, rev: 0.5 }); },
    shatter() { for (let i = 0; i < 8; i++) tone({ f: 2000 + Math.random() * 3000, type: 'triangle', t: i * 0.02, dur: 0.12, vol: 0.05 }); noise({ dur: 0.3, vol: 0.18, bp: 6000, q: 0.5 }); },
    clear() { [0, 4, 7, 11, 14, 19].forEach((s, i) => tone({ f: mtof(67 + s), type: 'triangle', t: i * 0.06, dur: 0.6, vol: 0.12, rev: 0.7 })); },
    win() { [[0, 0], [4, .12], [7, .24], [12, .36], [16, .52], [19, .64], [24, .8]].forEach(([s, t]) => { tone({ f: mtof(67 + s), type: 'triangle', t, dur: 0.7, vol: 0.14, rev: 0.7 }); tone({ f: mtof(55 + s), type: 'sine', t, dur: 0.8, vol: 0.08 }); }); },
    lose() { [7, 5, 3, 0].forEach((s, i) => tone({ f: mtof(55 + s), type: 'sawtooth', t: i * 0.22, dur: 0.5, vol: 0.09, lp: 1200 })); },
    unlock() { [0, 7, 12, 16, 19, 24].forEach((s, i) => tone({ f: mtof(72 + s), type: 'sine', t: i * 0.08, dur: 0.9, vol: 0.12, rev: 0.9 })); noise({ dur: 1, vol: 0.06, bp: 6000, q: 2 }); },
    tick() { tone({ f: 2000, type: 'square', dur: 0.02, vol: 0.04 }); },
    boss() { tone({ f: 55, type: 'sawtooth', dur: 1.4, vol: 0.2, lp: 400 }); tone({ f: 58, type: 'sawtooth', dur: 1.4, vol: 0.15, lp: 400 }); noise({ dur: 1.2, vol: 0.1, bp: 200, q: 2 }); },
    swap() { tone({ f: 300, type: 'sine', dur: 0.2, vol: 0.1, f2: 900 }); tone({ f: 900, type: 'sine', t: 0.1, dur: 0.2, vol: 0.1, f2: 300 }); },
  };
  A.play = (name, ...a) => { try { if (ctx && A.sfx[name]) A.sfx[name](...a); } catch (e) { } };

  /* ---------------- Música generativa ---------------- */
  const music = {
    step: 0, next: 0, timer: null, bpm: 84,
    // progressão: i - VI - III - VII em Lá menor (com cores)
    chords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]],
    start() {
      this.next = ctx.currentTime + 0.1;
      this.timer = setInterval(() => this.tick(), 60);
    },
    tick() {
      if (!ctx || A.musVol <= 0.001) { if (ctx) this.next = ctx.currentTime + 0.1; return; }
      const spb = 60 / this.bpm / 2; // colcheias
      while (this.next < ctx.currentTime + 0.25) {
        this.play(this.step, this.next, spb);
        this.next += spb; this.step++;
      }
    },
    play(step, t, spb) {
      const bar = Math.floor(step / 16) % 4;
      const ch = this.chords[bar];
      const inBar = step % 16;
      const I = A.intensity;
      const rt = t - ctx.currentTime;
      if (inBar === 0) {
        ch.forEach((n, i) => tone({ f: mtof(n), type: 'sawtooth', t: rt, dur: spb * 16, vol: 0.022, atk: 0.8, lp: 700 + I * 900, detune: (i % 2 ? 7 : -7), bus: musBus, rev: 0.5 }));
        tone({ f: mtof(ch[0] - 24), type: 'sine', t: rt, dur: spb * 8, vol: 0.12, atk: 0.05, bus: musBus });
      }
      if (inBar === 8) tone({ f: mtof(ch[0] - 24), type: 'sine', t: rt, dur: spb * 8, vol: 0.09, atk: 0.05, bus: musBus });
      // arpejo
      const pat = [0, 2, 1, 3, 2, 1, 3, 2];
      if (inBar % 2 === 0 || I > 0.5) {
        const n = ch[pat[(inBar >> (I > 0.5 ? 0 : 1)) % 8]] + 12 + (inBar >= 12 && I > 0.3 ? 12 : 0);
        tone({ f: mtof(n), type: 'triangle', t: rt, dur: spb * 1.6, vol: 0.035 + I * 0.02, bus: musBus, rev: 0.6 });
      }
      // percussão suave quando o combo cresce
      if (I > 0.15 && inBar % 4 === 2) noise({ t: rt, dur: 0.04, vol: 0.03 + I * 0.04, bp: 8000, q: 1, bus: musBus });
      if (I > 0.35 && (inBar === 0 || inBar === 8)) tone({ f: 70, type: 'sine', t: rt, dur: 0.25, vol: 0.18 * I, f2: 40, bus: musBus });
      if (I > 0.6 && inBar % 2 === 1) noise({ t: rt, dur: 0.02, vol: 0.02, bp: 10000, q: 1, bus: musBus });
    },
  };
})();
