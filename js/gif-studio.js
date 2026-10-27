(() => {
  const G = window.MoonGif;
  const $ = (s, r = document) => r.querySelector(s);
  const MAX_PIXELS = 90e6;
  const MAX_WIDTH = 1000;
  const MAX_EDIT_FRAMES = 80;
  const MAX_GIF_FRAMES = 300;
  const MAX_SHEET_FRAMES = 64;
  const ASPECTS = [
    ['first', 'Como el primer clip'],
    ['1', 'Cuadrado 1:1'],
    ['1.7778', 'Horizontal 16:9'],
    ['0.5625', 'Vertical 9:16'],
    ['1.3333', 'Horizontal 4:3'],
  ];

  let core,
    M,
    nextId = 1;
  const slug = (text, fallback) => core.slug(text, fallback);
  const st = {
    clips: [],
    busy: false,
    pending: 0,
    result: null,
    out: {
      w: 480,
      aspect: 'first',
      fit: 'contain',
      bg: '#000000',
      fps: 10,
      colors: 255,
      dither: false,
      loop: 0,
      trans: 'cut',
      transDur: 0.4,
      pingpong: false,
      sheet: false,
    },
  };

  const round1 = v => Math.round(v * 10) / 10;
  const round2 = v => Math.round(v * 100) / 100;
  const tick = () => new Promise(r => setTimeout(r, 20));
  const row = (label, body) => `<div class="row"><label>${label}</label>${body}</div>`;
  const select = (k, opts, v) =>
    `<select data-g="${k}">${opts.map(([val, l]) => `<option value="${val}"${String(v) === String(val) ? ' selected' : ''}>${l}</option>`).join('')}</select>`;

  function render() {
    const o = st.out;
    M.innerHTML = `<div class="studio">
      <div class="st-head"><h3>Crear GIF</h3><button class="btn sm warn" data-g="close">Cerrar</button></div>
      <p class="lead">Sube videos e imágenes, ordénalos y combínalos en un solo GIF animado.</p>
      <div class="st-cols"><div class="st-ctl">
        <div class="drop" id="gif-drop">Arrastra aquí videos o imágenes</div>
        <div class="row"><button class="btn sm on" data-g="pick">Elegir archivos</button><button class="btn sm" data-g="pages">Páginas del proyecto</button><button class="btn sm" data-g="frames" title="Cada página dura un cuadro">Páginas como cuadros</button></div>
        <h4>Salida</h4>
        ${row('Ancho', `<input type="number" data-g="w" min="16" max="${MAX_WIDTH}" step="10" value="${o.w}"><span class="hint">px</span>`)}
        ${row('Forma', select('aspect', ASPECTS, o.aspect))}
        ${row(
          'Ajuste',
          select(
            'fit',
            [
              ['contain', 'Mostrar completo'],
              ['cover', 'Llenar y recortar'],
              ['stretch', 'Estirar'],
            ],
            o.fit,
          ),
        )}
        ${row('Fondo', `<input type="color" data-g="bg" value="${o.bg}" aria-label="Color de fondo">`)}
        ${row('Cuadros/s', `<input type="range" data-g="fps" min="2" max="30" step="1" value="${o.fps}"><span id="gif-v-fps">${o.fps}</span>`)}
        ${row(
          'Colores',
          select(
            'colors',
            [
              [255, '256 · mejor'],
              [128, '128'],
              [64, '64 · liviano'],
              [32, '32 · muy liviano'],
            ],
            o.colors,
          ),
        )}
        <div class="row"><input type="checkbox" id="gif-dither" data-g="dither"${o.dither ? ' checked' : ''}><label for="gif-dither" style="min-width:0">Degradados más finos (pesa más)</label></div>
        ${row(
          'Repetir',
          select(
            'loop',
            [
              [0, 'Siempre'],
              [1, '1 vez'],
              [3, '3 veces'],
              [5, '5 veces'],
            ],
            o.loop,
          ),
        )}
        ${row(
          'Unión',
          select(
            'trans',
            [
              ['cut', 'Corte directo'],
              ['fade', 'Fundido'],
            ],
            o.trans,
          ),
        )}
        <div class="row" id="gif-td"${o.trans === 'fade' ? '' : ' hidden'}><label>Fundido</label><input type="number" data-g="transDur" min="0.1" max="3" step="0.1" value="${o.transDur}"><span class="hint">s</span></div>
        <div class="row"><input type="checkbox" id="gif-pp" data-g="pingpong"${o.pingpong ? ' checked' : ''}><label for="gif-pp" style="min-width:0">Ida y vuelta (boomerang)</label></div>
        <div class="row"><input type="checkbox" id="gif-sheet" data-g="sheet"${o.sheet ? ' checked' : ''}><label for="gif-sheet" style="min-width:0">Crear también hoja de sprites PNG</label></div>
      </div>
      <div class="st-view">
        <h4 id="gif-title"></h4>
        <div id="gif-clips"></div>
        <div class="row"><button class="btn on" data-g="make">Crear GIF</button></div>
        <div id="gif-status" class="sumline"></div>
        <div id="gif-result"></div>
      </div></div>
      <input type="file" id="gif-file" accept="video/*,image/*" multiple hidden>
    </div>`;
    paintClips();
    paintResult();
  }

  const isTimed = c => c.kind === 'video' || c.kind === 'anim';
  const KIND_LABEL = {video: 'Video', anim: 'GIF animado', page: 'Página', image: 'Imagen'};

  function clipDuration(c) {
    return isTimed(c) ? Math.max(0, c.end - c.start) / c.speed : c.dur;
  }

  function totalSeconds() {
    const o = st.out;
    let t = st.clips.reduce((a, c) => a + clipDuration(c), 0);
    if (o.trans === 'fade') t += Math.max(0, st.clips.length - 1) * o.transDur;
    return t;
  }

  function paintTotals() {
    const el = $('#gif-title');
    if (el)
      el.textContent = st.clips.length
        ? `Secuencia · ${st.clips.length} clip${st.clips.length === 1 ? '' : 's'} · ≈ ${round1(totalSeconds())} s`
        : 'Secuencia';
  }

  function thumbOf(c) {
    const t = core.cv(110, 80),
      x = t.getContext('2d'),
      sw = c.w,
      sh = c.h,
      k = Math.min(110 / sw, 80 / sh);
    x.fillStyle = '#1b2b66';
    x.fillRect(0, 0, 110, 80);
    x.drawImage(c.el, (110 - sw * k) / 2, (80 - sh * k) / 2, sw * k, sh * k);
    t.className = 'chk';
    return t;
  }

  function paintClips() {
    const box = $('#gif-clips');
    if (!box) return;
    paintTotals();
    box.innerHTML = '';
    if (!st.clips.length) {
      box.innerHTML = '<p class="hint">Aún no hay clips. Agrega videos o imágenes para empezar.</p>';
      return;
    }
    st.clips.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'piece';
      d.dataset.clip = c.id;
      const timing = isTimed(c)
        ? `<div class="row wrap"><label class="num"><span>Inicio s</span><input type="number" data-gc="start" min="0" max="${round1(c.duration)}" step="0.1" value="${round1(c.start)}"></label><label class="num"><span>Fin s</span><input type="number" data-gc="end" min="0.1" max="${round1(c.duration)}" step="0.1" value="${round1(c.end)}"></label></div>
          <div class="row"><label>Velocidad</label><select data-gc="speed">${[0.5, 1, 1.5, 2, 4].map(s => `<option value="${s}"${c.speed === s ? ' selected' : ''}>${s}×</option>`).join('')}</select></div>
          <div class="row"><input type="checkbox" id="gif-rev-${c.id}" data-gc="reverse"${c.reverse ? ' checked' : ''}><label for="gif-rev-${c.id}" style="min-width:0">Reproducir al revés</label></div>`
        : `<div class="row"><label>Duración</label><input type="number" data-gc="dur" min="0.02" max="60" step="0.01" value="${c.dur}"><span class="hint">s</span></div>`;
      d.innerHTML = `<div class="pthumb"></div><div class="pinfo"><b>${i + 1}. ${core.esc(c.name)}</b>
        <div class="hint">${KIND_LABEL[c.kind]} · ${c.w} × ${c.h} px${isTimed(c) ? ` · ${round1(c.duration)} s` : ''}${c.kind === 'anim' ? ` · ${c.frames.length} cuadros` : ''}</div>
        ${timing}
        <div class="seg">${isTimed(c) ? `<button class="btn sm on" data-g="edit:${c.id}" title="Convierte los cuadros en páginas para editarlas">Editar cuadros</button>` : ''}<button class="btn sm" data-g="up:${c.id}"${i === 0 ? ' disabled' : ''} title="Subir">▲</button><button class="btn sm" data-g="down:${c.id}"${i === st.clips.length - 1 ? ' disabled' : ''} title="Bajar">▼</button><button class="btn sm" data-g="dup:${c.id}">Duplicar</button><button class="btn sm warn" data-g="del:${c.id}">Quitar</button></div></div>`;
      $('.pthumb', d).append(thumbOf(c));
      box.append(d);
    });
  }

  function paintResult() {
    const box = $('#gif-result');
    if (!box) return;
    const r = st.result;
    if (!r) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = `<h4>Tu GIF</h4><img src="${r.url}" alt="GIF creado" style="image-rendering:auto;max-height:340px">
      <div class="sumline">${r.w} × ${r.h} px · ${r.frames} cuadros · ${round1(r.seconds)} s · <b>${(r.blob.size / 1024).toFixed(r.blob.size > 1e6 ? 0 : 1)} KB</b></div>
      <div class="row"><button class="btn on" data-g="save">Descargar GIF</button>${r.sheet ? `<button class="btn" data-g="savesheet" title="${r.sheet.count} cuadros en ${r.sheet.cols} × ${r.sheet.rows}">Hoja de sprites PNG</button>` : ''}</div>`;
  }

  function status(t) {
    const el = $('#gif-status');
    if (el) el.textContent = t;
  }

  async function loadVideo(file) {
    const v = await G.openVideo(URL.createObjectURL(file));
    return {
      id: nextId++,
      kind: 'video',
      name: file.name,
      el: v,
      w: v.videoWidth,
      h: v.videoHeight,
      duration: v.duration,
      start: 0,
      end: Math.min(v.duration, 5),
      speed: 1,
    };
  }

  async function decodeGif(file) {
    const g = G.decodeGif(await file.arrayBuffer(), {max: MAX_GIF_FRAMES}),
      {frames, times, w, h, duration} = g,
      view = G.gifView(g),
      el = core.cv(w, h);
    el.getContext('2d').drawImage(view.show(0), 0, 0);
    return {
      id: nextId++,
      kind: 'anim',
      name: file.name,
      frames,
      times,
      view,
      el,
      w,
      h,
      duration,
      start: 0,
      end: duration,
      speed: 1,
    };
  }

  async function loadImage(file) {
    if (file.type === 'image/gif') {
      try {
        const anim = await decodeGif(file);
        if (anim.frames.length > 1) return anim;
      } catch {
        core.toast('No se pudo leer la animación; se usará su primer cuadro');
      }
    }
    const url = URL.createObjectURL(file),
      im = new Image();
    im.src = url;
    await G.once(im, 'load', 'error');
    return {
      id: nextId++,
      kind: 'image',
      name: file.name,
      el: im,
      w: im.naturalWidth,
      h: im.naturalHeight,
      dur: 2,
    };
  }

  async function addFiles(files) {
    const list = [...files].filter(f => /^(video|image)\//.test(f.type));
    if (!list.length) return core.toast('Elige videos o imágenes');
    status('Leyendo archivos…');
    for (const f of list) {
      try {
        st.clips.push(f.type.startsWith('video/') ? await loadVideo(f) : await loadImage(f));
      } catch {
        core.toast(`No se pudo leer ${f.name}. Prueba con MP4 o WebM.`);
      }
    }
    status('');
    paintClips();
  }

  async function addPages(perFrame) {
    const pages = await core.pageCanvases(),
      dur = perFrame ? round2(1 / st.out.fps) : 2;
    pages.forEach((c, i) =>
      st.clips.push({
        id: nextId++,
        kind: 'page',
        name: `Página ${i + 1}`,
        el: c,
        w: c.width,
        h: c.height,
        dur,
      }),
    );
    paintClips();
  }

  function outSize() {
    const o = st.out,
      first = st.clips[0],
      w = Math.min(MAX_WIDTH, Math.max(16, Math.round(o.w) || 480)),
      ratio = o.aspect === 'first' ? first.w / first.h : parseFloat(o.aspect);
    return {w, h: Math.max(16, Math.round(w / ratio))};
  }

  function drawFit(x, el, sw, sh, W, H) {
    const o = st.out;
    x.fillStyle = o.bg;
    x.fillRect(0, 0, W, H);
    if (o.fit === 'stretch') x.drawImage(el, 0, 0, W, H);
    else {
      const k = o.fit === 'cover' ? Math.max(W / sw, H / sh) : Math.min(W / sw, H / sh),
        dw = sw * k,
        dh = sh * k;
      x.drawImage(el, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    return x.getImageData(0, 0, W, H).data;
  }

  function blend(a, b, t) {
    const out = new Uint8ClampedArray(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
    return out;
  }

  function estimateFrames() {
    const o = st.out;
    let n = 0;
    st.clips.forEach(c => (n += isTimed(c) ? Math.max(1, Math.round(clipDuration(c) * o.fps)) : 1));
    if (o.trans === 'fade') n += (st.clips.length - 1) * Math.max(1, Math.round(o.transDur * o.fps));
    return n;
  }

  async function sourceAt(c, t) {
    if (c.kind === 'video') {
      await G.seekTo(c.el, t);
      return c.el;
    }
    let i = c.times.length - 1;
    while (i > 0 && c.times[i] > t) i--;
    return c.view.show(i);
  }

  const clipTime = (c, k, n, fps) => c.start + ((c.reverse ? n - 1 - k : k) * c.speed) / fps;

  async function buildFrames(W, H) {
    const o = st.out,
      cvs = core.cv(W, H),
      x = cvs.getContext('2d', {willReadFrequently: true}),
      frames = [],
      fade = o.trans === 'fade' ? Math.max(1, Math.round(o.transDur * o.fps)) : 0;
    let done = 0;
    const total = estimateFrames();
    for (const c of st.clips) {
      const list = [];
      if (isTimed(c)) {
        const n = Math.max(1, Math.round(clipDuration(c) * o.fps));
        for (let k = 0; k < n; k++) {
          const src = await sourceAt(c, clipTime(c, k, n, o.fps));
          list.push({data: drawFit(x, src, c.w, c.h, W, H), delay: 1 / o.fps});
          status(`Extrayendo cuadros ${++done} de ${total}…`);
          if (k % 4 === 0) await tick();
        }
      } else {
        list.push({data: drawFit(x, c.el, c.w, c.h, W, H), delay: c.dur});
        done++;
      }
      if (fade && frames.length) {
        const prev = frames[frames.length - 1].data;
        for (let t = 1; t <= fade; t++) {
          frames.push({data: blend(prev, list[0].data, t / (fade + 1)), delay: 1 / o.fps});
          done++;
        }
      }
      frames.push(...list);
    }
    return frames;
  }

  async function buildSheet(frames, w, h) {
    const step = Math.max(1, Math.ceil(frames.length / MAX_SHEET_FRAMES)),
      picked = frames.filter((_, i) => i % step === 0),
      cols = Math.ceil(Math.sqrt(picked.length)),
      rows = Math.ceil(picked.length / cols),
      cvs = core.cv(cols * w, rows * h),
      x = cvs.getContext('2d');
    picked.forEach((f, i) =>
      x.putImageData(new ImageData(f.data, w, h), (i % cols) * w, Math.floor(i / cols) * h),
    );
    return {blob: await new Promise(res => cvs.toBlob(res, 'image/png')), count: picked.length, cols, rows};
  }

  async function make() {
    if (st.busy) return;
    if (!st.clips.length) return core.toast('Agrega al menos un clip');
    const o = st.out,
      {w, h} = outSize(),
      count = estimateFrames();
    if (w * h * count > MAX_PIXELS) {
      status(
        `Son demasiados cuadros (${count}) para ese tamaño. Reduce el ancho, los cuadros por segundo o la duración.`,
      );
      return;
    }
    st.busy = true;
    setMakeDisabled(true);
    try {
      const base = await buildFrames(w, h),
        frames = o.pingpong && base.length > 2 ? [...base, ...base.slice(1, -1).reverse()] : base,
        sheet = o.sheet ? await buildSheet(base, w, h) : null;
      status('Creando GIF…');
      await tick();
      await tick();
      const blob = G.encode(frames, w, h, {colors: o.colors, dither: o.dither, loop: o.loop});
      if (st.result) URL.revokeObjectURL(st.result.url);
      st.result = {
        blob,
        url: URL.createObjectURL(blob),
        w,
        h,
        frames: frames.length,
        seconds: frames.reduce((a, f) => a + f.delay, 0),
        sheet,
      };
      status('');
      paintResult();
    } catch {
      status('No se pudo crear el GIF. Prueba con un tamaño más pequeño.');
    }
    st.busy = false;
    setMakeDisabled(false);
  }

  const setMakeDisabled = off => {
    const b = $('[data-g="make"]');
    if (b) b.disabled = off;
  };

  function moveClip(id, d) {
    const i = st.clips.findIndex(c => c.id === id),
      j = i + d;
    if (i < 0 || j < 0 || j >= st.clips.length) return;
    [st.clips[i], st.clips[j]] = [st.clips[j], st.clips[i]];
    paintClips();
  }

  function onClick(ev) {
    const b = ev.target.closest('[data-g]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const [a, v] = b.dataset.g.split(':'),
      id = +v;
    if (a === 'close') $('#modal').classList.remove('on');
    else if (a === 'pick') $('#gif-file').click();
    else if (a === 'pages') addPages(false);
    else if (a === 'frames') addPages(true);
    else if (a === 'edit') editFrames(id);
    else if (a === 'make') make();
    else if (a === 'up') moveClip(id, -1);
    else if (a === 'down') moveClip(id, 1);
    else if (a === 'del') {
      st.clips = st.clips.filter(c => c.id !== id);
      paintClips();
    } else if (a === 'dup') {
      const i = st.clips.findIndex(c => c.id === id);
      if (i >= 0) st.clips.splice(i + 1, 0, {...st.clips[i], id: nextId++});
      paintClips();
    } else if (a === 'save' && st.result)
      core.saveFile(`${slug(core.projectName(), 'animacion')}.gif`, st.result.blob);
    else if (a === 'savesheet' && st.result?.sheet)
      core.saveFile(`${slug(core.projectName(), 'animacion')}_sprites.png`, st.result.sheet.blob);
  }

  function onInput(ev) {
    const t = ev.target;
    if (t.dataset.gc) {
      const c = st.clips.find(q => q.id === +t.closest('[data-clip]').dataset.clip);
      if (!c) return;
      const k = t.dataset.gc,
        v = parseFloat(t.value);
      if (k === 'reverse') {
        c.reverse = t.checked;
        return;
      }
      if (!(v >= 0)) return;
      if (k === 'speed') c.speed = v;
      else if (k === 'dur') c.dur = Math.max(0.02, v);
      else if (k === 'start') c.start = Math.min(v, c.end - 0.1);
      else if (k === 'end') c.end = Math.min(Math.max(v, c.start + 0.1), c.duration);
      paintTotals();
      return;
    }
    const k = t.dataset.g;
    if (!k || !(k in st.out)) return;
    const o = st.out;
    if (t.type === 'checkbox') o[k] = t.checked;
    else if (['w', 'fps', 'colors', 'loop', 'transDur'].includes(k)) o[k] = parseFloat(t.value) || o[k];
    else o[k] = t.value;
    if (k === 'fps') $('#gif-v-fps').textContent = o.fps;
    if (k === 'trans') $('#gif-td').hidden = o.trans !== 'fade';
    paintTotals();
  }

  function onChange(ev) {
    if (ev.target.id === 'gif-file' && ev.target.files.length) {
      addFiles(ev.target.files);
      ev.target.value = '';
    }
  }

  async function editFrames(id) {
    const c = st.clips.find(q => q.id === id);
    if (!c || st.busy) return;
    if (core.hasWork() && st.pending !== id) {
      st.pending = id;
      core.toast('Esto reemplaza el proyecto actual. Pulsa otra vez para confirmar');
      return;
    }
    st.pending = 0;
    const fps = Math.min(st.out.fps, 12),
      n = Math.max(1, Math.round(clipDuration(c) * fps));
    if (n > MAX_EDIT_FRAMES) {
      status(
        `Son ${n} cuadros; el máximo para editar es ${MAX_EDIT_FRAMES}. Acorta el video o baja los cuadros por segundo.`,
      );
      return;
    }
    st.busy = true;
    setMakeDisabled(true);
    const W = Math.min(1080, c.w),
      H = Math.round((W * c.h) / c.w),
      cvs = core.cv(W, H),
      x = cvs.getContext('2d'),
      pages = [];
    for (let k = 0; k < n; k++) {
      x.drawImage(await sourceAt(c, clipTime(c, k, n, fps)), 0, 0, W, H);
      pages.push(core.imagePage(cvs.toDataURL('image/jpeg', 0.9), W, H, '#000000'));
      status(`Extrayendo cuadros ${k + 1} de ${n}…`);
      if (k % 4 === 0) await tick();
    }
    st.busy = false;
    status('');
    $('#modal').classList.remove('on');
    core.openProject(
      {name: c.name.replace(/\.[^.]+$/, ''), w: W, h: H, pages},
      {tab: 'gif', fmt: 'png', all: true},
    );
  }

  function open(opts = {}) {
    render();
    $('#modal').classList.add('on');
    if (opts.pick) $('#gif-file').click();
  }

  function mount(api) {
    core = api;
    M = $('#mbox');
    M.addEventListener('click', onClick);
    M.addEventListener('input', onInput);
    M.addEventListener('change', onChange);
    M.addEventListener('dragover', ev => {
      if ($('#gif-drop', M)) ev.preventDefault();
    });
    M.addEventListener('drop', ev => {
      if (!$('#gif-drop', M)) return;
      ev.preventDefault();
      addFiles(ev.dataTransfer.files);
    });
  }

  G.mount = mount;
  G.open = open;
})();
