// ============================================================
//  Keyword Game — pick a topic, spread the words/pictures evenly
//  on screen, click words to make them keywords (as many as you like).
// ============================================================
'use strict';

const $ = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const rand = (a, b) => a + Math.random() * (b - a);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const state = {
  topic: null,
  items: [],          // [{ id, word, src }] in current on-screen order
  keywords: [],       // chosen ids, in the order they were picked
  view: 'both',       // both | words | pics
  busy: false
};

// ------------------------------------------------------------ sound (tiny WebAudio blips)
const Sound = {
  ctx: null, muted: false,
  init() {
    try { this.muted = localStorage.getItem('keywordMuted') === '1'; } catch (e) {}
    this.updateIcons();
  },
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('keywordMuted', this.muted ? '1' : '0'); } catch (e) {}
    this.updateIcons();
    if (!this.muted) this.tone(660, 0.1, 'triangle', 0.1);
  },
  updateIcons() {
    const on = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff" stroke="none"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';
    const off = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/></svg>';
    ['menuSound', 'gameSound'].forEach(id => { $(id).innerHTML = this.muted ? off : on; });
  },
  tone(f, d, type = 'sine', v = 0.12, delay = 0, slide) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + d + 0.05);
  },
  hover() { this.tone(1300, 0.03, 'sine', 0.025); },
  click() { this.tone(800, 0.05, 'triangle', 0.1); },
  select() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.13, i * 0.06)); this.tone(1568, 0.3, 'sine', 0.05, 0.22); },
  clear() { this.tone(520, 0.14, 'triangle', 0.1, 0, 250); },
  shuffle() { for (let i = 0; i < 6; i++) this.tone(300 + i * 90, 0.06, 'square', 0.035, i * 0.045); },
  tick(i = 0) { this.tone(900 + i * 25, 0.04, 'square', 0.05); },
  pop() { this.tone(420, 0.1, 'sine', 0.1, 0, 760); }
};

// ------------------------------------------------------------ confetti on a canvas overlay
const FX = {
  c: $('fx'), g: null, parts: [], running: false,
  init() {
    this.g = this.c.getContext('2d');
    const fit = () => { this.c.width = innerWidth * devicePixelRatio; this.c.height = innerHeight * devicePixelRatio; };
    fit(); addEventListener('resize', fit);
  },
  burst(x, y, n = 60) {
    const cols = ['#ffc400', '#ff4d6d', '#2fb7ff', '#4cd964', '#a66bff', '#ff8a1a', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(260, 820);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 260, g: 1500, life: 0, max: rand(0.9, 1.6),
        s: rand(8, 15), r: rand(0, 6), vr: rand(-12, 12), c: cols[i % cols.length], star: i % 4 === 0, flip: rand(0, 6)
      });
    }
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
  },
  loop(now) {
    const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now;
    const g = this.g, k = devicePixelRatio;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.c.width, this.c.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    this.parts = this.parts.filter(p => (p.life += dt) < p.max);
    for (const p of this.parts) {
      p.vy += p.g * dt; p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 0.6 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.flip += dt * 9;
      const t = p.life / p.max;
      g.save();
      g.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      g.translate(p.x, p.y); g.rotate(p.r);
      g.fillStyle = p.c;
      if (p.star) {
        g.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? p.s * 0.45 : p.s; const a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.fill();
      } else {
        g.scale(Math.cos(p.flip), 1);
        g.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6);
      }
      g.restore();
    }
    if (this.parts.length) requestAnimationFrame(t => this.loop(t));
    else { this.running = false; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.c.width, this.c.height); }
  }
};

// ------------------------------------------------------------ layout: spread tiles evenly, as big as possible
const GAP_RATIO = 0.035;

// Choose the number of rows that makes the tiles biggest, then split the tiles across the rows as
// evenly as possible (e.g. 13 → 5 + 4 + 4, never 6 + 6 + 1).
function bestLayout(n, W, H, ratio, maxW = 460) {
  let best = null;
  const gap = Math.max(10, Math.min(W, H) * GAP_RATIO);
  for (let rows = 1; rows <= n; rows++) {
    const cols = Math.ceil(n / rows);
    const w0 = (W - (cols - 1) * gap) / cols;
    const h0 = (H - (rows - 1) * gap) / rows;
    const w = Math.min(w0, h0 * ratio, maxW);
    if (w < 40) continue;
    if (!best || w > best.w + 0.5) best = { rows, cols, w, h: w / ratio, gap };
  }
  best = best || { rows: n, cols: 1, w: 60, h: 60 / ratio, gap };
  const base = Math.floor(n / best.rows), extra = n % best.rows;
  best.counts = Array.from({ length: best.rows }, (_, i) => base + (i < extra ? 1 : 0));
  return best;
}

