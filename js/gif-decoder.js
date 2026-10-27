(() => {
  const PASSES = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ];

  const once = (el, ok, bad) =>
    new Promise((res, rej) => {
      const done = () => {
        el.removeEventListener(ok, done);
        el.removeEventListener(bad, fail);
        res();
      };
      const fail = () => {
        el.removeEventListener(ok, done);
        el.removeEventListener(bad, fail);
        rej(new Error(bad));
      };
      el.addEventListener(ok, done);
      el.addEventListener(bad, fail);
    });

  async function openVideo(src) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = src;
    await once(v, 'loadeddata', 'error');
    if (!isFinite(v.duration) || !v.videoWidth) throw new Error('video');
    return v;
  }

  function palette(b, p, n) {
    const pal = new Uint32Array(256);
    for (let i = 0; i < n; i++, p += 3) pal[i] = 0xff000000 | (b[p + 2] << 16) | (b[p + 1] << 8) | b[p];
    return pal;
  }

  function skip(b, p) {
    while (p < b.length && b[p]) p += b[p] + 1;
    return p + 1;
  }

  function lzw(data, minBits, n) {
    const out = new Uint8Array(n),
      prefix = new Uint16Array(4096),
      suffix = new Uint8Array(4096),
      stack = new Uint8Array(4097),
      clear = 1 << minBits,
      eoi = clear + 1;
    for (let i = 0; i < clear; i++) suffix[i] = i;
    let size = minBits + 1,
      mask = (1 << size) - 1,
      avail = clear + 2,
      old = -1,
      first = 0,
      bits = 0,
      datum = 0,
      pos = 0,
      op = 0;
    while (op < n) {
      while (bits < size) {
        if (pos >= data.length) return out;
        datum |= data[pos++] << bits;
        bits += 8;
      }
      let code = datum & mask;
      datum >>>= size;
      bits -= size;
      if (code === clear) {
        size = minBits + 1;
        mask = (1 << size) - 1;
        avail = clear + 2;
        old = -1;
        continue;
      }
      if (code === eoi || code > avail) break;
      if (old === -1) {
        out[op++] = suffix[code];
        old = first = code;
        continue;
      }
      const cur = code;
      let sp = 0;
      if (code === avail) {
        stack[sp++] = first;
        code = old;
      }
      while (code >= clear) {
        stack[sp++] = suffix[code];
        code = prefix[code];
      }
      first = suffix[code];
      stack[sp++] = first;
      if (avail < 4096) {
        prefix[avail] = old;
        suffix[avail] = first;
        avail++;
        if (!(avail & mask) && avail < 4096) {
          size++;
          mask += avail;
        }
      }
      old = cur;
      while (sp && op < n) out[op++] = stack[--sp];
    }
    return out;
  }

  function paint(cvs, W, H, idx, x0, y0, w, h, pal, trans, interlaced) {
    const lim = Math.min(w, W - x0);
    let pass = 0,
      [row, step] = interlaced ? PASSES[0] : [0, 1];
    for (let r = 0; r < h; r++) {
      while (row >= h && pass < 3) [row, step] = PASSES[++pass];
      const y = y0 + row;
      if (y < H)
        for (let i = 0, src = r * w, dst = y * W + x0; i < lim; i++) {
          const c = idx[src + i];
          if (c !== trans) cvs[dst + i] = pal[c];
        }
      row += step;
    }
  }

  function frameCanvas(cvs, W, H) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cvs.slice().buffer), W, H), 0, 0);
    return c;
  }

  function decodeGif(buf, o = {}) {
    const b = new Uint8Array(buf),
      max = o.max || Infinity;
    if (b.length < 13 || !/^GIF8[79]a$/.test(String.fromCharCode(...b.subarray(0, 6))))
      throw new Error('gif');
    const W = b[6] | (b[7] << 8),
      H = b[8] | (b[9] << 8);
    if (!W || !H) throw new Error('gif');
    let p = 13;
    const gct = b[10] & 0x80 ? palette(b, p, 2 << (b[10] & 7)) : new Uint32Array(256);
    if (b[10] & 0x80) p += 3 * (2 << (b[10] & 7));
    const cvs = new Uint32Array(W * H),
      frames = [],
      times = [];
    let gce = null,
      at = 0,
      count = 0,
      saved = null;
    while (p < b.length) {
      const t = b[p++];
      if (t === 0x3b) break;
      if (t === 0x21) {
        if (b[p] === 0xf9 && b[p + 1] >= 4)
          gce = {
            disp: (b[p + 2] >> 2) & 7,
            trans: b[p + 2] & 1 ? b[p + 5] : -1,
            delay: b[p + 3] | (b[p + 4] << 8),
          };
        p = skip(b, p + 1);
        continue;
      }
      if (t !== 0x2c) break;
      const x0 = b[p] | (b[p + 1] << 8),
        y0 = b[p + 2] | (b[p + 3] << 8),
        w = b[p + 4] | (b[p + 5] << 8),
        h = b[p + 6] | (b[p + 7] << 8),
        pk = b[p + 8],
        g = gce || {disp: 0, trans: -1, delay: 0};
      p += 9;
      gce = null;
      let pal = gct;
      if (pk & 0x80) {
        pal = palette(b, p, 2 << (pk & 7));
        p += 3 * (2 << (pk & 7));
      }
      count++;
      if (frames.length >= max) {
        p = skip(b, p + 1);
        continue;
      }
      if (o.maxPixels && W * H * (frames.length + 1) > o.maxPixels) throw new Error('pixels');
      const minBits = b[p++];
      let len = 0,
        q = p;
      while (q < b.length && b[q]) {
        len += b[q];
        q += b[q] + 1;
      }
      const data = new Uint8Array(len);
      for (let k = 0; p < b.length && b[p]; p += b[p] + 1) {
        data.set(b.subarray(p + 1, p + 1 + b[p]), k);
        k += b[p];
      }
      p++;
      if (minBits < 2 || minBits > 8) throw new Error('gif');
      if (g.disp === 3) saved = cvs.slice();
      paint(cvs, W, H, lzw(data, minBits, w * h), x0, y0, w, h, pal, g.trans, pk & 0x40);
      frames.push(frameCanvas(cvs, W, H));
      times.push(at);
      at += g.delay ? Math.max(0.02, g.delay / 100) : 0.1;
      if (g.disp === 2)
        for (let y = y0; y < Math.min(H, y0 + h); y++) cvs.fill(0, y * W + x0, y * W + Math.min(W, x0 + w));
      else if (g.disp === 3) cvs.set(saved);
    }
    if (!frames.length) throw new Error('gif');
    return {w: W, h: H, frames, times, duration: at, count};
  }

  window.MoonGif = Object.assign(window.MoonGif || {}, {decodeGif, openVideo, once});
})();
