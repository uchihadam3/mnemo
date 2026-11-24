/* MNEMO — inicialização e entrada */
'use strict';
(function () {
  M.VERSION = '1.3.0';
  const $ = M.$;

  M.applySettings = () => {
    const S = M.profile.settings;
    M.speed = S.speed || 1;
    M.reduceMotion = !!S.reduceMotion;
    M.audio.setVol(S.sfx, S.music);
    document.body.classList.toggle('crt', !!S.crt);
    document.body.classList.toggle('rm', !!S.reduceMotion);
  };

  M.continueRun = () => {
    const data = M.save.loadRun();
    if (!data) { M.ui.show('menu'); return; }
    M.game.restore(data);
    const run = M.run;
    switch (run.phase) {
      case 'round': if (run.rs && run.rs.cards && run.rs.cards.length) { M.board.resume(); } else { run.phase = 'select'; M.ui.show('select'); } break;
      case 'shop': if (!run.shop) M.game.openShop(); M.ui.show('shop'); break;
      case 'cashout': M.ui.show('cashout'); break;
      case 'victory': M.ui.show('victory'); break;
      case 'over': M.ui.show('gameover'); break;
      default: M.ui.show('select');
    }
  };

  function boot() {
    M.save.loadProfile();
    M.bg.init($('#bg'));
    M.fx.init($('#fx'));
    M.applySettings();
    M.ui.show('menu');

    // primeiro gesto libera o áudio
    // o navegador só libera som num gesto completo (toque solto, clique ou tecla)
    const unlock = () => { M.audio.unlock(); M.applySettings(); };
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, unlock, { passive: true, capture: true }));

    // cliques globais (delegação)
    document.addEventListener('click', (e) => {
      const t = e.target;
      const slot = t.closest('#board .slot');
      if (slot && M.board.lock) { M.board.previewSkip = true; return; }
      if (slot) { M.board.onClick(+slot.dataset.id); return; }
      if (t.closest('.preview-bar') || (t.closest('#board-area') && M.board.lock)) { M.board.previewSkip = true; }
      const act = t.closest('[data-act]');
      if (act) {
        e.stopPropagation();
        const [k, i] = act.dataset.act.split(':');
        M.audio.play('click');
        if (act.classList.contains('selected')) { M.ui.closePop(); return; }
        if (k === 'relic') M.ui.relicAction(+i, act);
        if (k === 'scroll') M.ui.scrollAction(+i, act);
        return;
      }
      if (!t.closest('#pop')) M.ui.closePop();
      const tipEl = t.closest('[data-tip]');
      if (tipEl && tipEl.tagName !== 'BUTTON' && M._lastPointer === 'touch' && !t.closest('button')) {
        const html = M.ui.tipFor(tipEl);
        if (html) { M.ui.showTip(tipEl, html); clearTimeout(M._tipT); M._tipT = setTimeout(M.ui.hideTip, 3500); return; }
      }
      const pk = t.closest('[data-h="peekbtn"]');
      if (pk) {
        const rs = M.run && M.run.rs;
        if (rs && rs.visl > 0 && rs.boss !== 'fantasma') { M.board.setPeek(!M.board.peekMode); M.audio.play('click'); }
        else M.fx.floatEl(pk, rs && rs.boss === 'fantasma' ? 'Bloqueado!' : 'Sem Vislumbres', 'bad');
        return;
      }
      const a2 = t.closest('[data-act2]');
      if (a2) {
        M.audio.play('click');
        const k = a2.dataset.act2;
        if (k === 'deck') M.ui.showDeck(); else if (k === 'info') M.ui.showRunInfo(); else if (k === 'pause') M.ui.showPause();
        return;
      }
      if (t.closest('.btn')) M.audio.play('click');
    });
    document.addEventListener('contextmenu', (e) => {
      const slot = e.target.closest('#board .slot');
      if (slot) { e.preventDefault(); M.board.onClick(+slot.dataset.id, true); }
    });

    // tooltips (desktop)
    let tipEl = null;
    document.addEventListener('pointerdown', (e) => { M._lastPointer = e.pointerType; }, { capture: true, passive: true });
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest('[data-tip]');
      if (el === tipEl) return;
      tipEl = el;
      if (!el || $('#pop')) { M.ui.hideTip(); return; }
      const html = M.ui.tipFor(el);
      if (html) { M.ui.showTip(el, html); M.audio.play('hover'); } else M.ui.hideTip();
    });

    // efeito de inclinação 3D das cartas
    document.addEventListener('pointermove', (e) => {
      if (M.reduceMotion || e.pointerType === 'touch') return;
      const c = e.target.closest('.slot .card, .mini-card .card, .relic, .consum, .pack, .voucher, .logo-card');
      if (M._tilt && M._tilt !== c) { M._tilt.style.removeProperty('--rx'); M._tilt.style.removeProperty('--ry'); M._tilt.style.removeProperty('--mx'); }
      M._tilt = c;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--rx', (-y * 18).toFixed(1) + 'deg');
      c.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg');
      c.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(0) + '%');
      c.style.setProperty('--my', ((y + 0.5) * 100).toFixed(0) + '%');
    });

    // teclado
    addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'Escape') {
        if (M.ui.overlayOpen()) { if (!$('.pack-open')) M.ui.closeOverlay(); return; }
        if (M.run && ['round', 'shop', 'select', 'cashout'].includes(M.ui.current())) M.ui.showPause();
        return;
      }
      if (M.ui.current() === 'round' && M.run && M.run.rs) {
        if (e.code === 'Space') { e.preventDefault(); M.ui.hAnchor('peekbtn')?.click(); }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 5 && M.run.scrolls[n - 1]) M.board.useScroll(n - 1);
      }
      if (e.key === 'F11' && window.mnemoNative) { e.preventDefault(); window.mnemoNative.toggleFullscreen(); }
    });

    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { M.board.layout(); }, 80); });

    // salva ao sair
    addEventListener('beforeunload', () => { if (M.run) M.game.save(); M.save.saveProfile(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { if (M.run) M.game.save(); M.save.saveProfile(); } });

    // PWA
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); M.installPrompt = e; const b = $('#m-install'); if (b) { b.classList.remove('hidden'); b.onclick = async () => { e.prompt(); await e.userChoice; b.classList.add('hidden'); }; } });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

    setTimeout(() => document.body.classList.add('ready'), 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