// Longest word first: shrink the font so every word fits its tile
const measure = document.createElement('canvas').getContext('2d');
function fitFont(words, boxW, maxPx) {
  measure.font = '700 100px Fredoka, system-ui, sans-serif';
  let widest = 1;
  for (const w of words) widest = Math.max(widest, measure.measureText(w).width);
  return Math.min(maxPx, (boxW / widest) * 100);
}

function layoutArea(area, n, ratio, wordsOf, mode) {
  const cs = getComputedStyle(area);
  const W = area.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const H = area.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const L = bestLayout(n, W, H, ratio);
  // place the tiles into balanced rows (re-parenting must not replay the pop-in animation)
  const tilesIn = [...area.querySelectorAll('.tile, .topic')];
  if (area.dataset.laid) tilesIn.forEach(t => t.classList.add('no-anim'));
  area.dataset.laid = '1';
  const rowEls = [];
  let at = 0;
  L.counts.forEach(c => { const r = el('div', 'row'); tilesIn.slice(at, at + c).forEach(t => r.appendChild(t)); at += c; rowEls.push(r); });
  area.replaceChildren(...rowEls);
  area.style.setProperty('--gap', `${L.gap}px`);
  area.style.setProperty('--tw', `${L.w}px`);
  area.style.setProperty('--th', `${L.h}px`);
  let fs;
  if (mode === 'words') fs = fitFont(wordsOf, L.w * 0.88, L.h * 0.34);
  else fs = fitFont(wordsOf, L.w * 0.9, L.h * 0.17);
  area.style.setProperty('--fs', `${Math.floor(fs)}px`);
  return L;
}

const viewRatio = () => (state.view === 'words' ? 1.7 : state.view === 'pics' ? 1 : 0.88);

// ------------------------------------------------------------ menu
function buildMenu() {
  const grid = $('topicGrid');
  grid.innerHTML = '';
  delete grid.dataset.laid;
  TOPICS.forEach((t, i) => {
    const b = el('button', 'topic');
    b.style.setProperty('--c', t.accent);
    b.style.setProperty('--i', i);
    b.innerHTML = `<span class="thumb"><img alt="" src="${imgFor(t, t.items[0])}"></span><span class="name">${t.label}</span>`;
    b.addEventListener('click', () => { Sound.unlock(); Sound.pop(); openTopic(t, b); });
    b.addEventListener('pointerenter', () => Sound.hover());
    grid.appendChild(b);
  });
  layoutMenu();
}
function layoutMenu() {
  const grid = $('topicGrid');
  layoutArea(grid, TOPICS.length, 1.02, TOPICS.map(t => t.label), 'both');
}

// ------------------------------------------------------------ game board
function openTopic(topic, fromEl) {
  state.topic = topic;
  state.keywords = [];
  state.items = shuffle(topic.items).map(id => ({ id, word: wordFor(id), src: imgFor(topic, id) }));
  const root = document.documentElement.style;
  root.setProperty('--accent', topic.accent);
  root.setProperty('--accent-dark', mix(topic.accent, '#000', 0.42));
  root.setProperty('--accent-light', mix(topic.accent, '#fff', 0.9));
  $('barTitle').textContent = topic.label;
  $('menu').classList.add('hidden');
  $('game').classList.remove('hidden');
  updateBanner();
  renderBoard(true);
  if (fromEl) { const r = fromEl.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, 14); }
}

function backToMenu() {
  Sound.click();
  state.topic = null;
  state.keywords = [];
  const root = document.documentElement.style;
  ['--accent', '--accent-dark', '--accent-light'].forEach(p => root.removeProperty(p));
  $('game').classList.add('hidden');
  $('menu').classList.remove('hidden');
  buildMenu();
}

