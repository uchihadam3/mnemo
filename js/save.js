/* MNEMO — salvamento: perfil (progresso permanente) e jornada em andamento */
'use strict';
(function () {
  const PK = 'mnemo.profile.v1', RK = 'mnemo.run.v1';
  const S = M.save = {};

  const defaultProfile = () => ({
    v: 1, xp: 0, level: 1,
    unlocked: { decks: ['classico'], relics: [], backs: ['mandala'] },
    seen: { relics: {}, scrolls: {}, astros: {}, bosses: {}, tags: {}, vouchers: {} },
    ach: {},
    stats: { runs: 0, wins: 0, bestAnte: 0, bestCombo: 0, pairs: 0, bestPair: 0, bestRound: 0, scrolls: 0, astros: 0, bosses: 0, glass: 0, maxMoney: 0, playTime: 0, mismatches: 0 },
    stakeWon: 0, // maior selo vencido
    deckWins: {},
    daily: { date: '', bestAnte: 0, bestScore: 0, played: false },
    settings: { sfx: 0.7, music: 0.45, speed: 1, shake: true, crt: true, back: 'mandala', fastHide: false, reduceMotion: false },
    created: Date.now(),
    tutorial: false,
  });

  function merge(def, obj) {
    if (!obj || typeof obj !== 'object') return def;
    for (const k of Object.keys(def)) {
      if (obj[k] === undefined) obj[k] = def[k];
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) merge(def[k], obj[k]);
    }
    return obj;
  }

  S.loadProfile = () => {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PK)); } catch (e) { }
    M.profile = merge(defaultProfile(), p || {});
    return M.profile;
  };
  S.saveProfile = () => { try { localStorage.setItem(PK, JSON.stringify(M.profile)); } catch (e) { } };

  S.saveRun = () => {
    if (!M.run) return;
    try {
      const r = M.run;
      const data = JSON.stringify(r, (k, v) => (k.startsWith('_') ? undefined : v));
      localStorage.setItem(RK, data);
    } catch (e) { console.warn('save fail', e); }
  };
  S.loadRun = () => { try { const r = JSON.parse(localStorage.getItem(RK)); return r && r.v === 1 ? r : null; } catch (e) { return null; } };
  S.hasRun = () => !!S.loadRun();
  S.clearRun = () => { try { localStorage.removeItem(RK); } catch (e) { } };

  S.exportAll = () => {
    const data = { p: M.profile, r: S.loadRun(), t: Date.now(), game: 'mnemo' };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  };
  S.importAll = (str) => {
    const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (data.game !== 'mnemo' || !data.p) throw new Error('inválido');
    localStorage.setItem(PK, JSON.stringify(data.p));
    if (data.r) localStorage.setItem(RK, JSON.stringify(data.r)); else S.clearRun();
    S.loadProfile();
  };
  S.resetAll = () => { localStorage.removeItem(PK); localStorage.removeItem(RK); S.loadProfile(); };

  /* ---------- desbloqueios ---------- */
  S.isRelicUnlocked = (id) => !M.RELIC[id].lock || M.profile.unlocked.relics.includes(id);
  S.isDeckUnlocked = (id) => M.profile.unlocked.decks.includes(id);
  S.isBackUnlocked = (id) => M.profile.unlocked.backs.includes(id);

  // retorna lista de textos do que foi desbloqueado
  S.grant = (u) => {
    const out = [];
    const P = M.profile.unlocked;
    if (u.relic && !P.relics.includes(u.relic)) { P.relics.push(u.relic); out.push({ kind: 'Relíquia', name: M.RELIC[u.relic].n, icon: M.RELIC[u.relic].i }); }
    if (u.deck && !P.decks.includes(u.deck)) { P.decks.push(u.deck); out.push({ kind: 'Baralho', name: M.DECK[u.deck].n, icon: '🂠' }); }
    if (u.back && !P.backs.includes(u.back)) { P.backs.push(u.back); const b = M.BACKS.find(b => b.id === u.back); out.push({ kind: 'Verso de carta', name: b.n, icon: '🎴' }); }
    return out;
  };

  S.achieve = (id) => {
    if (M.profile.ach[id]) return false;
    M.profile.ach[id] = Date.now();
    const a = M.ACH[id];
    const got = a.unlock ? S.grant(a.unlock) : [];
    S.saveProfile();
    M.ui && M.ui.toastAch(a, got);
    return true;
  };

  S.addXP = (n) => {
    const P = M.profile; const ups = [];
    P.xp += n;
    while (P.xp >= M.xpForLevel(P.level)) {
      P.xp -= M.xpForLevel(P.level); P.level++;
      const rw = M.LEVEL_REWARDS[P.level];
      ups.push({ level: P.level, got: rw ? S.grant(rw) : [] });
    }
    S.saveProfile();
    return ups;
  };

  S.seen = (kind, id) => { if (!M.profile.seen[kind][id]) { M.profile.seen[kind][id] = 1; S.saveProfile(); } };
})();
