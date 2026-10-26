(() => {
  Object.assign(window, {loadQR, gradOf, bitmapKey, bitmap, bgCanvas});
  const CHC = ['#3fe0ff', '#ffd84a', '#ff3d6e', '#1de9b6', '#8a2be2', '#1a5cff', '#ffffff'];
  let qrLoading = false;
  function loadQR() {
    if (window.qrcode || qrLoading) return;
    qrLoading = true;
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    sc.integrity = 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';
    sc.crossOrigin = 'anonymous';
    sc.onload = () => {
      bmCache.clear();
      refresh({});
    };
    sc.onerror = () => {
      qrLoading = false;
      toast('No se pudo cargar el generador de QR');
    };
    document.head.append(sc);
  }
  function gradOf(x, e, w = e.w, h = e.h) {
    const g = x.createLinearGradient(0, 0, e.gang === 'v' ? 0 : w, e.gang === 'h' ? 0 : h);
    g.addColorStop(0, e.fill);
    g.addColorStop(1, e.fill2 || '#ffffff');
    return g;
  }
  const gradCss = e =>
    `linear-gradient(${(Math.atan2(e.gang === 'v' ? 0 : e.w, e.gang === 'h' ? 0 : -e.h) * 180) / Math.PI}deg, ${e.fill}, ${e.fill2 || '#ffffff'})`;
  Object.assign(window, {gradCss});
  function parseChart(e) {
    return (e.cdata || '')
      .split('\n')
      .map(l => l.split(','))
      .map(a => ({l: (a[0] || '').trim(), v: parseFloat(a[1]) || 0}))
      .filter(r => r.l || r.v);
  }
  function drawChart(x, e) {
    const rows = parseChart(e),
      W = e.w,
      H = e.h,
      fs = Math.max(12, Math.round(Math.min(W, H) / 18)),
      n = rows.length || 1,
      max = Math.max(1, ...rows.map(r => r.v));
    x.font = `${fs}px Silkscreen,monospace`;
    x.textBaseline = 'middle';
    x.fillStyle = e.fill;
    x.strokeStyle = e.fill;
    if (e.ctype === 'pie') {
      const tot = rows.reduce((a, r) => a + Math.max(0, r.v), 0) || 1,
        R = Math.min(H / 2 - 6, W * 0.36),
        cx = R + 8,
        cy = H / 2;
      let a0 = -Math.PI / 2;
      rows.forEach((r, i) => {
        const a1 = a0 + (Math.max(0, r.v) / tot) * Math.PI * 2;
        x.fillStyle = CHC[i % CHC.length];
        x.beginPath();
        x.moveTo(cx, cy);
        x.arc(cx, cy, R, a0, a1);
        x.closePath();
        x.fill();
        a0 = a1;
      });
      x.textAlign = 'left';
      rows.forEach((r, i) => {
        const y = H / 2 + (i - (n - 1) / 2) * fs * 1.6,
          lx = cx + R + fs;
        x.fillStyle = CHC[i % CHC.length];
        x.fillRect(lx, y - fs / 2, fs, fs);
        x.fillStyle = e.fill;
        x.fillText(`${r.l} ${Math.round((r.v / tot) * 100)}%`, lx + fs * 1.4, y);
      });
      return;
    }
    const L = 8,
      T = fs * 1.6,
      B = fs * 1.8,
      pw = W - L - 8,
      ph = H - T - B;
    x.lineWidth = Math.max(2, H / 90);
    x.beginPath();
    x.moveTo(L, T - 4);
    x.lineTo(L, T + ph);
    x.lineTo(L + pw, T + ph);
    x.stroke();
    const bw = pw / n;
    x.textAlign = 'center';
    if (e.ctype === 'line') {
      x.strokeStyle = CHC[0];
      x.lineWidth = Math.max(3, H / 60);
      x.beginPath();
      rows.forEach((r, i) => {
        const px = L + bw * (i + 0.5),
          py = T + ph - (r.v / max) * ph;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      });
      x.stroke();
      rows.forEach((r, i) => {
        const px = L + bw * (i + 0.5),
          py = T + ph - (r.v / max) * ph;
        x.fillStyle = CHC[1];
        x.fillRect(px - fs / 3, py - fs / 3, fs * 0.66, fs * 0.66);
        x.fillStyle = e.fill;
        x.fillText(String(r.v), px, py - fs);
        x.fillText(r.l, px, T + ph + fs * 1.1);
      });
    } else
      rows.forEach((r, i) => {
        const bh = (r.v / max) * ph,
          bx = L + bw * i + bw * 0.15;
        x.fillStyle = CHC[i % CHC.length];
        x.fillRect(bx, T + ph - bh, bw * 0.7, bh);
        x.fillStyle = e.fill;
        x.fillText(String(r.v), L + bw * (i + 0.5), T + ph - bh - fs * 0.8);
        x.fillText(r.l, L + bw * (i + 0.5), T + ph + fs * 1.1);
      });
  }
  function outlineC(c, r, col) {
    const w = c.width,
      h = c.height,
      x = c.getContext('2d'),
      d = x.getImageData(0, 0, w, h),
      a = d.data,
      [cr, cg, cb] = hexRGB(col),
      m = new Uint8Array(w * h),
      t = new Uint8Array(w * h),
      o = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) m[i] = a[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < h; y++)
      for (let xx = 0; xx < w; xx++) {
        let v = 0;
        for (let k = Math.max(0, xx - r); k <= Math.min(w - 1, xx + r) && !v; k++) v = m[y * w + k];
        t[y * w + xx] = v;
      }
    for (let xx = 0; xx < w; xx++)
      for (let y = 0; y < h; y++) {
        let v = 0;
        for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r) && !v; k++) v = t[k * w + xx];
        o[y * w + xx] = v;
      }
    for (let i = 0; i < w * h; i++)
      if (!m[i] && o[i]) {
        a[i * 4] = cr;
        a[i * 4 + 1] = cg;
        a[i * 4 + 2] = cb;
        a[i * 4 + 3] = 255;
      }
    x.putImageData(d, 0, 0);
  }
  function drawBitmap(e) {
    if (e.type === 'sprite') {
      const r = SPR[e.spr],
        c = cv(r[0].length, r.length),
        x = c.getContext('2d');
      x.fillStyle = e.grad ? gradOf(x, e, c.width, c.height) : e.fill;
      r.forEach((row, y) =>
        [...row].forEach((ch, i) => {
          if (ch === 'X') x.fillRect(i, y, 1, 1);
        }),
      );
      return c;
    }
    if (e.type === 'draw') {
      const c = cv(e.gw || 1, e.gh || 1),
        x = c.getContext('2d');
      x.fillStyle = e.grad ? gradOf(x, e, c.width, c.height) : e.fill;
      (e.cells || []).forEach(a => x.fillRect(a[0], a[1], 1, 1));
      return c;
    }
    if (e.type === 'qr') {
      if (!window.qrcode) {
        loadQR();
        const c = cv(2, 2),
          x = c.getContext('2d');
        x.fillStyle = '#ffffff';
        x.fillRect(0, 0, 2, 2);
        return c;
      }
      const qr = window.qrcode(0, 'M');
      qr.addData(e.text || ' ');
      qr.make();
      const n = qr.getModuleCount(),
        q = 2,
        c = cv(n + 2 * q, n + 2 * q),
        x = c.getContext('2d');
      if (e.bgc) {
        x.fillStyle = e.bgc;
        x.fillRect(0, 0, c.width, c.height);
      }
      x.fillStyle = e.fill;
      for (let r = 0; r < n; r++)
        for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect(k + q, r + q, 1, 1);
      return c;
    }
    const px = Math.max(1, e.px),
      cw = Math.max(2, Math.round(e.w / px)),
      ch = Math.max(2, Math.round(e.h / px)),
      c = cv(cw, ch),
      x = c.getContext('2d', {willReadFrequently: true});
    x.scale(cw / e.w, ch / e.h);
    if (e.type === 'chart') {
      drawChart(x, e);
      return c;
    }
    if (e.type === 'image') {
      if (!e.src) {
        x.fillStyle = '#0b2a8a';
        x.fillRect(0, 0, e.w, e.h);
        x.fillStyle = '#0a2475';
        const g = Math.max(8, e.w / 12);
        for (let j = 0; j * g < e.h; j++)
          for (let i = 0; i * g < e.w; i++) if ((i + j) & 1) x.fillRect(i * g, j * g, g, g);
        x.fillStyle = '#3fe0ff';
        const t = Math.max(6, Math.min(e.w, e.h) / 14),
          m = Math.min(e.w, e.h) / 4;
        x.fillRect(e.w / 2 - m, e.h / 2 - t / 2, m * 2, t);
        x.fillRect(e.w / 2 - t / 2, e.h / 2 - m, t, m * 2);
        return c;
      }
      const im = getImg(e.src);
      if (im._ok) {
        const cr = e.crop || {x: 0, y: 0, w: 1, h: 1},
          sx = cr.x * im.width,
          sy = cr.y * im.height,
          sw = cr.w * im.width,
          sh = cr.h * im.height,
          s = Math.max(e.w / sw, e.h / sh),
          dw = sw * s,
          dh = sh * s;
        x.imageSmoothingQuality = 'high';
        x.save();
        if (e.fx) {
          x.translate(e.w, 0);
          x.scale(-1, 1);
        }
        if (e.fy) {
          x.translate(0, e.h);
          x.scale(1, -1);
        }
        x.drawImage(im, sx, sy, sw, sh, (e.w - dw) / 2, (e.h - dh) / 2, dw, dh);
        x.restore();
        if (e.mask) {
          x.save();
          x.globalCompositeOperation = 'destination-in';
          x.fillStyle = '#000';
          x.fill(pathFor(e.mask, e.w, e.h, e.th));
          x.restore();
          if (px > 1) crisp(x, cw, ch);
        }
      } else {
        x.fillStyle = '#0b2a8a';
        x.fillRect(0, 0, e.w, e.h);
      }
      if (e.flt && Object.keys(e.flt).length) applyFilter(c, e.flt);
      if (e.grad) {
        x.save();
        x.globalCompositeOperation = 'source-atop';
        x.globalAlpha = e.gop ?? 0.5;
        x.fillStyle = gradOf(x, e);
        x.fillRect(0, 0, e.w, e.h);
        x.restore();
      }
      if (e.sw > 0) {
        x.strokeStyle = e.stroke;
        if (e.mask) {
          const mp = pathFor(e.mask, e.w, e.h, e.th);
          x.save();
          x.clip(mp);
          x.lineWidth = e.sw * 2;
          x.stroke(mp);
          x.restore();
        } else {
          x.lineWidth = e.sw * 2;
          x.strokeRect(0, 0, e.w, e.h);
        }
      }
      return c;
    }
    if (e.type === 'line' || e.type === 'arrowl') {
      const t = Math.max(e.sw, px),
        y = e.h / 2 - t / 2;
      x.fillStyle = e.fill;
      if (e.type === 'line') x.fillRect(0, y, e.w, t);
      else {
        const hd = Math.min(e.h * 1.2, e.w / 2);
        x.fillRect(0, y, e.w - hd * 0.6, t);
        x.beginPath();
        x.moveTo(e.w, e.h / 2);
        x.lineTo(e.w - hd, e.h / 2 - hd / 2);
        x.lineTo(e.w - hd, e.h / 2 + hd / 2);
        x.closePath();
        x.fill();
      }
      if (px > 1) crisp(x, cw, ch);
      return c;
    }
    const p = pathFor(e.type, e.w, e.h, e.th);
    x.fillStyle = e.grad ? gradOf(x, e) : e.fill;
    x.fill(p, 'evenodd');
    if (e.sw > 0) {
      x.save();
      x.clip(p);
      x.strokeStyle = e.stroke;
      x.lineWidth = e.sw * 2;
      x.stroke(p);
      x.restore();
    }
    if (px > 1) crisp(x, cw, ch);
    return c;
  }
  function bitmapKey(e) {
    return JSON.stringify([
      e.type,
      e.w,
      e.h,
      e.fill,
      e.stroke,
      e.sw,
      e.px,
      e.spr,
      e.src && e.src.length,
      e.src && e.src.slice(-30),
      e.src && imgCache[e.src] && imgCache[e.src]._ok,
      e.flt,
      e.fx,
      e.fy,
      e.crop,
      e.th,
      e.grad,
      e.gop,
      e.fill2,
      e.gang,
      e.mask,
      e.ol,
      e.olc,
      e.ctype,
      e.cdata,
      e.text,
      e.bgc,
      e.gw,
      e.gh,
      e.rev,
      e.type === 'draw' ? e.id : 0,
      !!window.qrcode,
    ]);
  }
  function bitmap(e, keep = true) {
    const k = bitmapKey(e);
    let b = bmCache.get(k);
    if (!b) {
      b = drawBitmap(e);
      if (e.ol > 0 && e.type !== 'text') {
        const sc = b.width / Math.max(1, e.w);
        outlineC(b, Math.max(1, Math.round(e.ol * sc)), e.olc || '#ffffff');
      }
      if (keep) {
        if (bmCache.size > 300) bmCache.clear();
        bmCache.set(k, b);
      }
    }
    const c = cv(b.width, b.height);
    c.getContext('2d').drawImage(b, 0, 0);
    return c;
  }
  const hexRGB = h => {
    h = h.replace('#', '');
    if (h.length === 3) h = [...h].map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  Object.assign(window, {hexRGB});
  function bgCanvas(p, W, H) {
    if (p.bg.smooth && p.bg.pat === 'gradient') {
      const c = cv(1, H),
        x = c.getContext('2d'),
        g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, p.bg.c1);
      g.addColorStop(1, p.bg.c2);
      x.fillStyle = g;
      x.fillRect(0, 0, 1, H);
      return c;
    }
    const P = Math.max(1, p.bg.px || 8),
      cw = Math.ceil(W / P),
      ch = Math.ceil(H / P),
      c = cv(cw, ch),
      x = c.getContext('2d'),
      d = x.createImageData(cw, ch);
    if (p.bg.pat === 'image') {
      const im = p.bg.src ? getImg(p.bg.src) : null;
      x.fillStyle = p.bg.c1;
      x.fillRect(0, 0, cw, ch);
      if (im && im._ok) {
        const sc = Math.max(cw / im.width, ch / im.height);
        x.imageSmoothingQuality = 'high';
        x.drawImage(im, (cw - im.width * sc) / 2, (ch - im.height * sc) / 2, im.width * sc, im.height * sc);
      }
      return c;
    }
    const a = hexRGB(p.bg.c1),
      b = hexRGB(p.bg.c2),
      pat = p.bg.pat,
      B = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
    let seed = 7;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let yy = 0; yy < ch; yy++)
      for (let xx = 0; xx < cw; xx++) {
        let u = 0;
        if (pat === 'stripes') u = ((xx + yy) >> 2) & 1;
        else if (pat === 'checker') u = ((xx >> 1) + (yy >> 1)) & 1;
        else if (pat === 'dots') u = xx % 4 === 0 && yy % 4 === 0 ? 1 : 0;
        else if (pat === 'gradient') u = yy / (ch - 1 || 1) > (B[yy & 3][xx & 3] + 0.5) / 16 ? 1 : 0;
        else if (pat === 'stars') u = rnd() < 0.012 ? 1 : 0;
        const col = u ? b : a,
          i = (yy * cw + xx) * 4;
        d.data[i] = col[0];
        d.data[i + 1] = col[1];
        d.data[i + 2] = col[2];
        d.data[i + 3] = pat === 'none' ? 0 : 255;
      }
    x.putImageData(d, 0, 0);
    return c;
  }
})();