function renderBoard(animate) {
  const board = $('board');
  board.innerHTML = '';
  delete board.dataset.laid;
  board.className = 'tile-area board' + (state.keywords.length ? ' has-key' : '');
  state.items.forEach((it, i) => {
    const t = el('button', `tile view-${state.view}${animate ? '' : ' no-anim'}${state.keywords.includes(it.id) ? ' sel' : ''}`);
    t.dataset.id = it.id;
    t.style.setProperty('--i', i);
    t.setAttribute('aria-label', it.word);
    t.innerHTML = `<span class="ribbon">★ KEYWORD ★</span><span class="pic"><img alt="" draggable="false" src="${it.src}"></span><span class="word"></span>`;
    t.querySelector('.word').textContent = it.word;
    t.addEventListener('click', () => toggleKeyword(it.id, t));
    t.addEventListener('pointerenter', () => { if (!state.busy) Sound.hover(); });
    board.appendChild(t);
  });
  layoutBoard();
}

function layoutBoard() {
  if (!state.topic) return;
  layoutArea($('board'), state.items.length, viewRatio(), state.items.map(i => i.word), state.view);
}

const isKey = id => state.keywords.includes(id);

// click a tile: add it to the keywords, or take it off again if it's already one
function toggleKeyword(id, tileEl) {
  if (state.busy) return;
  Sound.unlock();
  if (isKey(id)) { removeKeyword(id); return; }
  addKeyword(id, tileEl);
}

function addKeyword(id, tileEl) {
  if (isKey(id)) return;
  state.keywords.push(id);
  Sound.select();
  applySelection();
  if (tileEl) { const r = tileEl.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height * 0.35, 70); }
  updateBanner(id);
}

function removeKeyword(id) {
  if (!isKey(id)) return;
  state.keywords = state.keywords.filter(k => k !== id);
  Sound.clear();
  applySelection();
  updateBanner();
}

function clearKeywords() {
  if (!state.keywords.length) return;
  state.keywords = [];
  Sound.clear();
  applySelection();
  updateBanner();
}

function applySelection() {
  const board = $('board');
  board.classList.toggle('has-key', state.keywords.length > 0);
  board.querySelectorAll('.tile').forEach(t => {
    t.classList.remove('spot');
    const sel = isKey(t.dataset.id);
    if (sel && !t.classList.contains('sel')) { t.classList.remove('no-anim'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
    t.classList.toggle('sel', sel);
  });
}

// banner: one chip per keyword (click a chip to remove it); `added` = the id that just joined (gets the pop)
function updateBanner(added) {
  const b = $('keyBanner');
  const chosen = state.keywords.map(id => state.items.find(i => i.id === id)).filter(Boolean);
  const wasEmpty = !b.classList.contains('has-key');
  b.classList.toggle('has-key', chosen.length > 0);
  b.classList.toggle('multi', chosen.length > 1);
  b.querySelector('.kb-label').textContent = chosen.length > 1 ? `★ KEYWORDS ×${chosen.length} ★` : '★ KEYWORD ★';
  const list = b.querySelector('.kb-list');
  list.replaceChildren(...chosen.map(it => {
    const c = el('button', 'kb-item' + (it.id === added ? ' pop' : ''));
    c.title = `Remove "${it.word}"`;
    c.setAttribute('aria-label', `Remove keyword ${it.word}`);
    c.innerHTML = '<img class="kb-img" alt=""><span class="kb-word"></span>';
    c.querySelector('img').src = it.src;
    c.querySelector('.kb-word').textContent = it.word;
    c.addEventListener('click', e => { e.stopPropagation(); if (!state.busy) removeKeyword(it.id); });
    return c;
  }));
  if (chosen.length && wasEmpty) {
    const box = b.querySelector('.kb-chosen');
    box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
  }
  fitBanner();
}

// shrink the banner words until every chosen keyword fits on one line
function fitBanner() {
  const list = $('keyBanner').querySelector('.kb-list');
  if (!list.children.length) return;
  const max = Math.max(30, Math.min(72, innerHeight * 0.064));
  let fs = max;
  list.style.setProperty('--kbfs', fs + 'px');
  while (list.scrollWidth > list.clientWidth + 1 && fs > 13) {
    fs *= 0.92;
    list.style.setProperty('--kbfs', fs + 'px');
  }
}

// shuffle with a smooth "FLIP" animation: tiles glide to their new places
function shuffleBoard() {
  if (state.busy || !state.topic) return;
  Sound.unlock();
  Sound.shuffle();
  const board = $('board');
  const tiles = [...board.querySelectorAll('.tile')];
  const first = new Map(tiles.map(t => [t, t.getBoundingClientRect()]));
  state.items = shuffle(state.items);
  const byId = new Map(tiles.map(t => [t.dataset.id, t]));
  state.items.forEach((it, i) => { const t = byId.get(it.id); t.style.setProperty('--i', i); board.appendChild(t); });
  layoutBoard();
  tiles.forEach(t => {
    t.classList.add('no-anim');
    const a = first.get(t), b = t.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    const base = t.classList.contains('sel') ? 1.07 : 1;
    t.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${base})` },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 24}px) scale(${base * 1.08}) rotate(${rand(-6, 6)}deg)`, offset: 0.5 },
      { transform: `translate(0,0) scale(${base})` }
    ], { duration: 650, easing: 'cubic-bezier(0.3, 0.8, 0.3, 1)' });
  });
}

