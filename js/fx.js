/* MNEMO — partículas, tremor de tela, textos flutuantes e anúncios */
'use strict';
(function () {
  const FX = M.fx = { parts: [], rings: [] };
  let cv, g, W, H, dpr;

  FX.init = (canvas) => {
    cv = canvas; g = cv.getContext('2d');
    const rs = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    addEventListener('resize', rs); rs();
    requestAnimationFrame(loop);
  };

  let lastT = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!FX.parts.length && !FX.rings.length) { if (FX._dirty) { g.clearRect(0, 0, W, H); FX._dirty = false; } return; }
    FX._dirty = true;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (let i = FX.rings.length - 1; i >= 0; i--) {
      const r = FX.rings[i]; r.t += dt;
      const k = r.t / r.life; if (k >= 1) { FX.rings.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - k, 3);
      g.strokeStyle = r.c; g.globalAlpha = (1 - k) * 0.9; g.lineWidth = r.w * (1 - k) + 1;
      g.beginPath(); g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2); g.stroke();
    }
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i]; p.t += dt;
      if (p.t >= p.life) { FX.parts.splice(i, 1); continue; }
      p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60); p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.t / p.life;
      g.globalAlpha = (1 - k) * p.a;
      g.fillStyle = p.c;
      if (p.shape === 'spark') {
        const sp = Math.hypot(p.vx, p.vy) * 0.03 + 1;
        g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.vy, p.vx));
        g.fillRect(-p.s * sp, -p.s * 0.35, p.s * sp * 2, p.s * 0.7); g.restore();
      } else if (p.shape === 'rect') {
        g.globalCompositeOperation = 'source-over';
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 2));
        g.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); g.restore();
        g.globalCompositeOperation = 'lighter';
      } else if (p.shape === 'shard') {
        g.globalCompositeOperation = 'source-over';
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.beginPath(); g.moveTo(0, -p.s); g.lineTo(p.s * 0.6, p.s); g.lineTo(-p.s * 0.6, p.s * 0.4); g.closePath();
        g.fillStyle = 'rgba(200,240,255,.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.stroke(); g.restore();
        g.globalCompositeOperation = 'lighter';
      } else {
        const s = p.s * (1 - k * 0.5);
        const grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 2.2);
        grd.addColorStop(0, p.c); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.fillRect(p.x - s * 2.2, p.y - s * 2.2, s * 4.4, s * 4.4);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  const R = (a, b) => a + Math.random() * (b - a);
  FX.burst = (x, y, { n = 30, colors = ['#fff'], speed = 420, life = 0.9, size = 4, grav = 600, shape = 'spark', drag = 0.94, spread = Math.PI * 2, dir = 0 } = {}) => {
    if (M.reduceMotion) n = Math.ceil(n / 3);
    if (FX.parts.length > 900) n = Math.min(n, 10);
    for (let i = 0; i < n; i++) {
      const a = dir + R(-spread / 2, spread / 2), v = R(0.25, 1) * speed;
      FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: R(life * 0.5, life), s: R(size * 0.5, size * 1.3), c: colors[i % colors.length], grav, drag, shape, rot: R(0, 6), vr: R(-10, 10), a: 1 });
    }
  };
  FX.ring = (x, y, c = '#fff', r1 = 120, life = 0.6, w = 8) => FX.rings.push({ x, y, c, r0: 10, r1, life, w, t: 0 });
  FX.confetti = (n = 160) => {
    const cols = ['#ff5a3c', '#3cb4ff', '#43e27a', '#b46bff', '#ffd166', '#ffffff'];
    for (let i = 0; i < n; i++) FX.parts.push({ x: R(0, W), y: R(-80, -10), vx: R(-60, 60), vy: R(100, 320), t: 0, life: R(2.5, 4.5), s: R(4, 8), c: cols[i % cols.length], grav: 120, drag: 0.995, shape: 'rect', rot: R(0, 6), vr: R(-8, 8), a: 1 });
  };
  FX.at = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* tremor */
  FX.shake = (amt = 6, dur = 300) => {
    if (!M.profile || !M.profile.settings.shake || M.reduceMotion) return;
    const el = document.getElementById('stage'); if (!el) return;
    const t0 = performance.now();
    const f = (now) => {
      const k = (now - t0) / dur;
      if (k >= 1) { el.style.transform = ''; return; }
      const a = amt * (1 - k);
      el.style.transform = `translate(${R(-a, a)}px,${R(-a, a)}px) rotate(${R(-a, a) * 0.05}deg)`;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };

  /* texto flutuante */
  FX.float = (x, y, text, cls = '') => {
    const d = document.createElement('div');
    d.className = 'floater ' + cls; d.innerHTML = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.getElementById('floaters').appendChild(d);
    setTimeout(() => d.remove(), 1300);
  };
  FX.floatEl = (el, text, cls = '') => { const [x, y] = FX.at(el); FX.float(x + (Math.random() * 30 - 15), y - 10 - Math.random() * 18, text, cls); };

  /* anúncio grande no centro */
  FX.announce = (text, cls = '', dur = 1100) => {
    const d = document.createElement('div');
    d.className = 'announce ' + cls; d.innerHTML = `<span>${text}</span>`;
    document.getElementById('floaters').appendChild(d);
    setTimeout(() => d.classList.add('out'), dur);
    setTimeout(() => d.remove(), dur + 500);
  };
})();
