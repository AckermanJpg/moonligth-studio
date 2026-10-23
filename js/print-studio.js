(() => {
  const P = window.MoonPrint;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ANALYSIS_MAX = 3600;
  const SOURCE_MAX = 4000;
  const BOX_COLORS = ['#ff3d6e', '#3fe0ff', '#ffd84a', '#1de9b6', '#8a2be2', '#ff9b3d'];
  const UNITS = {cm: 1, mm: 10, in: 1 / 2.54, m: 0.01};
  const MAX_SHEETS = 150;
  const QUICK_WIDTHS = [30, 50, 80, 100, 150];

  let core, M;
  const slug = (text, fallback) => core.slug(text, fallback);
  const st = {
    tool: 'poster',
    src: null,
    plan: null,
    pending: '',
    pointerDown: false,
    timer: 0,
    unit: 'cm',
    sel: new Set(),
    poster: {
      mode: 'size',
      width: 0,
      height: 0,
      cols: 2,
      rows: 2,
      lock: true,
      sheet: 'a4',
      sw: 21,
      sh: 29.7,
      orient: 'auto',
      margin: 1,
      overlap: 1,
      marks: true,
      label: true,
      guide: true,
      dpi: 150,
    },
    split: {
      byColor: true,
      byShape: true,
      tolerance: 40,
      merge: 0,
      minArea: 0.1,
      maxColors: 6,
      colorGap: 70,
      smooth: 1,
      autoBg: true,
      keepBg: false,
      bg: '#ffffff',
      seeds: [],
      totalCm: 0,
      base: null,
      result: null,
    },
  };

  const tick = () => new Promise(r => setTimeout(r, 30));
  const round2 = v => Math.round(v * 100) / 100;
  const inUnit = cm => round2(cm * UNITS[st.unit]);
  const toCm = v => v / UNITS[st.unit];
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  const sheetOf = id => P.SHEETS.find(s => s.id === id);

  const numField = (scope, k, label, v, extra = '') =>
    `<label class="num"><span>${label}</span><input type="number" data-${scope}="${k}" value="${v}" ${extra}></label>`;
  const checkRow = (scope, k, label, v) =>
    `<div class="row"><input type="checkbox" id="st-${scope}-${k}" data-${scope}="${k}"${v ? ' checked' : ''}><label for="st-${scope}-${k}" style="min-width:0">${label}</label></div>`;
  const rangeRow = (k, label, v, min, max, step, unit) =>
    `<div class="row"><label>${label}</label><input type="range" data-s="${k}" min="${min}" max="${max}" step="${step}" value="${v}"><span id="st-v-${k}">${v}${unit}</span></div>`;
  const selectRow = (scope, k, label, opts, v) =>
    `<div class="row"><label>${label}</label><select data-${scope}="${k}">${opts.map(([val, l]) => `<option value="${val}"${String(v) === String(val) ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`;
  const unitRow = scope =>
    selectRow(
      scope,
      'unit',
      'Unidad',
      Object.keys(UNITS).map(u => [u, u]),
      st.unit,
    );

  function sourceHTML() {
    const s = st.src;
    return `<div class="drop" id="st-drop">Arrastra aquí tu logo o diseño</div>
    <div class="row"><button class="btn sm on" data-st="pick">Elegir imagen</button><button class="btn sm" data-st="useCanvas">Usar el lienzo actual</button></div>
    <p class="hint">${s ? `<b>${core.esc(s.name)}</b> · ${s.w} × ${s.h} px` : 'Sube un archivo para empezar.'}</p>`;
  }

  function sizeFields() {
    const p = st.poster;
    if (p.mode === 'sheets')
      return `<div class="row wrap">${numField('p', 'cols', 'Hojas de ancho', p.cols, 'min="1" max="12" step="1"')}${numField('p', 'rows', 'Hojas de alto', p.rows, 'min="1" max="12" step="1"')}</div>
      <p class="hint">El diseño se agranda para llenar esa cantidad de hojas, manteniendo su proporción.</p>`;
    return `${unitRow('p')}
      <div class="row wrap">${numField('p', 'width', `Ancho (${st.unit})`, p.width || '', 'min="0" step="any" placeholder="?"')}${numField('p', 'height', `Alto (${st.unit})`, p.height || '', 'min="0" step="any" placeholder="?"')}</div>
      <div class="row wrap" id="st-quick">${QUICK_WIDTHS.map(w => `<button class="btn sm" data-st="quick:${w}">${inUnit(w)} ${st.unit}</button>`).join('')}</div>
      ${checkRow('p', 'lock', 'Mantener proporción', p.lock)}
      <p class="hint">Es la medida del diseño ya armado, con todas las hojas pegadas.</p>`;
  }

  function posterHTML() {
    const p = st.poster;
    return `<h4>1 · ¿De qué tamaño será todo el diseño junto?</h4>
    <div class="seg"><button class="btn sm${p.mode === 'size' ? ' on' : ''}" data-st="mode:size">Escribir medidas</button><button class="btn sm${p.mode === 'sheets' ? ' on' : ''}" data-st="mode:sheets">Elegir número de hojas</button></div>
    <div id="st-size">${sizeFields()}</div>
    <h4>2 · Hoja de impresión</h4>
    ${selectRow(
      'p',
      'sheet',
      'Hoja',
      P.SHEETS.map(s => [s.id, s.name]),
      p.sheet,
    )}
    <div class="row wrap" id="st-custom"${p.sheet === 'custom' ? '' : ' hidden'}>${numField('p', 'sw', 'Ancho cm', p.sw, 'min="5" step="any"')}${numField('p', 'sh', 'Alto cm', p.sh, 'min="5" step="any"')}</div>
    ${selectRow(
      'p',
      'orient',
      'Giro',
      [
        ['auto', 'Automático (menos hojas)'],
        ['portrait', 'Vertical'],
        ['landscape', 'Horizontal'],
      ],
      p.orient,
    )}
    <div class="row wrap">${numField('p', 'margin', 'Margen cm', p.margin, 'min="0" step="0.1"')}${numField('p', 'overlap', 'Traslape cm', p.overlap, 'min="0" step="0.1"')}</div>
    <p class="hint">El traslape es la franja que se repite entre hojas para pegarlas sin que falte nada; se ve en rojo en la vista previa.</p>
    <h4>3 · Ayudas para armarlo</h4>
    ${checkRow('p', 'guide', 'Plano de armado como primera hoja', p.guide)}
    ${checkRow('p', 'marks', 'Marcas de corte y de unión', p.marks)}
    ${checkRow('p', 'label', 'Número de hoja y vecinas en el margen', p.label)}
    ${selectRow(
      'p',
      'dpi',
      'Calidad',
      [
        [100, '100 ppp · borrador'],
        [150, '150 ppp · casero'],
        [300, '300 ppp · imprenta'],
      ],
      p.dpi,
    )}`;
  }

  function splitHTML() {
    const s = st.split;
    return `<h4>Cómo separar</h4>
    ${checkRow('s', 'byColor', 'Separar por color (A azul, B amarilla…)', s.byColor)}
    ${checkRow('s', 'byShape', 'Separar piezas que no se tocan', s.byShape)}
    ${rangeRow('tolerance', 'Fondo', s.tolerance, 5, 120, 1, '')}
    ${rangeRow('merge', 'Unir cerca', s.merge, 0, 40, 1, ' px')}
    ${rangeRow('minArea', 'Limpiar motas', s.minArea, 0, 5, 0.05, ' %')}
    ${rangeRow('maxColors', 'Colores', s.maxColors, 2, 10, 1, '')}
    ${rangeRow('colorGap', 'Dif. de color', s.colorGap, 20, 150, 1, '')}
    ${selectRow(
      's',
      'smooth',
      'Bordes',
      [
        [0, 'Sin suavizar'],
        [1, 'Suaves'],
        [2, 'Muy suaves'],
      ],
      s.smooth,
    )}
    <div class="row"><input type="checkbox" id="st-s-autoBg" data-s="autoBg"${s.autoBg ? ' checked' : ''}><label for="st-s-autoBg" style="min-width:0">Detectar el fondo solo</label><input type="color" data-s="bg" value="${s.bg}" aria-label="Color de fondo a quitar"${s.autoBg ? ' disabled' : ''}></div>
    ${checkRow('s', 'keepBg', 'Conservar el fondo como una pieza', s.keepBg)}
    <h4>Colores</h4>
    <div id="st-pal" class="row wrap"></div>
    <p class="hint">Si falta un color (por ejemplo el blanco), toca esa zona en la imagen para agregarlo.</p>
    <h4>Tamaño real</h4>
    ${unitRow('s')}
    <div class="row wrap">${numField('s', 'totalCm', `Ancho del diseño completo (${st.unit})`, s.totalCm ? inUnit(s.totalCm) : '', 'min="0" step="any" placeholder="opcional"')}</div>
    <p class="hint">Con este dato cada pieza muestra cuánto mide al imprimirla y conserva su proporción real.</p>
    ${selectRow(
      's',
      'pdfSheet',
      'Hoja del PDF',
      P.SHEETS.map(sh => [sh.id, sh.name]),
      st.poster.sheet,
    )}`;
  }

  function render() {
    const poster = st.tool === 'poster';
    M.innerHTML = `<div class="studio">
      <div class="st-head"><h3>${poster ? 'Póster en hojas' : 'Separar piezas'}</h3><button class="btn sm warn" data-st="close">Cerrar</button></div>
      <div class="seg st-tabs"><button class="btn sm${poster ? ' on' : ''}" data-st="tool:poster">Póster en hojas</button><button class="btn sm${poster ? '' : ' on'}" data-st="tool:split">Separar piezas</button></div>
      <p class="lead">${
        poster
          ? 'Sube una imagen, dinos de qué tamaño será el diseño completo y elige la hoja. Se parte en hojas numeradas, con plano de armado, listas para imprimir y pegar.'
          : 'Separa un logo o diseño en piezas (por color y por forma) respetando sus bordes. Cada pieza queda como PNG transparente y como proyecto aparte.'
      }</p>
      <div class="st-cols"><div class="st-ctl">${sourceHTML()}${st.src ? (poster ? posterHTML() : splitHTML()) : ''}</div>
      <div class="st-view">${st.src ? (poster ? '<canvas id="st-prev" class="chk"></canvas><div id="st-sum" class="sumline"></div><div class="row"><button class="btn on" data-st="posterProject">Crear proyecto con las hojas</button><button class="btn" data-st="posterPdf">Descargar PDF</button></div>' : '<canvas id="st-prev" class="chk" style="cursor:crosshair"></canvas><div id="st-sum" class="sumline"></div><div id="st-pieces"></div>') : '<p class="hint">La vista previa aparece aquí cuando subas una imagen.</p>'}</div></div>
      <div class="row"><button class="btn sm" data-st="loadJson">Abrir un proyecto guardado (.json)</button></div>
      <input type="file" id="st-file" accept="image/*" hidden><input type="file" id="st-json" accept=".json,application/json" hidden>
    </div>`;
    if (!st.src) return;
    if (poster) updPoster();
    else runSplit();
  }

  async function setSource(canvas, name, sizeCm) {
    st.src = {canvas, name, w: canvas.width, h: canvas.height};
    const p = st.poster;
    p.width = sizeCm ? sizeCm.w : 0;
    p.height = sizeCm ? sizeCm.h : 0;
    p.lock = true;
    p.mode = 'size';
    st.split.base = null;
    st.split.result = null;
    st.split.seeds = [];
    st.pending = '';
    render();
  }

  async function loadFile(f) {
    try {
      const o = await core.readImage(f, SOURCE_MAX),
        im = await core.loadImg(o.src),
        c = core.cv(o.w, o.h);
      c.getContext('2d').drawImage(im, 0, 0);
      setSource(c, f.name.replace(/\.[^.]+$/, '') || 'imagen');
    } catch {
      core.toast('Solo se aceptan imágenes');
    }
  }

  async function useCanvas() {
    const page = await core.pageCanvas(),
      k = Math.min(1, SOURCE_MAX / Math.max(page.width, page.height));
    let c = page;
    if (k < 1) {
      c = core.cv(Math.round(page.width * k), Math.round(page.height * k));
      c.getContext('2d').drawImage(page, 0, 0, c.width, c.height);
    }
    setSource(c, core.projectName());
  }

  function sheetSize() {
    const p = st.poster;
    return {sheetW: p.sw, sheetH: p.sh};
  }

  function posterPlan() {
    const p = st.poster,
      {sheetW, sheetH} = sheetSize(),
      base = {sheetW, sheetH, margin: p.margin, overlap: p.overlap};
    let orientation = p.orient;
    if (p.mode === 'sheets') {
      const fit = P.fitToSheets({
        ...base,
        cols: Math.max(1, Math.round(p.cols)),
        rows: Math.max(1, Math.round(p.rows)),
        ratio: st.src.h / st.src.w,
        orientation: p.orient,
      });
      if (!fit) return null;
      p.width = fit.width;
      p.height = fit.height;
      orientation = fit.orientation;
    }
    if (!(p.width > 0 && p.height > 0)) return null;
    return P.planTiles({...base, width: p.width, height: p.height, orientation});
  }

  function showPlainPreview(prev) {
    const src = st.src.canvas,
      k = Math.min(1, 520 / Math.max(src.width, src.height));
    prev.width = Math.round(src.width * k);
    prev.height = Math.round(src.height * k);
    prev.getContext('2d').drawImage(src, 0, 0, prev.width, prev.height);
  }

  function updPoster() {
    const p = st.poster,
      plan = (st.plan = posterPlan()),
      sum = $('#st-sum'),
      prev = $('#st-prev');
    $$('[data-st^="poster"]').forEach(b => (b.disabled = !plan || plan.count > MAX_SHEETS));
    if (!plan) {
      showPlainPreview(prev);
      sum.innerHTML =
        p.mode === 'size' && !(p.width > 0 && p.height > 0)
          ? '<b>Primero escribe el tamaño del diseño completo</b> (ancho y alto) para ver cómo se reparte en hojas.'
          : 'Revisa las medidas: el margen y el traslape no dejan espacio útil en la hoja.';
      return;
    }
    const c = P.drawPlanPreview(st.src.canvas, plan, 520);
    prev.width = c.width;
    prev.height = c.height;
    prev.getContext('2d').drawImage(c, 0, 0);
    const ppi = Math.round(st.src.w / (plan.width / 2.54)),
      sh = sheetOf(p.sheet),
      sheetName = p.sheet === 'custom' ? `${round2(p.sw)} × ${round2(p.sh)} cm` : sh.name.split(' (')[0],
      u = st.unit;
    sum.innerHTML = `<b>${plan.cols} × ${plan.rows} = ${plan.count} hoja${plan.count === 1 ? '' : 's'}</b>${p.guide ? ' + plano de armado' : ''} · ${sheetName} ${plan.orientation === 'portrait' ? 'vertical' : 'horizontal'}<br>
      Diseño completo: <b>${inUnit(plan.width)} × ${inUnit(plan.height)} ${u}</b> · Zona útil por hoja: ${round2(plan.pw)} × ${round2(plan.ph)} cm<br>
      Resolución de tu imagen a ese tamaño: <b>${ppi} ppp</b>${ppi < 100 ? ' · baja: se verá pixelada de cerca' : ''}${plan.count > MAX_SHEETS ? `<br><b>Son demasiadas hojas (máximo ${MAX_SHEETS}).</b> Usa una hoja más grande o un diseño más pequeño.` : plan.count > 60 ? '<br>Son muchas hojas; prueba con una hoja más grande.' : ''}`;
  }

  function onPosterInput(t) {
    const p = st.poster,
      k = t.dataset.p;
    if (k === 'unit') {
      st.unit = t.value;
      $('#st-size').innerHTML = sizeFields();
      updPoster();
      return;
    }
    if (t.type === 'checkbox') p[k] = t.checked;
    else if (t.tagName === 'SELECT') p[k] = ['dpi'].includes(k) ? +t.value : t.value;
    else if (k === 'width' || k === 'height') p[k] = toCm(parseFloat(t.value) || 0);
    else p[k] = parseFloat(t.value) || 0;
    const ratio = st.src.h / st.src.w,
      field = n => $(`[data-p="${n}"]`);
    if (p.lock && k === 'width') {
      p.height = p.width * ratio;
      field('height').value = p.height ? inUnit(p.height) : '';
    } else if (p.lock && k === 'height') {
      p.width = p.height / ratio;
      field('width').value = p.width ? inUnit(p.width) : '';
    } else if (k === 'sheet' && t.value !== 'custom') {
      const s = sheetOf(t.value);
      p.sw = s.w;
      p.sh = s.h;
      field('sw').value = s.w;
      field('sh').value = s.h;
    }
    if (k === 'sheet') $('#st-custom').hidden = t.value !== 'custom';
    updPoster();
  }

  const sheetDpi = (plan, dpi) =>
    Math.min(dpi, Math.floor(5000 / (Math.max(plan.sheetW, plan.sheetH) / 2.54)));

  async function buildSheets(dpi, asDataUrl) {
    const plan = st.plan,
      p = st.poster,
      out = [],
      opts = {dpi, marks: p.marks, label: p.label};
    const jobs = [];
    if (p.guide) jobs.push({guide: true});
    plan.tiles.forEach(t => jobs.push({tile: t}));
    let i = 0;
    for (const j of jobs) {
      i++;
      core.toast(`Preparando hoja ${i} de ${jobs.length}…`);
      await tick();
      const sheet = j.guide
        ? P.renderGuide(st.src.canvas, plan, {dpi, unit: st.unit})
        : P.renderSheet(st.src.canvas, plan, j.tile, opts);
      out.push(await asDataUrl(sheet));
    }
    return out;
  }

  async function posterProject() {
    const plan = st.plan;
    if (!plan || !confirmReplace('posterProject')) return;
    const dpi = sheetDpi(plan, Math.min(st.poster.dpi, 150)),
      W = Math.round(plan.sheetW * (dpi / 2.54)),
      H = Math.round(plan.sheetH * (dpi / 2.54)),
      urls = await buildSheets(dpi, async c => c.toDataURL('image/jpeg', 0.9)),
      pages = urls.map(u => core.imagePage(u, W, H, '#ffffff'));
    close();
    core.openProject(
      {name: `${st.src.name} · ${plan.count} hojas`, w: W, h: H, pages},
      {tab: 'pages', fmt: 'pdf', all: true},
    );
  }

  async function posterPdf() {
    const plan = st.plan;
    if (!plan) return;
    const dpi = sheetDpi(plan, st.poster.dpi),
      pages = await buildSheets(dpi, async c => {
        const blob = await core.toBlob(c, 'image/jpeg', 0.92);
        return {
          jpg: new Uint8Array(await blob.arrayBuffer()),
          w: c.width,
          h: c.height,
          pw: (plan.sheetW / 2.54) * 72,
          ph: (plan.sheetH / 2.54) * 72,
        };
      });
    core.saveFile(`${slug(st.src.name)}_${plan.cols}x${plan.rows}_hojas.pdf`, core.buildPDF(pages));
  }

  function analysisBase() {
    const s = st.split;
    if (s.base) return s.base;
    const src = st.src.canvas,
      k = Math.min(1, ANALYSIS_MAX / Math.max(src.width, src.height)),
      c = core.cv(Math.round(src.width * k), Math.round(src.height * k));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return (s.base = c);
  }

  async function runSplit() {
    const s = st.split,
      sum = $('#st-sum');
    sum.textContent = 'Analizando…';
    await tick();
    const res = P.separate(analysisBase(), {
      byColor: s.byColor,
      byShape: s.byShape,
      tolerance: s.tolerance,
      merge: s.merge,
      minArea: s.minArea / 100,
      maxColors: s.maxColors,
      colorGap: s.colorGap,
      smooth: s.smooth,
      keepBg: s.keepBg,
      seeds: s.seeds,
      bg: s.autoBg ? null : hexRGB(s.bg),
    });
    s.result = res;
    st.sel = new Set(res.pieces.map((_, i) => i));
    paintSplit();
  }

  function pieceCm(p) {
    const s = st.split;
    if (!s.totalCm) return null;
    const k = s.totalCm / analysisBase().width;
    return {w: p.w * k, h: p.h * k};
  }

  function paintPalette() {
    const s = st.split,
      box = $('#st-pal');
    if (!box) return;
    const auto = (s.result?.colors || []).filter(c => !s.seeds.some(q => rgbHex(q) === c));
    box.innerHTML =
      auto.map(c => `<i class="sw" style="background:${c}" title="${c}"></i>`).join('') +
      s.seeds
        .map(
          (c, i) =>
            `<button class="btn sm" data-st="rmSeed:${i}" title="Quitar este color agregado" style="padding:2px 6px"><i class="sw" style="background:${rgbHex(c)};display:inline-block;vertical-align:middle"></i> ×</button>`,
        )
        .join('');
  }

  function paintSplit() {
    const res = st.split.result,
      base = analysisBase(),
      prev = $('#st-prev'),
      k = Math.min(1, 520 / Math.max(base.width, base.height));
    if (!prev) return;
    prev.width = Math.round(base.width * k);
    prev.height = Math.round(base.height * k);
    st.split.previewScale = k;
    const x = prev.getContext('2d');
    x.drawImage(base, 0, 0, prev.width, prev.height);
    res.pieces.forEach((p, i) => {
      const col = BOX_COLORS[i % BOX_COLORS.length];
      x.lineWidth = 2;
      x.strokeStyle = col;
      x.strokeRect(p.x * k, p.y * k, p.w * k, p.h * k);
      x.fillStyle = col;
      x.font = 'bold 14px sans-serif';
      x.fillText(p.n, p.x * k + 3, p.y * k + 15);
    });
    paintPalette();
    $('#st-sum').innerHTML = res.pieces.length
      ? `<b>${res.pieces.length} pieza${res.pieces.length === 1 ? '' : 's'}</b> encontradas${res.ignored ? ` · ${res.ignored} mota${res.ignored === 1 ? '' : 's'} limpiada${res.ignored === 1 ? '' : 's'}` : ''}${res.transparent ? ' · fondo transparente' : ''}`
      : 'No se encontraron piezas. Baja el valor de “Fondo” o cambia el color de fondo.';
    const list = $('#st-pieces');
    list.innerHTML = '';
    if (!res.pieces.length) return;
    res.pieces.forEach((p, i) => {
      const d = document.createElement('div'),
        thumb = core.cv(1, 1),
        tk = Math.min(1, 110 / p.canvas.width, 80 / p.canvas.height),
        cm = pieceCm(p);
      thumb.width = Math.max(1, Math.round(p.canvas.width * tk));
      thumb.height = Math.max(1, Math.round(p.canvas.height * tk));
      thumb.getContext('2d').drawImage(p.canvas, 0, 0, thumb.width, thumb.height);
      thumb.className = 'chk';
      d.className = 'piece';
      d.innerHTML = `<div class="pthumb"></div><div class="pinfo"><b>Pieza ${p.n}</b> <i class="sw" style="background:${p.color};display:inline-block;vertical-align:middle" title="${p.color}"></i>
        <div class="hint">${cm ? `<b>${inUnit(cm.w)} × ${inUnit(cm.h)} ${st.unit}</b> · ` : ''}${p.canvas.width} × ${p.canvas.height} px</div>
        <div class="row"><input type="checkbox" id="st-sel-${i}" data-sel="${i}" checked><label for="st-sel-${i}" style="min-width:0">Incluir en ZIP y PDF</label></div>
        <div class="seg"><button class="btn sm on" data-st="openPiece:${i}">Abrir como proyecto</button><button class="btn sm" data-st="pngPiece:${i}">PNG</button><button class="btn sm" data-st="toPoster:${i}">Imprimir en hojas</button></div></div>`;
      $('.pthumb', d).append(thumb);
      list.append(d);
    });
    const bulk = document.createElement('div');
    bulk.className = 'row';
    bulk.innerHTML =
      '<button class="btn on" data-st="piecesPdf">PDF con todas las piezas</button><button class="btn" data-st="zipAll">ZIP (PNG + proyectos)</button>';
    list.append(bulk);
  }

  function addSeed(ev) {
    const prev = ev.target,
      base = analysisBase(),
      r = prev.getBoundingClientRect(),
      x = Math.round(((ev.clientX - r.left) / r.width) * base.width),
      y = Math.round(((ev.clientY - r.top) / r.height) * base.height),
      px = base.getContext('2d').getImageData(Math.max(0, x - 1), Math.max(0, y - 1), 3, 3).data,
      c = [0, 1, 2].map(ch => {
        let s = 0;
        for (let i = 0; i < 9; i++) s += px[i * 4 + ch];
        return Math.round(s / 9);
      });
    st.split.seeds.push(c);
    runSplit();
  }

  function onSplitInput(t) {
    const s = st.split,
      k = t.dataset.s;
    if (k === 'unit') {
      st.unit = t.value;
      render();
      return;
    }
    if (k === 'pdfSheet') {
      const sh = sheetOf(t.value);
      st.poster.sheet = sh.id;
      if (sh.id !== 'custom') {
        st.poster.sw = sh.w;
        st.poster.sh = sh.h;
      }
      return;
    }
    if (t.type === 'checkbox') s[k] = t.checked;
    else if (t.type === 'color') s[k] = t.value;
    else if (t.tagName === 'SELECT') s[k] = +t.value;
    else if (k === 'totalCm') s[k] = toCm(parseFloat(t.value) || 0);
    else s[k] = parseFloat(t.value);
    if (k === 'autoBg') $('[data-s="bg"]').disabled = t.checked;
    const out = $(`#st-v-${k}`);
    if (out) out.textContent = t.value + (k === 'merge' ? ' px' : k === 'minArea' ? ' %' : '');
    if (!s.byColor && !s.byShape) {
      s.byShape = true;
      $('[data-s="byShape"]').checked = true;
    }
    clearTimeout(st.timer);
    st.timer = setTimeout(k === 'totalCm' ? paintSplit : runSplit, 350);
  }

  async function piecesPdf() {
    const res = st.split.result,
      p = st.poster,
      picked = [...st.sel].sort((a, b) => a - b).map(i => res.pieces[i]);
    if (!picked.length) return core.toast('Marca al menos una pieza');
    if (!st.split.totalCm) {
      core.toast('Escribe primero el ancho del diseño completo en "Tamaño real"');
      $('[data-s="totalCm"]')?.focus();
      return;
    }
    const portrait = p.orient !== 'landscape',
      sheetW = portrait ? Math.min(p.sw, p.sh) : Math.max(p.sw, p.sh),
      sheetH = portrait ? Math.max(p.sw, p.sh) : Math.min(p.sw, p.sh),
      pw = sheetW - 2 * p.margin,
      ph = sheetH - 2 * p.margin,
      labelH = 0.6,
      dpi = sheetDpi({sheetW, sheetH}, p.dpi),
      small = [],
      big = [];
    picked.forEach(pc => {
      const cm = pieceCm(pc),
        item = {
          canvas: pc.canvas,
          w: cm.w,
          h: cm.h + labelH,
          labelH,
          label: `Pieza ${pc.n} · ${inUnit(cm.w)} × ${inUnit(cm.h)} ${st.unit}`,
          n: pc.n,
        };
      (cm.w <= pw && cm.h + labelH <= ph ? small : big).push(item);
    });
    const pages = [],
      push = async c => {
        const blob = await core.toBlob(c, 'image/jpeg', 0.92);
        pages.push({
          jpg: new Uint8Array(await blob.arrayBuffer()),
          w: c.width,
          h: c.height,
          pw: (sheetW / 2.54) * 72,
          ph: (sheetH / 2.54) * 72,
        });
      };
    const packs = P.packShelves(small, pw, ph, 0.5);
    for (const [i, placed] of packs.entries()) {
      core.toast(`Acomodando piezas: hoja ${i + 1} de ${packs.length}…`);
      await tick();
      await push(P.renderPacked(small, placed, {dpi, sheetW, sheetH, margin: p.margin}));
    }
    for (const it of big) {
      const plan = P.planTiles({
        width: it.w,
        height: it.h - labelH,
        sheetW,
        sheetH,
        margin: p.margin,
        overlap: p.overlap,
        orientation: portrait ? 'portrait' : 'landscape',
      });
      if (!plan || plan.count > MAX_SHEETS) {
        core.toast(`La pieza ${it.n} no cabe en hojas con esos márgenes`);
        continue;
      }
      for (const t of plan.tiles) {
        core.toast(`Pieza ${it.n}: hoja ${t.n} de ${plan.count}…`);
        await tick();
        await push(P.renderSheet(it.canvas, plan, t, {dpi, marks: p.marks, label: p.label}));
      }
    }
    if (!pages.length) return;
    core.saveFile(`${slug(st.src.name)}_piezas_tamano_real.pdf`, core.buildPDF(pages));
  }

  function pieceProject(p) {
    const w = Math.max(16, p.canvas.width),
      h = Math.max(16, p.canvas.height),
      page = core.imagePage(p.canvas.toDataURL('image/png'), w, h, null);
    return {name: `${st.src.name} · pieza ${p.n}`, w, h, cur: 0, pages: [page]};
  }

  function confirmReplace(key) {
    if (!core.hasWork() || st.pending === key) {
      st.pending = '';
      return true;
    }
    st.pending = key;
    core.toast('Esto reemplaza el proyecto actual. Pulsa otra vez para confirmar');
    return false;
  }

  async function zipAll() {
    const res = st.split.result,
      files = [],
      enc = new TextEncoder(),
      base = slug(st.src.name);
    for (const i of [...st.sel].sort((a, b) => a - b)) {
      const p = res.pieces[i],
        nm = `${base}_pieza_${String(p.n).padStart(2, '0')}`,
        blob = await core.toBlob(p.canvas, 'image/png');
      files.push({name: nm + '.png', data: new Uint8Array(await blob.arrayBuffer())});
      files.push({name: nm + '.moonlight.json', data: enc.encode(JSON.stringify(pieceProject(p)))});
    }
    if (!files.length) return core.toast('Marca al menos una pieza');
    core.saveFile(`${base}_piezas.zip`, core.buildZip(files));
  }

  function open(tool) {
    st.tool = tool || st.tool;
    st.pending = '';
    render();
    $('#modal').classList.add('on');
  }
  function close() {
    $('#modal').classList.remove('on');
  }

  async function onClick(ev) {
    if (ev.target.id === 'st-prev' && st.tool === 'split' && st.split.result) return addSeed(ev);
    const b = ev.target.closest('[data-st]');
    if (!b) return;
    const [a, v] = b.dataset.st.split(':'),
      res = st.split.result;
    if (!/^(posterProject|openPiece|loadJson)$/.test(a)) st.pending = '';
    if (a === 'close') close();
    else if (a === 'tool') open(v);
    else if (a === 'pick') $('#st-file').click();
    else if (a === 'useCanvas') useCanvas();
    else if (a === 'mode') {
      st.poster.mode = v;
      render();
    } else if (a === 'quick') {
      const p = st.poster;
      p.width = +v;
      p.height = (p.width * st.src.h) / st.src.w;
      $('[data-p="width"]').value = inUnit(p.width);
      $('[data-p="height"]').value = inUnit(p.height);
      updPoster();
    } else if (a === 'rmSeed') {
      st.split.seeds.splice(+v, 1);
      runSplit();
    } else if (a === 'posterProject') posterProject();
    else if (a === 'posterPdf') posterPdf();
    else if (a === 'zipAll') zipAll();
    else if (a === 'piecesPdf') piecesPdf();
    else if (a === 'pngPiece') {
      const p = res.pieces[+v];
      core.saveFile(`${slug(st.src.name)}_pieza_${p.n}.png`, await core.toBlob(p.canvas, 'image/png'));
    } else if (a === 'toPoster') {
      const p = res.pieces[+v],
        cm = pieceCm(p);
      st.tool = 'poster';
      setSource(p.canvas, `${st.src.name} pieza ${p.n}`, cm);
    } else if (a === 'openPiece') {
      if (!confirmReplace('openPiece' + v)) return;
      close();
      core.openProject(pieceProject(res.pieces[+v]), {tab: 'images', fmt: 'png'});
    } else if (a === 'loadJson' && confirmReplace('loadJson')) $('#st-json').click();
  }

  function onChange(ev) {
    const t = ev.target;
    if (t.id === 'st-file' && t.files[0]) loadFile(t.files[0]);
    else if (t.id === 'st-json' && t.files[0]) {
      t.files[0].text().then(js => {
        if (core.loadProjectJSON(js)) close();
        else core.toast('Ese archivo no es un proyecto válido');
      });
      t.value = '';
    } else if (t.dataset.sel !== undefined) {
      const i = +t.dataset.sel;
      t.checked ? st.sel.add(i) : st.sel.delete(i);
    }
  }

  function onInput(ev) {
    const t = ev.target;
    if (!st.src) return;
    if (t.dataset.p !== undefined) onPosterInput(t);
    else if (t.dataset.s !== undefined) onSplitInput(t);
  }

  function mount(api) {
    core = api;
    M = $('#mbox');
    M.addEventListener('click', onClick);
    M.addEventListener('input', onInput);
    M.addEventListener('change', onChange);
    M.addEventListener('pointerdown', () => (st.pointerDown = true));
    addEventListener('pointerup', () => setTimeout(() => (st.pointerDown = false), 0));
    $('#modal').addEventListener(
      'click',
      ev => {
        if (st.pointerDown && ev.target.id === 'modal' && $('.studio', M)) ev.stopImmediatePropagation();
      },
      true,
    );
    M.addEventListener('dragover', ev => {
      if ($('#st-drop', M)) ev.preventDefault();
    });
    M.addEventListener('drop', ev => {
      if (!$('#st-drop', M)) return;
      ev.preventDefault();
      const f = [...ev.dataTransfer.files].find(x => x.type.startsWith('image/'));
      if (f) loadFile(f);
    });
  }

  window.MoonStudio = {mount, open};
})();
