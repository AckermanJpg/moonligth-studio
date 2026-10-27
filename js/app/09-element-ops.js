// Element operations
function set(k, v) {
  const list = ['x', 'y', 'w', 'h'].includes(k) && S.sel.length > 1 ? [] : selEls();
  if (!list.length) return;
  touch();
  list.forEach(e => {
    e[k] = v;
  });
  refresh({});
}
function order(dir) {
  const L = els(),
    ids = S.sel.slice();
  touch(true);
  if (dir === 'front') {
    const s = L.filter(e => ids.includes(e.id));
    pg().els = [...L.filter(e => !ids.includes(e.id)), ...s];
  } else if (dir === 'back') {
    const s = L.filter(e => ids.includes(e.id));
    pg().els = [...s, ...L.filter(e => !ids.includes(e.id))];
  } else {
    const L2 = L.slice();
    const idx = L2.map((e, i) => (ids.includes(e.id) ? i : -1)).filter(i => i >= 0);
    if (dir === 'up')
      idx.reverse().forEach(i => {
        if (i < L2.length - 1 && !ids.includes(L2[i + 1].id)) [L2[i], L2[i + 1]] = [L2[i + 1], L2[i]];
      });
    else
      idx.forEach(i => {
        if (i > 0 && !ids.includes(L2[i - 1].id)) [L2[i], L2[i - 1]] = [L2[i - 1], L2[i]];
      });
    pg().els = L2;
  }
  refresh({});
}
function align(a) {
  const list = selEls();
  if (!list.length) return;
  touch(true);
  list.forEach(e => {
    if (a === 'l') e.x = 0;
    if (a === 'c') e.x = Math.round((S.w - e.w) / 2);
    if (a === 'r') e.x = S.w - e.w;
    if (a === 't') e.y = 0;
    if (a === 'm') e.y = Math.round((S.h - e.h) / 2);
    if (a === 'b') e.y = S.h - e.h;
  });
  refresh({props: true});
}
function dup() {
  const l = selEls();
  if (!l.length) return;
  touch(true);
  const gm = {},
    ns = l.map(e => {
      const n = {...JSON.parse(JSON.stringify(e)), id: 'e' + uid++, x: e.x + 30, y: e.y + 30};
      if (n.gid) n.gid = gm[n.gid] || (gm[n.gid] = 'g' + uid++);
      return n;
    });
  pg().els.push(...ns);
  S.sel = ns.map(e => e.id);
  refresh({props: true});
}
function del() {
  if (!S.sel.length) return;
  touch(true);
  pg().els = els().filter(e => !S.sel.includes(e.id));
  S.sel = [];
  refresh({props: true});
}
function copy() {
  clip = selEls().map(e => JSON.parse(JSON.stringify(e)));
  if (clip.length) toast('Copiado');
}
function paste() {
  if (!clip.length) return;
  touch(true);
  const gm = {},
    ns = clip.map(e => {
      const n = {...JSON.parse(JSON.stringify(e)), id: 'e' + uid++, x: e.x + 30, y: e.y + 30};
      if (n.gid) n.gid = gm[n.gid] || (gm[n.gid] = 'g' + uid++);
      return n;
    });
  clip = ns.map(e => ({...e, x: e.x, y: e.y}));
  pg().els.push(...ns);
  S.sel = ns.map(e => e.id);
  refresh({props: true});
}
function addImage(src, w, h, extra) {
  const k = Math.min((S.w * 0.6) / w, (S.h * 0.6) / h, 1);
  S.uploads.includes(src) || S.uploads.unshift(src);
  add(mk('image', {src, w: Math.round(w * k), h: Math.round(h * k), px: 1, ...extra}));
  if (S.tab === 'images') refresh({panel: true});
}
const LICENSE_NAMES = {by: 'CC BY', cc0: 'CC0', pdm: 'Marca de dominio público'};
function httpsUrl(u) {
  try {
    return new URL(u).protocol === 'https:' ? u : '';
  } catch {
    return '';
  }
}
function licenseName(c) {
  return `${LICENSE_NAMES[c.license] || String(c.license || '').toUpperCase()}${c.version ? ' ' + c.version : ''}`;
}
function isAdapted(e) {
  return !!(e.crop || e.px > 1 || (e.flt && Object.keys(e.flt).length));
}
function creditText(c, adapted) {
  return `"${c.title || 'Sin título'}" de ${c.creator || 'autor desconocido'}, ${licenseName(c)}, ${c.url}${adapted ? ', adaptada' : ''}`;
}
function creditHTML(c, adapted) {
  const link = (u, t) =>
    httpsUrl(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>` : esc(t);
  return `<p class="hint" id="credit">"${esc(c.title || 'Sin título')}" de ${esc(c.creator || 'autor desconocido')}, ${link(c.licenseUrl, licenseName(c))}, ${link(c.url, httpsUrl(c.url) ? 'ver la obra' : c.url)}${adapted ? ', adaptada' : ''}</p>`;
}
function creditOf(src) {
  for (const p of S.pages) {
    const c = (p.bg.src === src && p.bg.credit) || p.els.find(x => x.src === src && x.credit)?.credit;
    if (c) return {...c};
  }
}
function projectCredits() {
  return [
    ...new Set(
      S.pages.flatMap(p => [
        ...(p.bg.pat === 'image' && p.bg.src && p.bg.credit ? [creditText(p.bg.credit, true)] : []),
        ...p.els.filter(e => e.credit).map(e => creditText(e.credit, isAdapted(e))),
      ]),
    ),
  ];
}
function readImage(f, max, out) {
  return new Promise((res, rej) => {
    if (!f || !f.type.startsWith('image/')) return rej(new Error('type'));
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)),
          c = cv(Math.round(im.width * k), Math.round(im.height * k)),
          x = c.getContext('2d');
        x.drawImage(im, 0, 0, c.width, c.height);
        let src = out
          ? c.toDataURL(out, 0.85)
          : c.toDataURL(f.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92);
        if (out && !src.startsWith(`data:${out}`)) {
          const a = x.getImageData(0, 0, c.width, c.height).data;
          let alpha = false;
          for (let i = 3; i < a.length && !alpha; i += 4) alpha = a[i] < 255;
          src = alpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
        }
        res({
          src,
          w: c.width,
          h: c.height,
        });
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  });
}
function loadFile(f) {
  if (isMediaFile(f)) return loadMedia(f);
  readImage(f, 1600)
    .then(o => addImage(o.src, o.w, o.h))
    .catch(() => toast('Solo se aceptan imágenes'));
}
addEventListener('paste', ev => {
  if (/input|textarea/i.test(ev.target.tagName) || ev.target.isContentEditable) return;
  const f = [...(ev.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
  if (f) {
    ev.preventDefault();
    loadFile(f);
  }
});
stageEl.addEventListener('dragover', e => e.preventDefault());
stageEl.addEventListener('drop', e => {
  e.preventDefault();
  [...e.dataTransfer.files].forEach(loadFile);
});

const GRIDS = [
  [
    '2 columnas',
    [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ],
  ],
  [
    '2 filas',
    [
      [0, 0, 1, 0.5],
      [0, 0.5, 1, 0.5],
    ],
  ],
  [
    '3 columnas',
    [
      [0, 0, 1 / 3, 1],
      [1 / 3, 0, 1 / 3, 1],
      [2 / 3, 0, 1 / 3, 1],
    ],
  ],
  [
    '3 filas',
    [
      [0, 0, 1, 1 / 3],
      [0, 1 / 3, 1, 1 / 3],
      [0, 2 / 3, 1, 1 / 3],
    ],
  ],
  [
    '4 cuadros',
    [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  ],
  [
    '1 grande + 2',
    [
      [0, 0, 0.6, 1],
      [0.6, 0, 0.4, 0.5],
      [0.6, 0.5, 0.4, 0.5],
    ],
  ],
  [
    '1 grande + 3',
    [
      [0, 0, 1, 0.66],
      [0, 0.66, 1 / 3, 0.34],
      [1 / 3, 0.66, 1 / 3, 0.34],
      [2 / 3, 0.66, 1 / 3, 0.34],
    ],
  ],
  [
    '6 cuadros',
    [
      [0, 0, 1 / 3, 0.5],
      [1 / 3, 0, 1 / 3, 0.5],
      [2 / 3, 0, 1 / 3, 0.5],
      [0, 0.5, 1 / 3, 0.5],
      [1 / 3, 0.5, 1 / 3, 0.5],
      [2 / 3, 0.5, 1 / 3, 0.5],
    ],
  ],
  [
    'Mosaico',
    [
      [0, 0, 0.5, 0.6],
      [0.5, 0, 0.5, 0.3],
      [0.5, 0.3, 0.25, 0.3],
      [0.75, 0.3, 0.25, 0.3],
      [0, 0.6, 0.35, 0.4],
      [0.35, 0.6, 0.65, 0.4],
    ],
  ],
];
function addGrid(i) {
  const m = Math.round(S.w * 0.05),
    g = Math.round(Math.min(S.w, S.h) * 0.012),
    ax = m,
    ay = m,
    aw = S.w - 2 * m,
    ah = S.h - 2 * m;
  touch(true);
  const ids = [];
  GRIDS[i][1].forEach(([u, v, w, h]) => {
    const e = mk('image', {
      src: null,
      px: 1,
      x: Math.round(ax + u * aw + g / 2),
      y: Math.round(ay + v * ah + g / 2),
      w: Math.round(w * aw - g),
      h: Math.round(h * ah - g),
    });
    pg().els.push(e);
    ids.push(e.id);
  });
  S.sel = [ids[0]];
  S.tab = 'images';
  renderRail();
  refresh({props: true, panel: true});
  toast('Elige una foto para cada celda');
}
function fillCells(files) {
  const e = prim();
  if (!e) return;
  const cells = [e, ...els().filter(x => x.type === 'image' && !x.src && x.id !== e.id)];
  Promise.all([...files].slice(0, cells.length).map(f => readImage(f, 1600)))
    .then(list => {
      touch(true);
      list.forEach((o, i) => {
        cells[i].src = o.src;
        if (!S.uploads.includes(o.src)) S.uploads.unshift(o.src);
      });
      refresh({props: true, panel: S.tab === 'images'});
    })
    .catch(() => toast('Solo se aceptan imágenes'));
}
function alignSel(a) {
  const L = selEls();
  if (L.length < 2) return;
  touch(true);
  const x0 = Math.min(...L.map(e => e.x)),
    x1 = Math.max(...L.map(e => e.x + e.w)),
    y0 = Math.min(...L.map(e => e.y)),
    y1 = Math.max(...L.map(e => e.y + e.h));
  L.forEach(e => {
    if (a === 'l') e.x = x0;
    if (a === 'r') e.x = x1 - e.w;
    if (a === 'c') e.x = Math.round((x0 + x1) / 2 - e.w / 2);
    if (a === 't') e.y = y0;
    if (a === 'b') e.y = y1 - e.h;
    if (a === 'm') e.y = Math.round((y0 + y1) / 2 - e.h / 2);
  });
  refresh({props: true});
}
function distribute(ax) {
  const L = selEls();
  if (L.length < 3) {
    toast('Selecciona 3 o más objetos');
    return;
  }
  touch(true);
  const k = ax === 'h' ? ['x', 'w'] : ['y', 'h'];
  L.sort((a, b) => a[k[0]] - b[k[0]]);
  const first = L[0][k[0]],
    last = L[L.length - 1][k[0]] + L[L.length - 1][k[1]],
    tot = L.reduce((s, e) => s + e[k[1]], 0),
    gap = (last - first - tot) / (L.length - 1);
  let pos = first;
  L.forEach(e => {
    e[k[0]] = Math.round(pos);
    pos += e[k[1]] + gap;
  });
  refresh({props: true});
}
