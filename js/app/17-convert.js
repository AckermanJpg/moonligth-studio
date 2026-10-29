// Conversion: jpg / png / pdf / zip
(() => {
  Object.assign(window, {buildPDF, buildZip, saveFile, doExport, convertImages, importPDF});
  Object.assign(window, {shareExport, canShareFiles});
  const extOf = m => (m === 'image/png' ? 'png' : m === 'image/webp' ? 'webp' : 'jpg');
  Object.assign(window, {extOf});
  const toBlob = (c, t, q) => new Promise(r => c.toBlob(r, t, q));
  Object.assign(window, {toBlob});
  const loadImg = src =>
    new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  Object.assign(window, {loadImg});
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
  const VIDEO_TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'],
    ANIM_PIXELS = 90e6;
  const vlen = x => Math.clz32(x) - 23;
  function ebml(b, p) {
    const idn = vlen(b[p]),
      q = p + idn,
      sn = vlen(b[q]);
    if (idn > 4 || sn > 8 || q + sn > b.length) throw new Error('webm');
    let id = 0,
      size = b[q] & (0xff >> sn);
    for (let i = 0; i < idn; i++) id = id * 256 + b[p + i];
    for (let i = 1; i < sn; i++) size = size * 256 + b[q + i];
    return {id, q, sn, data: q + sn, size: size === 2 ** (7 * sn) - 1 ? -1 : size};
  }
  async function webmDuration(blob, ms) {
    const b = new Uint8Array(await blob.slice(0, 4096).arrayBuffer()),
      rest = blob.slice(b.length);
    try {
      let e = ebml(b, 0);
      if (e.id !== 0x1a45dfa3) return blob;
      const seg = ebml(b, e.data + e.size);
      if (seg.id !== 0x18538067) return blob;
      for (let p = seg.data; (e = ebml(b, p)).id !== 0x1549a966; p = e.data + e.size)
        if (e.size < 0 || e.id === 0x1f43b675 || (e.id === 0x114d9b74 && e.size)) return blob;
      const end = e.data + e.size;
      if (end > b.length) return blob;
      let scale = 1e6,
        dur = null;
      for (let q = e.data; q < end;) {
        const c = ebml(b, q);
        if (c.id === 0x2ad7b1) for (let i = 0, v = 0; i < c.size; i++) scale = v = v * 256 + b[c.data + i];
        if (c.id === 0x4489) dur = c;
        q = c.data + c.size;
      }
      const value = (ms * 1e6) / scale;
      if (dur) {
        const dv = new DataView(b.buffer);
        if (dur.size === 8) dv.setFloat64(dur.data, value);
        else if (dur.size === 4) dv.setFloat32(dur.data, value);
        else return blob;
        return new Blob([b, rest], {type: blob.type});
      }
      const size = e.size + 11;
      if (size >= 2 ** (7 * e.sn) - 1) return blob;
      const head = new Uint8Array(b.length + 11),
        dv = new DataView(head.buffer);
      head.set(b.subarray(0, e.q));
      for (let i = e.sn - 1, v = size; i >= 0; i--, v = Math.floor(v / 256)) head[e.q + i] = v & 0xff;
      head[e.q] |= 0x80 >> (e.sn - 1);
      head.set(b.subarray(e.data, end), e.data);
      head.set([0x44, 0x89, 0x88], end);
      dv.setFloat64(end + 3, value);
      head.set(b.subarray(end), end + 11);
      return new Blob([head, rest], {type: blob.type});
    } catch {
      return blob;
    }
  }
  Object.assign(window, {webmDuration});
  async function exportAnimated() {
    const c = S.conv,
      p = pg(),
      longest = mediaLongest(p);
    if (!longest) return toast('Esta página no tiene GIF ni videos');
    const gif = c.fmt === 'gif',
      fps = clamp(Math.round(c.fps || (gif ? 10 : 30)), 1, 30),
      dur = clamp(c.dur || longest, 0.5, 30),
      n = Math.max(1, Math.round(dur * fps)),
      sc = gif ? Math.min(c.scale, Math.sqrt(ANIM_PIXELS / (S.w * S.h * n))) : c.scale,
      mime = !gif && window.MediaRecorder && VIDEO_TYPES.find(t => MediaRecorder.isTypeSupported(t)),
      base = slug(S.name);
    if (!gif && !mime) return toast('Este navegador no puede grabar video');
    toast('Preparando…');
    await loadFonts();
    await loadScript('js/gif-decoder.js');
    const tr = await mediaTrack(p),
      anim = pageAnimator(p, sc),
      frame = t => anim(tr.pick(t));
    try {
      if (gif) {
        await loadScript('js/gif-encoder.js');
        const frames = [];
        let cn;
        for (let k = 0; k < n; k++) {
          await tr.seek(k / fps);
          cn = frame(k / fps);
          frames.push({
            data: cn.getContext('2d').getImageData(0, 0, cn.width, cn.height).data,
            delay: 1 / fps,
          });
          if (k % 5 === 0) toast(`Componiendo cuadros: ${k + 1} de ${n}`);
        }
        toast('Creando GIF…');
        await new Promise(r => setTimeout(r, 30));
        return saveFile(base + '.gif', MoonGif.encode(frames, cn.width, cn.height, {dither: false}));
      }
      const first = frame(0),
        out = cv(first.width, first.height),
        x = out.getContext('2d'),
        stream = out.captureStream(fps),
        rec = new MediaRecorder(stream, {mimeType: mime, videoBitsPerSecond: 8e6}),
        chunks = [],
        stopped = new Promise(r => (rec.onstop = r));
      rec.ondataavailable = ev => ev.data.size && chunks.push(ev.data);
      await tr.seek(0);
      x.drawImage(first, 0, 0);
      await tr.play();
      rec.start(250);
      const t0 = performance.now();
      let shown = -1;
      await new Promise(res => {
        const step = () => {
          const t = (performance.now() - t0) / 1000;
          if (t >= dur) return res();
          x.drawImage(frame(t), 0, 0);
          if (Math.floor(t) !== shown) toast(`Grabando video: ${(shown = Math.floor(t))} de ${dur} s`);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      const took = performance.now() - t0;
      rec.stop();
      await stopped;
      stream.getTracks().forEach(t => t.stop());
      const type = mime.split(';')[0],
        blob = new Blob(chunks, {type});
      if (type === 'video/mp4') return saveFile(base + '.mp4', blob);
      return saveFile(base + '.webm', await webmDuration(blob, took));
    } finally {
      tr.close();
    }
  }
  async function pageImage(i) {
    const c = S.conv,
      png = c.fmt === 'png' || c.fmt === 'webp',
      mime = c.fmt === 'png' ? 'image/png' : c.fmt === 'webp' ? 'image/webp' : 'image/jpeg',
      p = S.pages[i];
    let cn = renderPageCanvas(png && c.transp ? {...p, bg: {...p.bg, pat: 'none'}} : p, c.scale);
    if (!png) {
      const f = cv(cn.width, cn.height),
        fx = f.getContext('2d');
      fx.fillStyle = '#ffffff';
      fx.fillRect(0, 0, f.width, f.height);
      fx.drawImage(cn, 0, 0);
      cn = f;
    }
    return {cn, blob: await toBlob(cn, mime, c.q / 100)};
  }
  async function doExport() {
    const c = S.conv;
    if (c.fmt === 'gif' || c.fmt === 'video') return exportAnimated();
    toast('Generando…');
    await loadFonts();
    const idxs = c.pages === 'all' ? S.pages.map((_, i) => i) : [S.cur];
    const base = slug(S.name),
      out = [];
    for (const i of idxs) out.push(await pageImage(i));
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
  function canShareFiles() {
    try {
      return (
        location.protocol !== 'file:' &&
        !!navigator.canShare &&
        !!navigator.share &&
        navigator.canShare({files: [new File([''], 'prueba.png', {type: 'image/png'})]})
      );
    } catch {
      return false;
    }
  }
  async function shareExport(b) {
    const key = snapshot() + JSON.stringify(S.conv);
    let file = b._key === key && b._file;
    b._file = null;
    b.textContent = 'Compartir';
    try {
      if (!file) {
        b.disabled = true;
        toast('Generando…');
        await loadFonts();
        const {blob} = await pageImage(S.cur);
        file = new File([blob], `${slug(S.name)}.${extOf(blob.type)}`, {type: blob.type});
        b.disabled = false;
      }
      await navigator.share({files: [file]});
    } catch (err) {
      b.disabled = false;
      if (err.name === 'NotAllowedError') {
        b._file = file;
        b._key = key;
        b.textContent = 'Compartir ahora';
        toast('La imagen está lista: toca Compartir ahora');
      } else if (err.name !== 'AbortError') toast('No se pudo compartir; usa Descargar');
    }
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
  const pdfError = e =>
    e && e.message === 'pdfjs'
      ? 'No se pudo cargar el lector de PDF: revisa tu conexión'
      : e && e.name === 'PasswordException'
        ? 'El PDF está protegido con contraseña'
        : e && e.name === 'InvalidPDFException'
          ? 'El archivo no es un PDF válido'
          : 'No se pudo abrir el PDF';
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
    } catch (e) {
      toast(pdfError(e));
    }
  }
})();
