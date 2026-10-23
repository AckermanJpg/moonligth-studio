// Conversion: jpg / png / pdf / zip
const extOf = m => (m === 'image/png' ? 'png' : m === 'image/webp' ? 'webp' : 'jpg');
const toBlob = (c, t, q) => new Promise(r => c.toBlob(r, t, q));
const loadImg = src =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
function buildPDF(pages) {
  const enc = new TextEncoder(),
    chunks = [],
    offs = [];
  let len = 0;
  const push = b => {
    if (typeof b === 'string') b = enc.encode(b);
    chunks.push(b);
    len += b.length;
  };
  const obj = (n, fn) => {
    offs[n] = len;
    push(`${n} 0 obj\n`);
    fn();
    push('\nendobj\n');
  };
  push('%PDF-1.4\n');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () =>
    push(
      `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    ),
  );
  pages.forEach((p, i) => {
    const pn = 3 + i * 3,
      cn = pn + 1,
      im = pn + 2,
      W = p.pw.toFixed(2),
      H = p.ph.toFixed(2),
      cs = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(pn, () =>
      push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${cn} 0 R >>`,
      ),
    );
    obj(cn, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
    obj(im, () => {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`,
      );
      push(p.jpg);
      push('\nendstream');
    });
  });
  const total = 2 + pages.length * 3,
    xr = len;
  push(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let n = 1; n <= total; n++) push(String(offs[n]).padStart(10, '0') + ' 00000 n \n');
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
  return new Blob(chunks, {type: 'application/pdf'});
}
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = b => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function buildZip(files) {
  const enc = new TextEncoder(),
    parts = [],
    cen = [];
  let off = 0,
    cs = 0;
  files.forEach(f => {
    const nm = enc.encode(f.name),
      crc = crc32(f.data),
      sz = f.data.length,
      lh = new DataView(new ArrayBuffer(30));
    [
      [0, 0x04034b50, 4],
      [4, 20, 2],
      [6, 0, 2],
      [8, 0, 2],
      [10, 0, 2],
      [12, 0x21, 2],
      [14, crc, 4],
      [18, sz, 4],
      [22, sz, 4],
      [26, nm.length, 2],
      [28, 0, 2],
    ].forEach(([o, v, n]) => (n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true)));
    parts.push(lh, nm, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    [
      [0, 0x02014b50, 4],
      [4, 20, 2],
      [6, 20, 2],
      [8, 0, 2],
      [10, 0, 2],
      [12, 0, 2],
      [14, 0x21, 2],
      [16, crc, 4],
      [20, sz, 4],
      [24, sz, 4],
      [28, nm.length, 2],
      [30, 0, 2],
      [32, 0, 2],
      [34, 0, 2],
      [36, 0, 2],
      [38, 0, 4],
      [42, off, 4],
    ].forEach(([o, v, n]) => (n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true)));
    cen.push(ch, nm);
    cs += 46 + nm.length;
    off += 30 + nm.length + sz;
  });
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cs, true);
  end.setUint32(16, off, true);
  return new Blob([...parts, ...cen, end], {type: 'application/zip'});
}
async function hostDownloads() {
  try {
    return (await window.claude?.use?.('downloads')) || null;
  } catch {
    return null;
  }
}
async function saveFile(filename, blob) {
  const dl = await hostDownloads();
  if (!dl) {
    const u = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = u;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 10000);
    toast('Listo: ' + filename);
    return;
  }
  try {
    await dl.save({filename, data: blob});
    toast('Listo: ' + filename);
  } catch (e) {
    toast(
      e && e.code === 'declined'
        ? 'Descarga cancelada'
        : 'No se pudo descargar (' + ((e && e.code) || 'error') + ')',
    );
  }
}
async function doExport() {
  const c = S.conv;
  toast('Generando…');
  await loadFonts();
  const idxs = c.pages === 'all' ? S.pages.map((_, i) => i) : [S.cur],
    png = c.fmt === 'png' || c.fmt === 'webp',
    mime = c.fmt === 'png' ? 'image/png' : c.fmt === 'webp' ? 'image/webp' : 'image/jpeg';
  const base = slug(S.name),
    out = [];
  const flat = cn => {
    if (png) return cn;
    const f = cv(cn.width, cn.height),
      fx = f.getContext('2d');
    fx.fillStyle = '#ffffff';
    fx.fillRect(0, 0, f.width, f.height);
    fx.drawImage(cn, 0, 0);
    return f;
  };
  for (const i of idxs) {
    const cn = flat(renderPageCanvas(S.pages[i], c.scale));
    out.push({cn, blob: await toBlob(cn, mime, c.q / 100)});
  }
  const ext = extOf(out[0].blob.type);
  if (c.fmt === 'pdf') {
    const pgs = [];
    for (const o of out)
      pgs.push({
        jpg: new Uint8Array(await o.blob.arrayBuffer()),
        w: o.cn.width,
        h: o.cn.height,
        pw: S.w * 0.75,
        ph: S.h * 0.75,
      });
    return saveFile(base + '.pdf', buildPDF(pgs));
  }
  if (out.length === 1) return saveFile(`${base}.${ext}`, out[0].blob);
  const files = [];
  for (let i = 0; i < out.length; i++)
    files.push({
      name: `${base}_${String(i + 1).padStart(2, '0')}.${ext}`,
      data: new Uint8Array(await out[i].blob.arrayBuffer()),
    });
  saveFile(base + '.zip', buildZip(files));
}
async function convertImages(list, fmt) {
  const fs = [...list].filter(f => f.type.startsWith('image/'));
  if (!fs.length) {
    toast('Elige al menos una imagen');
    return;
  }
  toast('Convirtiendo…');
  const out = [];
  try {
    for (const f of fs) {
      const u = URL.createObjectURL(f),
        im = await loadImg(u),
        c = cv(im.naturalWidth, im.naturalHeight),
        x = c.getContext('2d');
      if (fmt !== 'png') {
        x.fillStyle = '#ffffff';
        x.fillRect(0, 0, c.width, c.height);
      }
      x.drawImage(im, 0, 0);
      URL.revokeObjectURL(u);
      out.push({
        name: f.name.replace(/\.[^.]+$/, '') || 'imagen',
        c,
        blob: await toBlob(c, fmt === 'png' ? 'image/png' : 'image/jpeg', S.conv.q / 100),
      });
    }
  } catch {
    toast('No se pudo leer una de las imágenes');
    return;
  }
  if (fmt === 'pdf') {
    const pgs = [];
    for (const o of out)
      pgs.push({
        jpg: new Uint8Array(await o.blob.arrayBuffer()),
        w: o.c.width,
        h: o.c.height,
        pw: o.c.width * 0.75,
        ph: o.c.height * 0.75,
      });
    return saveFile('imagenes.pdf', buildPDF(pgs));
  }
  const ext = fmt === 'png' ? 'png' : 'jpg';
  if (out.length === 1) return saveFile(`${out[0].name}.${ext}`, out[0].blob);
  const files = [];
  for (let i = 0; i < out.length; i++)
    files.push({
      name: `${out[i].name}_${i + 1}.${ext}`,
      data: new Uint8Array(await out[i].blob.arrayBuffer()),
    });
  saveFile(`imagenes_${ext}.zip`, buildZip(files));
}
function loadPdfjs() {
  if (window.pdfjsLib) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.integrity = 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e';
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      res();
    };
    s.onerror = () => rej(new Error('pdfjs'));
    document.head.append(s);
  });
}
async function importPDF(file) {
  if (!file) return;
  toast('Leyendo PDF…');
  try {
    await loadPdfjs();
    const doc = await window.pdfjsLib.getDocument({
        data: await file.arrayBuffer(),
        isEvalSupported: false,
      }).promise,
      n = Math.min(doc.numPages, 30),
      made = [];
    let W = S.w,
      H = S.h;
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i),
        v1 = page.getViewport({scale: 1}),
        sc = 1600 / Math.max(v1.width, v1.height),
        v = page.getViewport({scale: sc}),
        c = cv(Math.round(v.width), Math.round(v.height)),
        x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height);
      await page.render({canvasContext: x, viewport: v}).promise;
      if (i === 1 && S.conv.fitpdf) {
        W = c.width;
        H = c.height;
      }
      made.push({src: c.toDataURL('image/jpeg', 0.88), w: c.width, h: c.height});
      toast(`Página ${i} de ${n}…`);
    }
    touch(true);
    if (S.conv.fitpdf) {
      S.w = W;
      S.h = H;
      S.fit = true;
    }
    const pgsNew = made.map(m => {
      const p = newPage({pat: 'solid', c1: '#ffffff', c2: '#ffffff'}),
        k = Math.min(S.w / m.w, S.h / m.h),
        w = Math.round(m.w * k),
        h = Math.round(m.h * k);
      p.els.push(
        mk('image', {src: m.src, w, h, x: Math.round((S.w - w) / 2), y: Math.round((S.h - h) / 2), px: 1}),
      );
      return p;
    });
    S.pages.splice(S.cur + 1, 0, ...pgsNew);
    S.cur++;
    S.sel = [];
    refresh({props: true, panel: true, fit: true});
    toast(`PDF importado: ${made.length} página(s)${doc.numPages > n ? ' (máx. 30)' : ''}`);
  } catch {
    toast('No se pudo abrir el PDF');
  }
}
