// Export
let presIdx;
(() => {
  Object.assign(window, {renderPageCanvas, pageAnimator, openExport, openPresent, showPres, validateProject});
  function wrapLines(x, text, maxW) {
    const out = [];
    text.split('\n').forEach(par => {
      let line = '';
      par.split(' ').forEach(w => {
        const t = line ? line + ' ' + w : w;
        if (x.measureText(t).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = t;
      });
      out.push(line);
    });
    return out;
  }
  function drawText(x, e) {
    x.font = `${e.italic ? 'italic ' : ''}${e.bold ? '700 ' : '400 '}${e.size}px "${e.font}"`;
    x.textBaseline = 'top';
    x.fillStyle = e.grad ? gradOf(x, e) : e.fill;
    if ('letterSpacing' in x) x.letterSpacing = e.ls + 'px';
    if (e.tbg) {
      x.save();
      x.fillStyle = e.tbc || '#000000';
      x.fillRect(0, 0, e.w, e.h);
      x.restore();
    }
    const lh = e.size * e.lh,
      txt = e.upper ? e.text.toUpperCase() : e.text;
    if (e.tsw) {
      x.lineJoin = 'round';
      x.lineWidth = e.tsw;
      x.strokeStyle = e.tsc || '#000000';
      wrapLines(x, txt, e.w).forEach((l, i) => {
        const w = x.measureText(l).width;
        const tx = e.align === 'center' ? (e.w - w) / 2 : e.align === 'right' ? e.w - w : 0;
        x.strokeText(l, tx, i * lh + (lh - e.size) / 2);
      });
    }
    wrapLines(x, txt, e.w).forEach((l, i) => {
      const w = x.measureText(l).width;
      const tx = e.align === 'center' ? (e.w - w) / 2 : e.align === 'right' ? e.w - w : 0;
      x.fillText(l, tx, i * lh + (lh - e.size) / 2);
    });
  }
  const smoothImage = e => e.px <= 1 && !['sprite', 'draw', 'qr'].includes(e.type);
  Object.assign(window, {smoothImage});
  function drawEls(x, els, scale, pick) {
    els.forEach(e => {
      if (e.hidden || (e.type === 'image' && !e.src)) return;
      x.save();
      x.globalCompositeOperation = e.blend && e.blend !== 'normal' ? e.blend : 'source-over';
      x.translate(e.x + e.w / 2, e.y + e.h / 2);
      x.rotate((e.rot * Math.PI) / 180);
      x.translate(-e.w / 2, -e.h / 2);
      x.globalAlpha = e.op;
      if (e.shadow) {
        x.shadowColor = e.sc;
        x.shadowOffsetX = e.sd * scale;
        x.shadowOffsetY = e.sd * scale;
        x.shadowBlur = 0;
      }
      if (e.type === 'text') drawText(x, e);
      else {
        x.imageSmoothingEnabled = smoothImage(e);
        x.imageSmoothingQuality = 'high';
        x.drawImage((e.type === 'media' && pick(e)) || bitmap(e), 0, 0, e.w, e.h);
      }
      x.restore();
    });
  }
  function renderPageCanvas(p, scale, pick = mediaFrame) {
    const W = Math.round(S.w * scale),
      H = Math.round(S.h * scale),
      c = cv(W, H),
      x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (p.bg.pat !== 'none') x.drawImage(bgCanvas(p, S.w, S.h), 0, 0, W, H);
    x.save();
    x.scale(scale, scale);
    drawEls(x, p.els, scale, pick);
    x.restore();
    return c;
  }
  function pageAnimator(p, scale) {
    const i = p.els.findIndex(e => e.type === 'media'),
      base = renderPageCanvas({...p, els: p.els.slice(0, i)}, scale),
      rest = p.els.slice(i),
      layer = cv(base.width, base.height),
      lx = layer.getContext('2d'),
      out = cv(base.width, base.height),
      ox = out.getContext('2d', {willReadFrequently: true});
    ox.fillStyle = '#ffffff';
    return pick => {
      lx.clearRect(0, 0, layer.width, layer.height);
      lx.drawImage(base, 0, 0);
      lx.save();
      lx.scale(scale, scale);
      drawEls(lx, rest, scale, pick);
      lx.restore();
      ox.fillRect(0, 0, out.width, out.height);
      ox.drawImage(layer, 0, 0);
      return out;
    };
  }
  const usedFonts = () => {
    const u = new Set(['Press Start 2P', 'Silkscreen', 'VT323', 'DotGothic16', 'Pixelify Sans']);
    S.pages.forEach(p => p.els.forEach(e => e.type === 'text' && u.add(e.font)));
    return [...u];
  };
  const FONT_UI = ['Pixelify Sans', 'Jersey 25'];
  const FONT_BOLD = [
    'Silkscreen',
    'Pixelify Sans',
    'Playfair Display',
    'Merriweather',
    'Roboto Slab',
    'Montserrat',
    'Poppins',
    'Oswald',
    'Nunito',
    'Fredoka',
    'Space Mono',
  ];
  const fontSheets = new Map(FONT_UI.map(f => [f, Promise.resolve()]));
  Object.assign(window, {fontSheets});
  function addFontSheet(list) {
    const todo = list.filter(f => FONTS.includes(f) && !fontSheets.has(f));
    const p = new Promise(res => {
      if (!todo.length) return res();
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = `https://fonts.googleapis.com/css2?${todo.map(f => 'family=' + f.replace(/ /g, '+') + (FONT_BOLD.includes(f) ? ':wght@400;700' : '')).join('&')}&display=swap`;
      l.onload = l.onerror = () => res();
      document.head.append(l);
    });
    todo.forEach(f => fontSheets.set(f, p));
    return Promise.all(list.map(f => fontSheets.get(f)));
  }
  const loadFamilies = list =>
    addFontSheet(list).then(() =>
      Promise.all(
        list.flatMap(f => [document.fonts.load(`32px "${f}"`), document.fonts.load(`700 32px "${f}"`)]),
      ),
    );
  Object.assign(window, {loadFamilies});
  const loadFamily = f => loadFamilies([f]);
  Object.assign(window, {loadFamily});
  const loadAllFonts = () => addFontSheet(FONTS);
  Object.assign(window, {loadAllFonts});
  const loadFonts = () => loadFamilies(usedFonts()).catch(() => {});
  Object.assign(window, {loadFonts});
  const ELEMENT_TYPES = ['text', 'image', 'media', 'sprite', 'draw', 'qr', 'chart', ...SHAPES.map(s => s[0])];
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const validCredit = c =>
    !!c &&
    typeof c === 'object' &&
    !Array.isArray(c) &&
    Object.values(c).every(v => typeof v === 'string' && v.length <= 300) &&
    ['url', 'licenseUrl'].every(k => !c[k] || httpsUrl(c[k]));
  function mediaWhy(e) {
    const gif = e.mime === 'image/gif';
    if (!MEDIA_MIMES.includes(e.mime) || e.kind !== (gif ? 'gif' : 'video'))
      return 'tipo de medio no permitido';
    if (
      typeof e.src !== 'string' ||
      !(e.src.startsWith('@db:') || e.src.startsWith(`data:${e.mime};base64,`))
    )
      return 'medio sin archivo';
    if (
      !isNum(e.dur) ||
      e.dur <= 0 ||
      e.dur > (gif ? 3600 : 15.05) ||
      ![e.nw, e.nh].every(v => isNum(v) && v >= 1 && v <= 20000) ||
      (gif && !(Number.isInteger(e.frames) && e.frames >= 2 && e.frames <= 300))
    )
      return 'medio fuera de rango';
    return '';
  }
  function validateProject(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.pages) || !o.pages.length)
      return 'faltan las páginas';
    if (![o.w, o.h].every(v => isNum(v) && v >= 16 && v <= 5000)) return 'tamaño fuera de rango';
    for (const p of o.pages) {
      if (!p || !Array.isArray(p.els)) return 'página sin elementos';
      if (p.bg && p.bg.credit !== undefined && !validCredit(p.bg.credit)) return 'créditos inválidos';
      for (const e of p.els) {
        if (!e || !ELEMENT_TYPES.includes(e.type)) return 'tipo de elemento desconocido';
        if (![e.x, e.y, e.w, e.h].every(isNum)) return 'posición o tamaño no numérico';
        if (e.type === 'sprite' && !Object.hasOwn(SPR, e.spr)) return 'sprite inexistente';
        if (e.credit !== undefined && !validCredit(e.credit)) return 'créditos inválidos';
        if (e.type === 'media' && mediaWhy(e)) return mediaWhy(e);
      }
    }
    if ((JSON.stringify(o).match(/"@db:[^"]*"/g) || []).some(s => !hasMedia(s.slice(5, -1))))
      return 'falta una imagen guardada';
    return '';
  }
  async function openExport() {
    await loadFonts();
    const M = $('#mbox');
    M.innerHTML = `<h3>Compartir / Exportar</h3><div class="row"><label>Escala</label><select id="xs" style="width:90px"><option value="1">1×</option><option value="2">2×</option><option value="0.5">0.5×</option></select>
  <button class="btn sm" id="xcur">PNG página actual</button><button class="btn sm" id="xall">Todas las páginas</button><button class="btn sm" id="xcopy">Copiar imagen</button><button class="btn sm warn" id="xclose">Cerrar</button></div>
  <p class="hint">Haz clic derecho o mantén pulsada la imagen para guardarla. Para descargarla directo, usa el botón Descargar del panel Exportar.</p><div id="xout"></div>
  <h4>Proyecto (JSON)</h4><div id="xjbig"></div><textarea id="xjson" aria-label="JSON del proyecto" spellcheck="false"></textarea><div class="row"><button class="btn sm" id="xload">Cargar JSON</button><button class="btn sm" id="xjcopy">Copiar JSON</button></div>`;
    $('#modal').classList.add('on');
    bigJSON = await exportJSON();
    if (bigJSON.length > 20e6 && S.pages.some(p => p.els.some(e => e.type === 'media' && e.kind === 'video')))
      $('#xjbig').innerHTML =
        `<p class="hint" id="xbig" style="color:var(--gold)">Con los videos, el JSON pesa ${Math.round(bigJSON.length / MB)} MB: puede fallar al copiarlo o al abrirlo en otro lado. Expórtalo sin los videos para que funcione en cualquier navegador.</p><div class="row"><button class="btn sm on" id="xnovid">Exportar sin videos</button><button class="btn sm" id="xvid">Incluir los videos igual</button></div>`;
    else $('#xjson').value = bigJSON;
  }
  let bigJSON = '';
  const MB = 1048576;
  $('#mbox').addEventListener('click', async ev => {
    const id = ev.target.id,
      sc = () => +$('#xs').value;
    const show = async idxs => {
      await loadFonts();
      $('#xout').innerHTML = '';
      idxs.forEach(i => {
        const im = new Image();
        im.src = renderPageCanvas(S.pages[i], sc()).toDataURL('image/png');
        im.alt = 'Página ' + (i + 1);
        $('#xout').append(im);
      });
    };
    if (id === 'xnovid') $('#xjson').value = await exportJSON(true);
    else if (id === 'xvid') $('#xjson').value = bigJSON;
    if (id === 'xnovid' || id === 'xvid') $('#xjbig').innerHTML = '';
    if (id === 'xclose') $('#modal').classList.remove('on');
    else if (id === 'xcur') show([S.cur]);
    else if (id === 'xall') show(S.pages.map((_, i) => i));
    else if (id === 'xcopy') {
      await loadFonts();
      renderPageCanvas(pg(), sc()).toBlob(async b => {
        try {
          await navigator.clipboard.write([new ClipboardItem({'image/png': b})]);
          toast('Imagen copiada');
        } catch {
          toast('El navegador no permite copiar; guarda la imagen con clic derecho');
          show([S.cur]);
        }
      });
    } else if (id === 'xjcopy') {
      try {
        await navigator.clipboard.writeText($('#xjson').value);
        toast('JSON copiado');
      } catch {
        $('#xjson').select();
      }
    } else if (id === 'xload') {
      let why, o;
      try {
        o = JSON.parse($('#xjson').value);
        why = validateProject(o);
      } catch {
        why = 'no se puede leer';
      }
      if (why) toast(`JSON inválido: ${why}`);
      else {
        const missing = await importMedia(o);
        try {
          touch(true);
          restore(JSON.stringify(o));
          $('#modal').classList.remove('on');
          refresh({props: true, panel: true, fit: true});
          toast(
            missing
              ? `Proyecto cargado; ${missing === 1 ? '1 medio no se pudo leer' : missing + ' medios no se pudieron leer'}`
              : 'Proyecto cargado',
          );
        } catch {
          hist.pop();
          toast('JSON inválido');
        }
      }
    } else if (ev.target === $('#modal')) $('#modal').classList.remove('on');
  });
  $('#modal').addEventListener('click', ev => {
    if (ev.target.id === 'modal') $('#modal').classList.remove('on');
  });
  presIdx = 0;
  async function openPresent() {
    await loadFonts();
    presIdx = S.cur;
    showPres();
    $('#present').classList.add('on');
  }
  function showPres() {
    $('#pimg').src = renderPageCanvas(S.pages[presIdx], Math.min(1, 1920 / Math.max(S.w, S.h))).toDataURL(
      'image/png',
    );
  }
  $('#pclose').onclick = () => $('#present').classList.remove('on');
  $('#present').addEventListener('click', e => {
    if (e.target.id === 'pimg') {
      presIdx = (presIdx + 1) % S.pages.length;
      showPres();
    }
  });
})();
