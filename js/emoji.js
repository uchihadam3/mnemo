/* MNEMO — figuras 3D (Microsoft Fluent Emoji, licença MIT) no lugar dos emojis do sistema */
'use strict';
(function () {
  M.EMOJI = {"🐘": "1f418", "🦉": "1f989", "🍀": "1f340", "🔥": "1f525", "🐚": "1f41a", "🌿": "1f33f", "✨": "2728", "🧮": "1f9ee", "🎗": "1f397", "🐈": "1f408", "🐢": "1f422", "⚡": "26a1", "🐷": "1f437", "🎭": "1f3ad", "💡": "1f4a1", "🗺": "1f5fa", "🧤": "1f9e4", "🍿": "1f37f", "🔗": "1f517", "🛡": "1f6e1", "⏳": "23f3", "❤‍🩹": "2764-200d-1fa79", "🔋": "1f50b", "🥚": "1f95a", "🔮": "1f52e", "🧲": "1f9f2", "🔍": "1f50d", "🪞": "1fa9e", "🎲": "1f3b2", "🙈": "1f648", "🌈": "1f308", "💍": "1f48d", "🌠": "1f320", "🐙": "1f419", "🚀": "1f680", "♊": "264a", "🖋": "1f58b", "👁": "1f441", "🧭": "1f9ed", "💀": "1f480", "👑": "1f451", "💣": "1f4a3", "🦇": "1f987", "🪶": "1fab6", "🎼": "1f3bc", "🌑": "1f311", "⚗": "2697", "⚒": "2692", "🐍": "1f40d", "🕰": "1f570", "🐉": "1f409", "🎡": "1f3a1", "📜": "1f4dc", "🔆": "1f506", "🩻": "1fa7b", "🧪": "1f9ea", "🧿": "1f9ff", "🎯": "1f3af", "🟠": "1f7e0", "🪙": "1fa99", "🥃": "1f943", "🔷": "1f537", "🔴": "1f534", "🧧": "1f9e7", "🔩": "1f529", "🪨": "1faa8", "🕳": "1f573", "👯": "1f46f", "💠": "1f4a0", "💰": "1f4b0", "⚖": "2696", "🔵": "1f535", "🟢": "1f7e2", "🪐": "1fa90", "⚫": "26ab", "🌫": "1f32b", "🌀": "1f300", "🩶": "1fa76", "⌛": "231b", "🦝": "1f99d", "🌘": "1f318", "🧱": "1f9f1", "🎁": "1f381", "👻": "1f47b", "⏰": "23f0", "🏰": "1f3f0", "🪩": "1faa9", "🌊": "1f30a", "🌒": "1f312", "🦑": "1f991", "💎": "1f48e", "🌌": "1f30c", "🏦": "1f3e6", "🏷": "1f3f7", "🔁": "1f501", "🏺": "1f3fa", "🃏": "1f0cf", "⚔": "2694", "☄": "2604", "♾": "267e", "🏆": "1f3c6", "💸": "1f4b8", "🧠": "1f9e0", "🎰": "1f3b0", "🔭": "1f52d", "💥": "1f4a5", "🎖": "1f396", "😇": "1f607", "⏱": "23f1", "📅": "1f4c5", "🤑": "1f911", "🗡": "1f5e1", "🗝": "1f5dd", "💖": "1f496", "🌸": "1f338", "📚": "1f4da", "🌲": "1f332", "🏛": "1f3db", "📖": "1f4d6", "📊": "1f4ca", "❤": "2764", "🔒": "1f512", "✅": "2705", "🎴": "1f3b4", "⭐": "2b50", "👹": "1f479", "🎮": "1f3ae", "❌": "274c", "🌙": "1f319", "🎉": "1f389", "🚩": "1f6a9", "🏁": "1f3c1", "👸": "1f478", "🌟": "1f31f", "🪄": "1fa84"};
  const keys = Object.keys(M.EMOJI).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // cada caractere pode vir seguido do seletor de variação FE0F
  const RX = new RegExp('(' + keys.map(k => [...k].map(ch => esc(ch) + '\ufe0f?').join('')).join('|') + ')', 'g');
  const norm = (s) => s.replace(/\ufe0f/g, '');
  M.emoSrc = (e) => { const c = M.EMOJI[norm(e)]; return c ? `assets/emoji/${c}.webp` : null; };
  M.emoImg = (e, cls = '') => { const s = M.emoSrc(e); return s ? `<img class="emo ${cls}" src="${s}" alt="${e}" draggable="false">` : e; };
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, TITLE: 1 };
  M.emojify = (root) => {
    if (!root) return;
    if (root.nodeType === 3) { swap(root); return; }
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = [];
    while (w.nextNode()) { const n = w.currentNode; RX.lastIndex = 0; if (RX.test(n.nodeValue) && !SKIP[n.parentNode.tagName]) list.push(n); }
    list.forEach(swap);
  };
  function swap(node) {
    const t = node.nodeValue; RX.lastIndex = 0;
    if (!node.parentNode || SKIP[node.parentNode.tagName] || !RX.test(t)) return;
    RX.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = RX.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const img = document.createElement('img');
      img.className = 'emo'; img.src = M.emoSrc(m[0]); img.alt = m[0]; img.draggable = false;
      frag.appendChild(img);
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  // observa a tela inteira e troca o que aparecer
  let queue = [], scheduled = false;
  const flush = () => { scheduled = false; const q = queue; queue = []; q.forEach(n => { if (n.isConnected) M.emojify(n); }); };
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach(n => { if (!(n.nodeType === 1 && n.tagName === 'IMG')) queue.push(n); });
    if (queue.length && !scheduled) { scheduled = true; queueMicrotask(flush); }
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => M.emojify(document.body));
})();