// "Pick one": a quick roulette over the tiles that aren't keywords yet, and adds the winner
function pickRandom() {
  if (state.busy || !state.topic) return;
  Sound.unlock();
  let tiles = [...$('board').querySelectorAll('.tile')].filter(t => !isKey(t.dataset.id));
  if (!tiles.length) {                                     // everything is already a keyword: start over
    state.keywords = []; applySelection(); updateBanner();
    tiles = [...$('board').querySelectorAll('.tile')];
  }
  state.busy = true;
  if (tiles.length === 1) { state.busy = false; addKeyword(tiles[0].dataset.id, tiles[0]); return; }
  const target = Math.floor(Math.random() * tiles.length);
  const steps = tiles.length * 2 + target;               // ends exactly on the target
  let k = 0, delay = 60;
  const run = () => {
    tiles.forEach(t => t.classList.remove('spot'));
    const t = tiles[k % tiles.length];
    t.classList.add('spot');
    Sound.tick(k % 12);
    if (k >= steps) {
      setTimeout(() => {
        state.busy = false;
        t.classList.remove('spot');
        addKeyword(t.dataset.id, t);
      }, delay);
      return;
    }
    k++;
    delay *= k > steps - 6 ? 1.35 : 1.02;
    setTimeout(run, delay);
  };
  run();
}

function setView(v) {
  if (state.view === v) return;
  state.view = v;
  Sound.click();
  $('keyBanner').querySelector('.kb-hint').textContent = v === 'pics' ? 'Click pictures to make them keywords' : 'Click words to make them keywords';
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  document.querySelectorAll('#board .tile').forEach(t => {
    t.classList.remove('view-both', 'view-words', 'view-pics');
    t.classList.add('view-' + v, 'no-anim');
  });
  layoutBoard();
}

// ------------------------------------------------------------ helpers
function mix(hexA, hexB, t) {
  const p = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const a = p(hexA), b = p(hexB);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function toggleFullscreen() {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {}
}
const FULL_ICON = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

// ------------------------------------------------------------ boot
Sound.init();
FX.init();
$('menuFull').innerHTML = $('gameFull').innerHTML = FULL_ICON;
$('menuSound').addEventListener('click', () => { Sound.unlock(); Sound.toggle(); });
$('gameSound').addEventListener('click', () => { Sound.unlock(); Sound.toggle(); });
$('menuFull').addEventListener('click', toggleFullscreen);
$('gameFull').addEventListener('click', toggleFullscreen);
$('btnBack').addEventListener('click', backToMenu);
$('btnShuffle').addEventListener('click', shuffleBoard);
$('btnRandom').addEventListener('click', pickRandom);
$('btnClear').addEventListener('click', e => { e.stopPropagation(); if (!state.busy) clearKeywords(); });
document.querySelectorAll('#viewSeg button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

addEventListener('resize', () => { state.topic ? (layoutBoard(), fitBanner()) : layoutMenu(); });
document.addEventListener('fullscreenchange', () => setTimeout(() => { state.topic ? layoutBoard() : layoutMenu(); }, 60));

addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'm') { Sound.unlock(); Sound.toggle(); }
  else if (k === 'f') toggleFullscreen();
  else if (state.topic) {
    if (k === 'escape') { if (state.busy) return; state.keywords.length ? clearKeywords() : backToMenu(); }
    else if (k === 'backspace') { if (!state.busy && state.keywords.length) removeKeyword(state.keywords[state.keywords.length - 1]); }
    else if (k === 's') shuffleBoard();
    else if (k === 'r') pickRandom();
    else if (k === '1') setView('both');
    else if (k === '2') setView('words');
    else if (k === '3') setView('pics');
  }
});

buildMenu();
// fonts load a moment after first paint: re-measure so labels fit exactly
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { state.topic ? layoutBoard() : layoutMenu(); });
