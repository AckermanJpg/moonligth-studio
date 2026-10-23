(() => {
  const SHEETS = [
    {id: 'a4', name: 'A4 (21 × 29,7 cm)', w: 21, h: 29.7},
    {id: 'letter', name: 'Carta (21,59 × 27,94 cm)', w: 21.59, h: 27.94},
    {id: 'a3', name: 'A3 (29,7 × 42 cm)', w: 29.7, h: 42},
    {id: 'legal', name: 'Oficio (21,59 × 35,56 cm)', w: 21.59, h: 35.56},
    {id: 'a5', name: 'A5 (14,8 × 21 cm)', w: 14.8, h: 21},
    {id: 'a2', name: 'A2 (42 × 59,4 cm)', w: 42, h: 59.4},
    {id: 'tabloid', name: 'Tabloide (27,94 × 43,18 cm)', w: 27.94, h: 43.18},
    {id: 'custom', name: 'Medidas propias', w: 21, h: 29.7},
  ];

  const newCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  const dist2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

  const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  function layout(W, H, pw, ph, ov) {
    const stepX = pw - ov,
      stepY = ph - ov,
      cols = W <= pw + 1e-9 ? 1 : Math.ceil((W - ov) / stepX - 1e-9),
      rows = H <= ph + 1e-9 ? 1 : Math.ceil((H - ov) / stepY - 1e-9),
      tiles = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = c * stepX,
          y = r * stepY;
        tiles.push({
          col: c,
          row: r,
          n: tiles.length + 1,
          x,
          y,
          w: Math.min(pw, W - x),
          h: Math.min(ph, H - y),
        });
      }
    return {cols, rows, tiles, count: tiles.length, stepX, stepY};
  }

  function planTiles({width, height, sheetW, sheetH, margin = 1, overlap = 0, orientation = 'auto'}) {
    if (!(width > 0 && height > 0 && sheetW > 0 && sheetH > 0)) return null;
    const short = Math.min(sheetW, sheetH),
      long = Math.max(sheetW, sheetH),
      options = {portrait: [short, long], landscape: [long, short]},
      tryOrient = o => {
        const [sw, sh] = options[o],
          pw = sw - 2 * margin,
          ph = sh - 2 * margin;
        if (pw <= overlap + 0.1 || ph <= overlap + 0.1) return null;
        return {orientation: o, sheetW: sw, sheetH: sh, pw, ph, ...layout(width, height, pw, ph, overlap)};
      };
    let plan;
    if (orientation === 'portrait' || orientation === 'landscape') plan = tryOrient(orientation);
    else {
      const a = tryOrient('portrait'),
        b = tryOrient('landscape');
      if (a && b) plan = a.count < b.count ? a : b.count < a.count ? b : width > height ? b : a;
      else plan = a || b;
    }
    if (!plan) return null;
    return {...plan, width, height, margin, overlap};
  }

  function renderSheet(source, plan, tile, o = {}) {
    const dpi = o.dpi || 150,
      k = dpi / 2.54,
      c = newCanvas(Math.round(plan.sheetW * k), Math.round(plan.sheetH * k)),
      x = c.getContext('2d'),
      m = plan.margin * k,
      perCm = source.width / plan.width;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingEnabled = o.smooth !== false;
    x.imageSmoothingQuality = 'high';
    x.drawImage(
      source,
      tile.x * perCm,
      tile.y * perCm,
      tile.w * perCm,
      tile.h * perCm,
      m,
      m,
      tile.w * k,
      tile.h * k,
    );
    if (o.marks !== false && m >= 6) drawMarks(x, plan, tile, k, m);
    if (o.label !== false && m >= 14) drawLabel(x, plan, tile, k, m);
    return c;
  }

  function drawMarks(x, plan, tile, k, m) {
    const len = Math.min(m * 0.7, 0.6 * k),
      L = m,
      T = m,
      R = m + tile.w * k,
      B = m + tile.h * k;
    x.save();
    x.strokeStyle = '#000000';
    x.lineWidth = Math.max(1, k / 60);
    x.beginPath();
    [
      [L, T],
      [R, T],
      [L, B],
      [R, B],
    ].forEach(([cx, cy], i) => {
      const sx = i % 2 ? 1 : -1,
        sy = i < 2 ? -1 : 1;
      x.moveTo(cx, cy);
      x.lineTo(cx + sx * len, cy);
      x.moveTo(cx, cy);
      x.lineTo(cx, cy + sy * len);
    });
    x.stroke();
    x.setLineDash([len / 3, len / 3]);
    const hasRight = tile.col < plan.cols - 1,
      hasBottom = tile.row < plan.rows - 1;
    if (hasRight) {
      const gx = m + plan.stepX * k;
      x.beginPath();
      x.moveTo(gx, T - len);
      x.lineTo(gx, T);
      x.moveTo(gx, B);
      x.lineTo(gx, B + len);
      x.stroke();
    }
    if (hasBottom) {
      const gy = m + plan.stepY * k;
      x.beginPath();
      x.moveTo(L - len, gy);
      x.lineTo(L, gy);
      x.moveTo(R, gy);
      x.lineTo(R + len, gy);
      x.stroke();
    }
    x.restore();
  }

  function drawLabel(x, plan, tile, k, m) {
    const size = Math.max(9, Math.min(m * 0.4, 15)),
      L = m,
      T = m,
      R = m + tile.w * k,
      B = m + tile.h * k,
      cx = (L + R) / 2,
      cy = (T + B) / 2,
      near = {
        up: tile.row > 0 ? tile.n - plan.cols : 0,
        down: tile.row < plan.rows - 1 ? tile.n + plan.cols : 0,
        left: tile.col > 0 ? tile.n - 1 : 0,
        right: tile.col < plan.cols - 1 ? tile.n + 1 : 0,
      },
      side = (text, px, py, angle) => {
        x.save();
        x.translate(px, py);
        x.rotate(angle);
        x.fillText(text, 0, 0);
        x.restore();
      };
    x.save();
    x.fillStyle = '#000000';
    x.font = `${size}px sans-serif`;
    x.textBaseline = 'middle';
    x.textAlign = 'center';
    x.fillText(
      `Hoja ${tile.n} de ${plan.count} · fila ${tile.row + 1}, columna ${tile.col + 1}`,
      cx,
      B + m / 2,
    );
    if (near.up) x.fillText(`↑ hoja ${near.up}`, cx, T - m / 2);
    if (near.down) x.fillText(`↓ hoja ${near.down}`, R - 3 * size, B + m / 2);
    if (near.left) side(`← hoja ${near.left}`, L - m / 2, cy, -Math.PI / 2);
    if (near.right) side(`hoja ${near.right} →`, R + m / 2, cy, Math.PI / 2);
    x.restore();
  }

  function fitToSheets({cols, rows, ratio, sheetW, sheetH, margin = 1, overlap = 0, orientation = 'auto'}) {
    const short = Math.min(sheetW, sheetH),
      long = Math.max(sheetW, sheetH),
      names = orientation === 'auto' ? ['portrait', 'landscape'] : [orientation];
    let best = null;
    for (const o of names) {
      const [sw, sh] = o === 'portrait' ? [short, long] : [long, short],
        pw = sw - 2 * margin,
        ph = sh - 2 * margin;
      if (pw <= overlap + 0.1 || ph <= overlap + 0.1) continue;
      const maxW = pw + (cols - 1) * (pw - overlap),
        maxH = ph + (rows - 1) * (ph - overlap),
        width = Math.min(maxW, maxH / ratio) - 0.01;
      if (!best || width > best.width) best = {width, height: width * ratio, orientation: o};
    }
    return best;
  }

  function renderGuide(source, plan, o = {}) {
    const dpi = o.dpi || 150,
      k = dpi / 2.54,
      c = newCanvas(Math.round(plan.sheetW * k), Math.round(plan.sheetH * k)),
      x = c.getContext('2d'),
      pad = Math.round(1.2 * k),
      unit = o.unit || 'cm',
      f = {cm: 1, mm: 10, in: 1 / 2.54, m: 0.01}[unit] || 1,
      fmt = v => String(Math.round(v * f * 100) / 100).replace('.', ',') + ' ' + unit,
      fs = Math.max(14, Math.round(0.55 * k));
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#000000';
    x.textBaseline = 'top';
    x.font = `bold ${Math.round(fs * 1.5)}px sans-serif`;
    x.fillText('Plano de armado', pad, pad);
    x.font = `${fs}px sans-serif`;
    const lines = [
      `Diseño completo: ${fmt(plan.width)} × ${fmt(plan.height)}`,
      `${plan.cols} × ${plan.rows} = ${plan.count} hojas · cada hoja ${fmt(plan.sheetW)} × ${fmt(plan.sheetH)}`,
    ];
    lines.forEach((t, i) => x.fillText(t, pad, pad + fs * (2.4 + i * 1.4)));
    const top = pad + fs * 5.6,
      steps = [
        '1. Imprime todas las hojas al 100 % (sin "ajustar a página").',
        '2. Recorta por las marcas de las esquinas.',
        `3. Une cada hoja con sus vecinas siguiendo los números${plan.overlap ? `; se traslapan ${fmt(plan.overlap)}` : ''}.`,
        '4. Pega por detrás y revisa que las marcas coincidan.',
      ],
      stepsH = fs * 1.5 * steps.length + pad,
      area = {w: c.width - 2 * pad, h: c.height - top - stepsH - pad},
      prev = drawPlanPreview(source, plan, 900),
      s = Math.min(area.w / prev.width, area.h / prev.height);
    x.drawImage(prev, pad + (area.w - prev.width * s) / 2, top, prev.width * s, prev.height * s);
    x.fillStyle = '#000000';
    x.font = `${fs}px sans-serif`;
    const stepsTop = top + prev.height * s + pad;
    steps.forEach((t, i) => x.fillText(t, pad, stepsTop + i * fs * 1.5));
    return c;
  }

  function packShelves(items, W, H, gap) {
    const order = items.map((_, i) => i).sort((a, b) => items[b].h - items[a].h),
      sheets = [];
    let sheet = null,
      x = 0,
      y = 0,
      rowH = 0;
    const fresh = () => {
      sheet = [];
      sheets.push(sheet);
      x = y = rowH = 0;
    };
    for (const i of order) {
      const it = items[i];
      if (!sheet) fresh();
      if (x > 0 && x + it.w > W) {
        x = 0;
        y += rowH + gap;
        rowH = 0;
      }
      if (y > 0 && y + it.h > H) fresh();
      sheet.push({i, x, y});
      x += it.w + gap;
      rowH = Math.max(rowH, it.h);
    }
    return sheets;
  }

  function renderPacked(items, placed, o) {
    const k = o.dpi / 2.54,
      c = newCanvas(Math.round(o.sheetW * k), Math.round(o.sheetH * k)),
      x = c.getContext('2d'),
      m = o.margin * k,
      size = Math.max(10, Math.round(0.3 * k));
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingQuality = 'high';
    x.fillStyle = '#000000';
    x.font = `${size}px sans-serif`;
    x.textBaseline = 'top';
    placed.forEach(({i, x: px, y: py}) => {
      const it = items[i],
        dx = m + px * k,
        dy = m + py * k;
      x.drawImage(it.canvas, dx, dy, it.w * k, (it.h - it.labelH) * k);
      x.fillText(it.label, dx, dy + (it.h - it.labelH) * k + size * 0.25);
    });
    return c;
  }

  function drawPlanPreview(source, plan, maxSide) {
    const k = maxSide / Math.max(plan.width, plan.height),
      c = newCanvas(Math.max(1, Math.round(plan.width * k)), Math.max(1, Math.round(plan.height * k))),
      x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(source, 0, 0, c.width, c.height);
    if (plan.overlap > 0) {
      x.fillStyle = 'rgba(255, 61, 110, 0.4)';
      for (let col = 1; col < plan.cols; col++)
        x.fillRect(col * plan.stepX * k, 0, plan.overlap * k, c.height);
      for (let row = 1; row < plan.rows; row++)
        x.fillRect(0, row * plan.stepY * k, c.width, plan.overlap * k);
    }
    x.lineWidth = 2;
    plan.tiles.forEach(t => {
      const px = t.x * k,
        py = t.y * k,
        pw = t.w * k,
        ph = t.h * k;
      x.fillStyle = (t.row + t.col) % 2 ? 'rgba(63,224,255,0.14)' : 'rgba(255,61,110,0.14)';
      x.fillRect(px, py, pw, ph);
      x.strokeStyle = '#ff3d6e';
      x.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
      const fs = Math.max(12, Math.min(pw, ph) * 0.3);
      x.font = `bold ${fs}px sans-serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.lineWidth = Math.max(2, fs / 8);
      x.strokeStyle = '#020821';
      x.strokeText(t.n, px + pw / 2, py + ph / 2);
      x.fillStyle = '#ffffff';
      x.fillText(t.n, px + pw / 2, py + ph / 2);
    });
    return c;
  }

  function dilate(mask, W, H, r) {
    if (r <= 0) return mask;
    const tmp = new Uint8Array(W * H),
      out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      let cnt = 0;
      const row = y * W;
      for (let x = 0; x < Math.min(r, W); x++) cnt += mask[row + x];
      for (let x = 0; x < W; x++) {
        if (x + r < W) cnt += mask[row + x + r];
        if (x - r - 1 >= 0) cnt -= mask[row + x - r - 1];
        tmp[row + x] = cnt > 0 ? 1 : 0;
      }
    }
    for (let x = 0; x < W; x++) {
      let cnt = 0;
      for (let y = 0; y < Math.min(r, H); y++) cnt += tmp[y * W + x];
      for (let y = 0; y < H; y++) {
        if (y + r < H) cnt += tmp[(y + r) * W + x];
        if (y - r - 1 >= 0) cnt -= tmp[(y - r - 1) * W + x];
        out[y * W + x] = cnt > 0 ? 1 : 0;
      }
    }
    return out;
  }

  function detectBackground(d, W, H) {
    const bins = new Map();
    const add = i => {
      const o = i * 4,
        key = ((d[o] >> 3) << 10) | ((d[o + 1] >> 3) << 5) | (d[o + 2] >> 3),
        b = bins.get(key) || [0, 0, 0, 0];
      b[0]++;
      b[1] += d[o];
      b[2] += d[o + 1];
      b[3] += d[o + 2];
      bins.set(key, b);
    };
    for (let x = 0; x < W; x++) {
      add(x);
      add((H - 1) * W + x);
    }
    for (let y = 1; y < H - 1; y++) {
      add(y * W);
      add(y * W + W - 1);
    }
    let best = null;
    bins.forEach(b => {
      if (!best || b[0] > best[0]) best = b;
    });
    return [best[1] / best[0], best[2] / best[0], best[3] / best[0]];
  }

  function foregroundMask(d, W, H, o) {
    const n = W * H,
      mask = new Uint8Array(n);
    let clear = 0;
    for (let i = 0; i < n; i++) if (d[i * 4 + 3] < 250) clear++;
    const transparent = clear > n * 0.01;
    if (transparent) {
      for (let i = 0; i < n; i++) mask[i] = d[i * 4 + 3] >= 24 ? 1 : 0;
      return {mask, transparent, bg: null};
    }
    if (o.keepBg) {
      mask.fill(1);
      return {mask, transparent, bg: null};
    }
    const bg = o.bg || detectBackground(d, W, H),
      t2 = o.tolerance * o.tolerance;
    for (let i = 0; i < n; i++) {
      const j = i * 4,
        dr = d[j] - bg[0],
        dg = d[j + 1] - bg[1],
        db = d[j + 2] - bg[2];
      mask[i] = dr * dr + dg * dg + db * db > t2 ? 1 : 0;
    }
    return {mask, transparent, bg};
  }

  function flatPixels(d, mask, W, H, tol) {
    const flat = new Uint8Array(W * H);
    let count = 0;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (!mask[i]) continue;
        const j = i * 4;
        let ok = true;
        for (let dy = -1; dy <= 1 && ok; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const q = i + dy * W + dx,
              k = q * 4;
            if (
              !mask[q] ||
              Math.abs(d[j] - d[k]) > tol ||
              Math.abs(d[j + 1] - d[k + 1]) > tol ||
              Math.abs(d[j + 2] - d[k + 2]) > tol
            ) {
              ok = false;
              break;
            }
          }
        if (ok) {
          flat[i] = 1;
          count++;
        }
      }
    return {flat, count};
  }

  function findPalette(d, pool, total, n, o) {
    const bins = new Map();
    for (let i = 0; i < n; i++) {
      if (!pool[i]) continue;
      const j = i * 4,
        key = ((d[j] >> 3) << 10) | ((d[j + 1] >> 3) << 5) | (d[j + 2] >> 3);
      let b = bins.get(key);
      if (!b) bins.set(key, (b = [0, 0, 0, 0]));
      b[0]++;
      b[1] += d[j];
      b[2] += d[j + 1];
      b[3] += d[j + 2];
    }
    const order = [...bins.values()].sort((a, b) => b[0] - a[0]),
      centers = (o.seeds || []).map(c => [...c]),
      gap2 = o.colorGap * o.colorGap,
      minCount = Math.max(20, total * o.minShare);
    for (const b of order) {
      if (centers.length >= o.maxColors || b[0] < minCount) break;
      const c = [b[1] / b[0], b[2] / b[0], b[3] / b[0]];
      if (centers.every(q => dist2(q, c) > gap2)) centers.push(c);
    }
    return centers.length ? centers : [[128, 128, 128]];
  }

  function segDist(p, a, b) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      len = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2,
      t = len
        ? Math.min(
            1,
            Math.max(0, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / len),
          )
        : 0;
    return {d2: dist2(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]), t};
  }

  function nearest(d, j, centers, allowed) {
    let best = 0,
      bd = Infinity;
    for (let c = 0; c < centers.length; c++) {
      if (allowed && !(allowed & (1 << c))) continue;
      const q = centers[c],
        dd = (q[0] - d[j]) ** 2 + (q[1] - d[j + 1]) ** 2 + (q[2] - d[j + 2]) ** 2;
      if (dd < bd) {
        bd = dd;
        best = c;
      }
    }
    return best;
  }

  function classifyEdge(d, j, centers, allowed, bg) {
    const p = [d[j], d[j + 1], d[j + 2]],
      ids = [];
    for (let c = 0; c < centers.length; c++) if (!allowed || allowed & (1 << c)) ids.push(c);
    let best = ids[0],
      bd = Infinity;
    for (const c of ids) {
      let dd = dist2(p, centers[c]);
      if (bg) dd = Math.min(dd, segDist(p, bg, centers[c]).d2);
      if (dd < bd) {
        bd = dd;
        best = c;
      }
    }
    for (let u = 0; u < ids.length; u++)
      for (let v = u + 1; v < ids.length; v++) {
        const r = segDist(p, centers[ids[u]], centers[ids[v]]);
        if (r.d2 < bd) {
          bd = r.d2;
          best = r.t < 0.5 ? ids[u] : ids[v];
        }
      }
    return best;
  }

  function refineCenters(d, pool, n, centers) {
    for (let pass = 0; pass < 2; pass++) {
      const acc = centers.map(() => [0, 0, 0, 0]);
      for (let i = 0; i < n; i++) {
        if (!pool[i]) continue;
        const j = i * 4,
          a = acc[nearest(d, j, centers, 0)];
        a[0] += d[j];
        a[1] += d[j + 1];
        a[2] += d[j + 2];
        a[3]++;
      }
      acc.forEach((a, c) => {
        if (a[3]) centers[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
      });
    }
  }

  function assignGroups(d, mask, flat, W, H, centers, bg) {
    const n = W * H,
      group = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (mask[i] && flat[i]) group[i] = nearest(d, i * 4, centers, 0);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!mask[i] || flat[i]) continue;
        let near = 0;
        for (let yy = Math.max(0, y - 2); yy <= Math.min(H - 1, y + 2); yy++)
          for (let xx = Math.max(0, x - 2); xx <= Math.min(W - 1, x + 2); xx++) {
            const q = yy * W + xx;
            if (flat[q]) near |= 1 << group[q];
          }
        group[i] = near ? classifyEdge(d, i * 4, centers, near, bg) : classifyEdge(d, i * 4, centers, 0, bg);
      }
    return group;
  }

  function cleanSpecks(mask, group, W, H, limit) {
    const n = W * H,
      key = new Int16Array(n),
      seen = new Uint8Array(n),
      stack = new Int32Array(n),
      fixes = [];
    for (let i = 0; i < n; i++) key[i] = mask[i] ? group[i] + 1 : 0;
    for (let s = 0; s < n; s++) {
      if (seen[s]) continue;
      const k = key[s],
        members = [],
        tally = new Map();
      let sp = 0,
        edge = false,
        big = false;
      stack[sp++] = s;
      seen[s] = 1;
      while (sp) {
        const p = stack[--sp],
          px = p % W,
          py = (p - px) / W;
        if (!big) {
          members.push(p);
          if (members.length > limit) big = true;
        }
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const xx = px + dx,
            yy = py + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) {
            edge = true;
            continue;
          }
          const q = yy * W + xx;
          if (key[q] === k) {
            if (!seen[q]) {
              seen[q] = 1;
              stack[sp++] = q;
            }
          } else if (!big) tally.set(key[q], (tally.get(key[q]) || 0) + 1);
        }
      }
      if (big || !tally.size || (k === 0 && edge)) continue;
      let target = 0,
        best = -1;
      tally.forEach((c, v) => {
        if (c > best) {
          best = c;
          target = v;
        }
      });
      fixes.push([members, target, k]);
    }
    let removed = 0;
    for (const [members, target, k] of fixes) {
      if (k > 0 && target === 0) removed++;
      for (const p of members) {
        mask[p] = target ? 1 : 0;
        if (target) group[p] = target - 1;
      }
    }
    return removed;
  }

  function labelShapes(mask, group, groups, W, H, merge) {
    const n = W * H,
      lab = new Int32Array(n),
      stack = new Int32Array(n);
    const labGroup = [0];
    let next = 0;
    for (let g = 0; g < groups; g++) {
      const own = new Uint8Array(n);
      for (let i = 0; i < n; i++) own[i] = mask[i] && group[i] === g ? 1 : 0;
      const reach = dilate(own, W, H, merge);
      const seen = new Uint8Array(n);
      for (let s = 0; s < n; s++) {
        if (!reach[s] || seen[s]) continue;
        next++;
        labGroup[next] = g;
        let sp = 0;
        stack[sp++] = s;
        seen[s] = 1;
        while (sp) {
          const p = stack[--sp],
            px = p % W,
            py = (p - px) / W;
          if (own[p]) lab[p] = next;
          for (let dy = -1; dy <= 1; dy++) {
            const yy = py + dy;
            if (yy < 0 || yy >= H) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const xx = px + dx;
              if (xx < 0 || xx >= W) continue;
              const q = yy * W + xx;
              if (reach[q] && !seen[q]) {
                seen[q] = 1;
                stack[sp++] = q;
              }
            }
          }
        }
      }
    }
    return {lab, count: next, labGroup};
  }

  function collect(lab, count, W, H) {
    const info = Array.from({length: count + 1}, () => ({
      area: 0,
      x0: W,
      y0: H,
      x1: -1,
      y1: -1,
    }));
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const l = lab[y * W + x];
        if (!l) continue;
        const f = info[l];
        f.area++;
        if (x < f.x0) f.x0 = x;
        if (x > f.x1) f.x1 = x;
        if (y < f.y0) f.y0 = y;
        if (y > f.y1) f.y1 = y;
      }
    return info;
  }

  function blendAlpha(d, j, fg, other) {
    const den = dist2(fg, other);
    if (!den) return 1;
    const t =
      ((d[j] - other[0]) * (fg[0] - other[0]) +
        (d[j + 1] - other[1]) * (fg[1] - other[1]) +
        (d[j + 2] - other[2]) * (fg[2] - other[2])) /
      den;
    return Math.min(1, Math.max(0, t));
  }

  function buildPiece(S, id, f) {
    const {d, lab, W, H, bg, mask, group, centers, labGroup} = S,
      x0 = Math.max(0, f.x0 - 1),
      y0 = Math.max(0, f.y0 - 1),
      x1 = Math.min(W - 1, f.x1 + 1),
      y1 = Math.min(H - 1, f.y1 + 1),
      w = x1 - x0 + 1,
      h = y1 - y0 + 1,
      canvas = newCanvas(w, h),
      ctx = canvas.getContext('2d'),
      img = ctx.createImageData(w, h),
      out = img.data,
      inner = new Uint8Array(w * h),
      g = labGroup[id],
      Cg = centers[g],
      multi = centers.length > 1,
      inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H,
      own = (x, y) => inb(x, y) && lab[y * W + x] === id,
      isBg = (x, y) => !inb(x, y) || !mask[y * W + x],
      rival = (x, y) => {
        let best = null;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const px = x + dx,
            py = y + dy;
          if (!inb(px, py) || !mask[py * W + px] || lab[py * W + px] === id) continue;
          if (group[py * W + px] === g) continue;
          const c = centers[group[py * W + px]];
          if (!best || dist2(c, Cg) < dist2(best, Cg)) best = c;
        }
        return best;
      };
    const edge = [];
    let sr = 0,
      sg = 0,
      sb = 0,
      si = 0;
    for (let y = f.y0; y <= f.y1; y++)
      for (let x = f.x0; x <= f.x1; x++) {
        if (!own(x, y)) continue;
        const j = (y * W + x) * 4,
          k = (y - y0) * w + (x - x0),
          o = k * 4;
        out[o] = d[j];
        out[o + 1] = d[j + 1];
        out[o + 2] = d[j + 2];
        out[o + 3] = d[j + 3];
        if (
          bg &&
          (isBg(x - 1, y) ||
            isBg(x + 1, y) ||
            isBg(x, y - 1) ||
            isBg(x, y + 1) ||
            isBg(x - 1, y - 1) ||
            isBg(x + 1, y - 1) ||
            isBg(x - 1, y + 1) ||
            isBg(x + 1, y + 1))
        ) {
          edge.push(x, y);
          continue;
        }
        inner[k] = 1;
        sr += d[j];
        sg += d[j + 1];
        sb += d[j + 2];
        si++;
        const other = multi ? rival(x, y) : null;
        if (other) {
          const a = blendAlpha(d, j, Cg, other);
          if (a < 0.97) {
            out[o] = Cg[0];
            out[o + 1] = Cg[1];
            out[o + 2] = Cg[2];
            out[o + 3] = Math.round(a * 255);
          }
        }
      }
    let color = si ? [sr / si, sg / si, sb / si] : null;
    if (bg && edge.length) {
      if (!color) {
        let far = -1;
        for (let e = 0; e < edge.length; e += 2) {
          const j = (edge[e + 1] * W + edge[e]) * 4,
            dd = dist2([d[j], d[j + 1], d[j + 2]], bg);
          if (dd > far) {
            far = dd;
            color = [d[j], d[j + 1], d[j + 2]];
          }
        }
      }
      for (let e = 0; e < edge.length; e += 2) {
        const x = edge[e],
          y = edge[e + 1],
          j = (y * W + x) * 4,
          o = ((y - y0) * w + (x - x0)) * 4;
        let r = 0,
          gg = 0,
          b = 0,
          c = 0;
        for (let yy = y - 2; yy <= y + 2; yy++)
          for (let xx = x - 2; xx <= x + 2; xx++) {
            if (xx < x0 || xx > x1 || yy < y0 || yy > y1 || !inner[(yy - y0) * w + (xx - x0)]) continue;
            const q = ((yy - y0) * w + (xx - x0)) * 4;
            r += out[q];
            gg += out[q + 1];
            b += out[q + 2];
            c++;
          }
        const F = c ? [r / c, gg / c, b / c] : color;
        if (dist2(F, bg) < 64) continue;
        const a = blendAlpha(d, j, F, bg);
        if (a >= 0.97) continue;
        out[o] = F[0];
        out[o + 1] = F[1];
        out[o + 2] = F[2];
        out[o + 3] = Math.round(a * 255);
      }
    }
    if (multi)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const p = y * W + x;
          if (own(x, y) || !mask[p] || group[p] === g) continue;
          if (!(own(x - 1, y) || own(x + 1, y) || own(x, y - 1) || own(x, y + 1))) continue;
          const a = blendAlpha(d, p * 4, Cg, centers[group[p]]);
          if (a <= 0.08) continue;
          const o = ((y - y0) * w + (x - x0)) * 4;
          out[o] = Cg[0];
          out[o + 1] = Cg[1];
          out[o + 2] = Cg[2];
          out[o + 3] = Math.round(a * 255);
        }
    if (!color) color = Cg;
    ctx.putImageData(img, 0, 0);
    return {canvas, x: x0, y: y0, w, h, area: f.area, color: hex(...color)};
  }

  function boxBlur(a, W, H, r) {
    const tmp = new Float32Array(W * H),
      win = 2 * r + 1;
    for (let y = 0; y < H; y++) {
      let s = 0;
      const row = y * W;
      for (let x = -r; x <= r; x++) s += a[row + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        tmp[row + x] = s / win;
        s += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / win;
        s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
      }
    }
  }

  function smoothEdges(c, level) {
    const longest = Math.max(c.width, c.height),
      k = Math.min(4, Math.max(2, Math.ceil(1200 / longest)));
    if (!level || longest > 900) return c;
    const W = c.width * k,
      H = c.height * k,
      big = newCanvas(W, H),
      x = big.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, W, H);
    const img = x.getImageData(0, 0, W, H),
      d = img.data,
      a = new Float32Array(W * H),
      steep = level === 1 ? 3.2 : 4.5,
      r = level === 1 ? Math.max(1, Math.round(k * 0.5)) : Math.max(2, Math.round(k * 0.9));
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
    boxBlur(a, W, H, r);
    boxBlur(a, W, H, r);
    for (let i = 0; i < a.length; i++)
      d[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, (a[i] - 0.5) * steep + 0.5)) * 255);
    x.putImageData(img, 0, 0);
    return big;
  }

  function separate(source, opts = {}) {
    const o = {
      byColor: true,
      byShape: true,
      tolerance: 40,
      merge: 0,
      minArea: 0.001,
      maxColors: 6,
      colorGap: 70,
      minShare: 0.001,
      flatTol: 18,
      keepBg: false,
      seeds: [],
      bg: null,
      smooth: 1,
      ...opts,
    };
    const W = source.width,
      H = source.height,
      n = W * H,
      d = source.getContext('2d').getImageData(0, 0, W, H).data,
      {mask, transparent, bg} = foregroundMask(d, W, H, o),
      count0 = mask.reduce((a, v) => a + v, 0);
    if (!count0) return {pieces: [], ignored: 0, transparent, bg, colors: []};
    const {flat, count: flatCount} = flatPixels(d, mask, W, H, o.flatTol),
      pool = flatCount >= 50 ? flat : mask,
      poolCount = flatCount >= 50 ? flatCount : count0;
    let group = new Uint8Array(n),
      centers = [[0, 0, 0]];
    if (o.byColor) {
      centers = findPalette(d, pool, poolCount, n, o);
      refineCenters(d, pool, n, centers);
      group = assignGroups(d, mask, pool, W, H, centers, bg);
    }
    let ignored = cleanSpecks(mask, group, W, H, Math.max(6, Math.round(count0 * o.minArea)));
    let fgCount = 0;
    for (let i = 0; i < n; i++) fgCount += mask[i];
    if (!fgCount) return {pieces: [], ignored, transparent, bg, colors: []};
    let {lab, count, labGroup} = labelShapes(mask, group, centers.length, W, H, o.byShape ? o.merge : 0);
    const minPx = Math.max(4, Math.round(fgCount * o.minArea));
    if (!o.byShape) {
      const area = collect(lab, count, W, H),
        kept = new Int32Array(n);
      for (let i = 0; i < n; i++) if (lab[i] && area[lab[i]].area >= minPx) kept[i] = group[i] + 1;
      lab = kept;
      count = centers.length;
      labGroup = Array.from({length: count + 1}, (_, i) => Math.max(0, i - 1));
    }
    const info = collect(lab, count, W, H),
      pieces = [];
    for (let id = 1; id <= count; id++) {
      const f = info[id];
      if (!f.area) continue;
      if (f.area < minPx) {
        ignored++;
        continue;
      }
      const piece = buildPiece({d, lab, W, H, bg, mask, group, centers, labGroup}, id, f);
      piece.canvas = smoothEdges(piece.canvas, o.smooth);
      pieces.push(piece);
    }
    pieces.sort((a, b) => a.x - b.x || a.y - b.y);
    pieces.forEach((p, i) => (p.n = i + 1));
    return {pieces, ignored, transparent, bg, colors: o.byColor ? centers.map(c => hex(...c)) : []};
  }

  window.MoonPrint = {
    SHEETS,
    planTiles,
    fitToSheets,
    packShelves,
    renderPacked,
    renderSheet,
    renderGuide,
    drawPlanPreview,
    separate,
  };
})();
