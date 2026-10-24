// Image filters
const PALS = {
  gb: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  p3: ['#020821', '#0b2a8a', '#3fe0ff', '#f4fcff'],
  bw: ['#000000', '#555555', '#aaaaaa', '#ffffff'],
  sun: ['#1a0a4a', '#ff3d6e', '#ffd84a', '#fff7d6'],
  neo: ['#050d2b', '#8a2be2', '#1de9b6', '#f4fcff'],
  sepia: ['#2b1a0e', '#6b4423', '#c49a6c', '#f5e6c8'],
};
const PALN = {
  gb: 'Game Boy',
  p3: 'Tartarus',
  bw: 'Blanco y negro',
  sun: 'Atardecer',
  neo: 'Neón',
  sepia: 'Sepia',
};
const PRESETS = {
  Original: {},
  Gris: {gray: 100},
  Noir: {gray: 100, c: 40, vig: 40, b: -10},
  Sepia: {sep: 100},
  Vintage: {sep: 50, c: -10, fade: 60, vig: 35, noise: 12, temp: 20},
  Cálido: {temp: 40, s: 10},
  Frío: {temp: -40, s: 5},
  Vívido: {s: 50, c: 20},
  Dramático: {c: 50, s: -20, vig: 40, b: -10},
  Desvanecido: {fade: 80, c: -20, s: -15},
  Brillante: {b: 25, c: 10},
  Oscuro: {b: -30, c: 15},
  Suave: {blur: 1, b: 10, fade: 20},
  Nítido: {sharp: 100, c: 10},
  Invertir: {inv: 100},
  Solarizar: {sol: 100},
  Posterizar: {post: 4, s: 30},
  Umbral: {thr: 50},
  Ruido: {noise: 40},
  CRT: {scan: 60, glitch: 2, c: 15, s: 20, vig: 30},
  Glitch: {glitch: 4},
  Relieve: {emboss: 100},
  Bordes: {edge: 100, gray: 100},
  '8-bit': {post: 6, dith: 100, s: 30},
  'Game Boy': {pal: 'gb', dith: 60},
  Tartarus: {pal: 'p3', dith: 50},
  Moonlight: {duo: ['#020821', '#3fe0ff'], dith: 30},
  Atardecer: {pal: 'sun', dith: 40},
  Neón: {pal: 'neo', dith: 40},
  'Sepia pixel': {pal: 'sepia', dith: 40},
  'B/N pixel': {pal: 'bw', dith: 70},
  Rosa: {duo: ['#1a0a4a', '#ff3d6e']},
  Dorado: {duo: ['#1a0a0a', '#ffd84a']},
  Matrix: {duo: ['#001a00', '#33ff66']},
  Alucinante: {h: 180, s: 30},
  Violeta: {h: -70, s: 20},
  'Auto mejora': {auto: 100, s: 10},
};
const FSL = [
  ['b', 'Brillo', -100, 100],
  ['c', 'Contraste', -100, 100],
  ['s', 'Saturación', -100, 100],
  ['h', 'Tono', -180, 180],
  ['temp', 'Temperatura', -100, 100],
  ['fade', 'Desvanecido', 0, 100],
  ['auto', 'Mejora automática', 0, 100],
  ['sep', 'Sepia', 0, 100],
  ['gray', 'Blanco y negro', 0, 100],
  ['inv', 'Invertir', 0, 100],
  ['sol', 'Solarizar', 0, 100],
  ['blur', 'Desenfoque', 0, 8],
  ['sharp', 'Nitidez', 0, 100],
  ['emboss', 'Relieve', 0, 100],
  ['edge', 'Bordes', 0, 100],
  ['vig', 'Viñeta', 0, 100],
  ['noise', 'Ruido', 0, 100],
  ['scan', 'Líneas CRT', 0, 100],
  ['glitch', 'Glitch RGB', 0, 12],
  ['post', 'Posterizar', 0, 12],
  ['dith', 'Dithering', 0, 100],
  ['thr', 'Umbral', 0, 100],
];
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
function boxBlur(a, w, h, r) {
  const t = new Float32Array(a.length),
    n = 2 * r + 1,
    cl = (v, m) => (v < 0 ? 0 : v > m ? m : v);
  for (let y = 0; y < h; y++)
    for (let ch = 0; ch < 3; ch++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += a[(y * w + cl(k, w - 1)) * 4 + ch];
      for (let x = 0; x < w; x++) {
        t[(y * w + x) * 4 + ch] = sum / n;
        sum += a[(y * w + cl(x + r + 1, w - 1)) * 4 + ch] - a[(y * w + cl(x - r, w - 1)) * 4 + ch];
      }
    }
  for (let x = 0; x < w; x++)
    for (let ch = 0; ch < 3; ch++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += t[(cl(k, h - 1) * w + x) * 4 + ch];
      for (let y = 0; y < h; y++) {
        a[(y * w + x) * 4 + ch] = sum / n;
        sum += t[(cl(y + r + 1, h - 1) * w + x) * 4 + ch] - t[(cl(y - r, h - 1) * w + x) * 4 + ch];
      }
    }
}
function kernel(a, w, h, k, amt, bias) {
  const src = a.slice(),
    cl = (v, m) => (v < 0 ? 0 : v > m ? m : v);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let ch = 0; ch < 3; ch++) {
        let v = 0;
        for (let j = -1; j <= 1; j++)
          for (let i = -1; i <= 1; i++)
            v += src[(cl(y + j, h - 1) * w + cl(x + i, w - 1)) * 4 + ch] * k[(j + 1) * 3 + i + 1];
        const o = (y * w + x) * 4 + ch;
        a[o] = src[o] * (1 - amt) + (v + bias) * amt;
      }
}
const FX = {
  auto(a, am) {
    const lo = [0, 0, 0],
      hi = [255, 255, 255];
    for (let ch = 0; ch < 3; ch++) {
      const hg = new Uint32Array(256);
      let tot = 0;
      for (let i = ch; i < a.length; i += 4)
        if (a[i - ch + 3]) {
          hg[a[i]]++;
          tot++;
        }
      let acc = 0,
        l = 0,
        hh = 255;
      for (let v = 0; v < 256; v++) {
        acc += hg[v];
        if (acc >= tot * 0.01) {
          l = v;
          break;
        }
      }
      acc = 0;
      for (let v = 255; v >= 0; v--) {
        acc += hg[v];
        if (acc >= tot * 0.01) {
          hh = v;
          break;
        }
      }
      lo[ch] = l;
      hi[ch] = Math.max(l + 8, hh);
    }
    for (let i = 0; i < a.length; i += 4)
      for (let ch = 0; ch < 3; ch++) {
        const v = a[i + ch],
          n = ((v - lo[ch]) / (hi[ch] - lo[ch])) * 255;
        a[i + ch] = v + (n - v) * am;
      }
  },
  glitch(a, w, h, n) {
    const s = a.slice();
    for (let y = 0; y < h; y++)
      for (let xx = 0; xx < w; xx++) {
        const o = (y * w + xx) * 4;
        a[o] = s[(y * w + Math.min(w - 1, xx + n)) * 4];
        a[o + 2] = s[(y * w + Math.max(0, xx - n)) * 4 + 2];
      }
  },
  params(g, f) {
    const br = g('b') * 2.55,
      k255 = g('c') * 2.55,
      cf = (259 * (k255 + 255)) / (255 * (259 - k255)),
      sat = 1 + g('s') / 100,
      hr = (g('h') * Math.PI) / 180,
      cH = Math.cos(hr),
      sH = Math.sin(hr),
      tp = g('temp') * 0.5,
      sepA = g('sep') / 100,
      grA = g('gray') / 100,
      invA = g('inv') / 100,
      solA = g('sol') / 100,
      fade = g('fade') / 100,
      nz = g('noise') * 2.55,
      vg = g('vig') / 100,
      sl = g('scan') / 100,
      post = g('post'),
      thr = g('thr'),
      dith = g('dith') / 100,
      pal = f.pal && PALS[f.pal] ? PALS[f.pal].map(hexRGB) : null,
      duo = f.duo ? f.duo.map(hexRGB) : null;
    const any =
      br ||
      k255 ||
      sat !== 1 ||
      hr ||
      tp ||
      sepA ||
      grA ||
      invA ||
      solA ||
      fade ||
      nz ||
      vg ||
      sl ||
      post > 1 ||
      thr ||
      pal ||
      duo;
    return {
      br,
      k255,
      cf,
      sat,
      hr,
      cH,
      sH,
      tp,
      sepA,
      grA,
      invA,
      solA,
      fade,
      nz,
      vg,
      sl,
      post,
      thr,
      dith,
      pal,
      duo,
      any,
    };
  },
  grade(a, w, h, p) {
    const {
        br,
        k255,
        cf,
        sat,
        hr,
        cH,
        sH,
        tp,
        sepA,
        grA,
        invA,
        solA,
        fade,
        nz,
        vg,
        sl,
        post,
        thr,
        dith,
        pal,
        duo,
      } = p,
      cl = v => (v < 0 ? 0 : v > 255 ? 255 : v);
    if (p.any)
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] === 0) continue;
        let r = a[i],
          gg = a[i + 1],
          b = a[i + 2];
        const pi = i >> 2,
          px = pi % w,
          py = (pi / w) | 0;
        r += tp + br;
        gg += br;
        b += br - tp;
        if (k255) {
          r = (r - 128) * cf + 128;
          gg = (gg - 128) * cf + 128;
          b = (b - 128) * cf + 128;
        }
        let l = 0.299 * r + 0.587 * gg + 0.114 * b;
        if (sat !== 1) {
          r = l + (r - l) * sat;
          gg = l + (gg - l) * sat;
          b = l + (b - l) * sat;
        }
        if (hr) {
          const nr =
              r * (0.213 + cH * 0.787 - sH * 0.213) +
              gg * (0.715 - cH * 0.715 - sH * 0.715) +
              b * (0.072 - cH * 0.072 + sH * 0.928),
            ng =
              r * (0.213 - cH * 0.213 + sH * 0.143) +
              gg * (0.715 + cH * 0.285 + sH * 0.14) +
              b * (0.072 - cH * 0.072 - sH * 0.283),
            nb =
              r * (0.213 - cH * 0.213 - sH * 0.787) +
              gg * (0.715 - cH * 0.715 + sH * 0.715) +
              b * (0.072 + cH * 0.928 + sH * 0.072);
          r = nr;
          gg = ng;
          b = nb;
        }
        if (sepA) {
          const sr = 0.393 * r + 0.769 * gg + 0.189 * b,
            sg = 0.349 * r + 0.686 * gg + 0.168 * b,
            sb = 0.272 * r + 0.534 * gg + 0.131 * b;
          r += (sr - r) * sepA;
          gg += (sg - gg) * sepA;
          b += (sb - b) * sepA;
        }
        if (grA) {
          l = 0.299 * r + 0.587 * gg + 0.114 * b;
          r += (l - r) * grA;
          gg += (l - gg) * grA;
          b += (l - b) * grA;
        }
        if (fade) {
          r = r * (1 - 0.3 * fade) + 45 * fade;
          gg = gg * (1 - 0.3 * fade) + 45 * fade;
          b = b * (1 - 0.3 * fade) + 55 * fade;
        }
        if (solA) {
          const s = v => {
            v = cl(v);
            return v + ((v > 128 ? 255 - v : v) - v) * solA;
          };
          r = s(r);
          gg = s(gg);
          b = s(b);
        }
        if (invA) {
          r += (255 - 2 * r) * invA;
          gg += (255 - 2 * gg) * invA;
          b += (255 - 2 * b) * invA;
        }
        if (nz) {
          const n = ((((pi * 2654435761) >>> 0) % 1000) / 1000 - 0.5) * nz;
          r += n;
          gg += n;
          b += n;
        }
        if (vg) {
          const dx = (px / w - 0.5) * 2,
            dy = (py / h - 0.5) * 2,
            k = 1 - vg * Math.min(1, (dx * dx + dy * dy) / 2) * 1.3;
          r *= k;
          gg *= k;
          b *= k;
        }
        if (sl && py & 1) {
          const k = 1 - sl * 0.5;
          r *= k;
          gg *= k;
          b *= k;
        }
        if (thr) {
          l = 0.299 * r + 0.587 * gg + 0.114 * b;
          r = gg = b = l > thr * 2.55 ? 255 : 0;
        } else if (pal || duo) {
          l = cl(0.299 * r + 0.587 * gg + 0.114 * b);
          if (dith) l = cl(l + (BAYER[py & 3][px & 3] / 16 - 0.47) * dith * 70);
          if (pal) {
            const c = pal[Math.min(pal.length - 1, Math.floor((l / 256) * pal.length))];
            r = c[0];
            gg = c[1];
            b = c[2];
          } else {
            const t = l / 255;
            r = duo[0][0] + (duo[1][0] - duo[0][0]) * t;
            gg = duo[0][1] + (duo[1][1] - duo[0][1]) * t;
            b = duo[0][2] + (duo[1][2] - duo[0][2]) * t;
          }
        } else if (post > 1) {
          const st = 255 / (post - 1),
            o = dith ? (BAYER[py & 3][px & 3] / 16 - 0.47) * dith * st : 0;
          r = Math.round(cl(r + o) / st) * st;
          gg = Math.round(cl(gg + o) / st) * st;
          b = Math.round(cl(b + o) / st) * st;
        }
        a[i] = cl(r);
        a[i + 1] = cl(gg);
        a[i + 2] = cl(b);
      }
  },
  key(a, f, g) {
    const kc = hexRGB(f.key),
      tol = (g('tol') || 25) * 4.42;
    for (let i = 0; i < a.length; i += 4) {
      const dr = a[i] - kc[0],
        dg = a[i + 1] - kc[1],
        db = a[i + 2] - kc[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) <= tol) a[i + 3] = 0;
    }
  },
};
function applyFilter(c, f) {
  const w = c.width,
    h = c.height,
    x = c.getContext('2d'),
    d = x.getImageData(0, 0, w, h),
    a = d.data,
    g = k => f[k] || 0;
  if (g('auto') > 0) FX.auto(a, g('auto') / 100);
  if (g('blur') > 0) boxBlur(a, w, h, Math.round(g('blur')));
  if (g('sharp') > 0) kernel(a, w, h, [0, -1, 0, -1, 5, -1, 0, -1, 0], g('sharp') / 100, 0);
  if (g('emboss') > 0) kernel(a, w, h, [-2, -1, 0, -1, 1, 1, 0, 1, 2], g('emboss') / 100, 128);
  if (g('edge') > 0) kernel(a, w, h, [-1, -1, -1, -1, 8, -1, -1, -1, -1], g('edge') / 100, 0);
  if (g('glitch') > 0) FX.glitch(a, w, h, Math.round(g('glitch')));
  FX.grade(a, w, h, FX.params(g, f));
  if (f.key) FX.key(a, f, g);
  x.putImageData(d, 0, 0);
}
