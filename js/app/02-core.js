const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'moonlight-studio-v1';
const RULERS_KEY = 'moonlight-rulers-v1';
const STYLE_KEY = 'moonlight-style-v1';
const S = {
  sec: {},
  draw: {mode: null, color: '#ffffff', cs: 12, mirror: 'off'},
  rulers: true,
  style: 'normal',
  brand: {
    colors: ['#050d2b', '#0b2a8a', '#1a5cff', '#3fe0ff', '#d6f8ff', '#ffffff', '#ffd84a', '#ff3d6e'],
    fonts: ['Press Start 2P', 'Silkscreen', 'VT323'],
  },
  brandDel: false,
  brandTarget: 'fill',
  msSel: [true, true, false, false, false, false, false, false],
  name: 'Sin título',
  w: 1080,
  h: 1080,
  pages: [],
  cur: 0,
  sel: [],
  zoom: 0.5,
  fit: true,
  grid: false,
  snap: true,
  tab: 'templates',
  active: false,
  guides: [],
  uploads: [],
  conv: {fmt: 'jpg', pages: 'cur', scale: 1, q: 92, fitpdf: true},
};
let uid = 1,
  hist = [],
  fut = [],
  lastTouch = 0,
  clip = [],
  editing = null,
  saveT = 0;
const cv = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const pg = () => S.pages[S.cur],
  els = () => pg().els,
  findEl = i => els().find(e => e.id === i);
const selEls = () => S.sel.map(findEl).filter(Boolean),
  prim = () => findEl(S.sel[0]);
const toast = m => {
  $('#toast').textContent = m;
  const f = $('#flash');
  f.textContent = m;
  f.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    $('#toast').textContent = '';
    f.classList.remove('on');
  }, 3200);
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const slug = (text, fallback = 'diseno') =>
  (text || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

// Model
const defaultBg = () =>
  S.style === 'pixel'
    ? {pat: 'gradient', c1: '#0b2a8a', c2: '#3fe0ff'}
    : {pat: 'solid', c1: '#ffffff', c2: '#ffffff'};
function newPage(bg) {
  return {bg: bg || defaultBg(), els: []};
}
function mk(type, o = {}) {
  const e = {
    id: 'e' + uid++,
    type,
    x: 0,
    y: 0,
    w: 300,
    h: 300,
    rot: 0,
    fill: '#3fe0ff',
    stroke: '#ffffff',
    sw: 0,
    op: 1,
    px: 6,
    shadow: false,
    sc: '#050d2b',
    sd: 8,
    hidden: false,
    locked: false,
    th: 20,
    blend: 'normal',
  };
  if (type === 'text')
    Object.assign(e, {
      text: 'Texto',
      font: 'Press Start 2P',
      size: 48,
      bold: false,
      italic: false,
      align: 'left',
      lh: 1.3,
      ls: 0,
      fill: '#ffffff',
      w: 520,
      h: 70,
    });
  if (type === 'line' || type === 'arrowl') Object.assign(e, {w: 420, h: 40, sw: 12, px: 4});
  if (type === 'qr')
    Object.assign(e, {w: 360, h: 360, text: 'https://ejemplo.com', fill: '#020821', bgc: '#ffffff', px: 1});
  if (type === 'chart')
    Object.assign(e, {
      w: 640,
      h: 420,
      ctype: 'bar',
      cdata: 'Lun,12\nMar,19\nMié,8\nJue,15\nVie,22',
      fill: '#ffffff',
      px: 2,
    });
  if (type === 'sprite') {
    const r = SPR[o.spr || 'star'];
    Object.assign(e, {spr: o.spr || 'star', w: r[0].length * 14, h: r.length * 14});
  }
  return Object.assign(e, o);
}
function add(e, center = true) {
  if (center && e.type !== 'text') {
    const k = Math.min(1, (S.w * 0.8) / e.w, (S.h * 0.8) / e.h);
    if (k < 1) {
      e.w = Math.round(e.w * k);
      e.h = Math.round(e.h * k);
    }
  }
  if (center) {
    e.x = Math.round((S.w - e.w) / 2);
    e.y = Math.round((S.h - e.h) / 2);
  }
  touch(true);
  els().push(e);
  S.sel = [e.id];
  if (e.type === 'text' && !e.h) e.h = 60;
  refresh({props: true});
  return e;
}
const IMG_REF = '@img:';
const imageRefs = new Map();
const imageById = [];
function refImage(src) {
  let id = imageRefs.get(src);
  if (id === undefined) {
    id = imageById.push(src) - 1;
    imageRefs.set(src, id);
  }
  return id;
}
const compactImages = (key, value) =>
  typeof value === 'string' && value.length > 1024 && value.startsWith('data:image')
    ? IMG_REF + refImage(value)
    : value;
const expandImages = (key, value) =>
  typeof value === 'string' && value.startsWith(IMG_REF) ? imageById[+value.slice(IMG_REF.length)] : value;
function snapshot(forHistory = false) {
  const state = {name: S.name, w: S.w, h: S.h, cur: S.cur, pages: S.pages};
  return JSON.stringify(state, forHistory ? compactImages : undefined);
}
function resetHistory() {
  hist = [];
  fut = [];
  imageRefs.clear();
  imageById.length = 0;
}
function touch(force) {
  const n = Date.now();
  if (force || n - lastTouch > 600) {
    hist.push(snapshot(true));
    if (hist.length > 100) hist.shift();
    fut = [];
    updHist();
  }
  lastTouch = n;
  scheduleSave();
}
function restore(js) {
  const o = JSON.parse(js, expandImages);
  S.name = o.name || 'Sin título';
  S.w = o.w;
  S.h = o.h;
  S.pages = o.pages;
  S.cur = clamp(o.cur || 0, 0, o.pages.length - 1);
  uid = 1 + Math.max(0, ...S.pages.flatMap(p => p.els.map(e => +String(e.id).slice(1) || 0)));
  S.sel = S.sel.filter(findEl);
  $('#name').value = S.name;
}
function undo() {
  if (!hist.length) return;
  fut.push(snapshot(true));
  restore(hist.pop());
  lastTouch = 0;
  updHist();
  refresh({props: true, panel: true, fit: true});
}
function redo() {
  if (!fut.length) return;
  hist.push(snapshot(true));
  restore(fut.pop());
  lastTouch = 0;
  updHist();
  refresh({props: true, panel: true, fit: true});
}
function updHist() {
  $('#undo').disabled = !hist.length;
  $('#redo').disabled = !fut.length;
}
function scheduleSave() {
  if (!S.active) return;
  clearTimeout(saveT);
  saveT = setTimeout(save, 900);
}
const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};
const rulersPref = store.get(RULERS_KEY);
S.rulers = rulersPref === null ? !matchMedia('(max-width: 720px)').matches : rulersPref !== '0';
function save(manual) {
  if (!S.active) return;
  const st = $('#savest');
  if (!store.set(KEY, snapshot())) {
    if (manual || !st.classList.contains('bad')) toast('No se pudo guardar: memoria local llena');
    st.classList.add('bad');
    st.textContent = 'Sin guardar: memoria llena';
    return;
  }
  const d = new Date();
  st.classList.remove('bad');
  st.textContent =
    'Guardado ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (manual) toast('Guardado en este navegador');
}
