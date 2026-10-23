// Home: new project wizard
const CATS = [
  {id: 'social', name: 'Redes sociales', desc: 'Instagram, TikTok, Facebook, X, Pinterest', spr: 'phone'},
  {id: 'video', name: 'Video y streaming', desc: 'Miniaturas de YouTube, banners y emotes', spr: 'gamepad'},
  {id: 'png', name: 'PNG sin fondo', desc: 'Logos, stickers e íconos transparentes', spr: 'gem'},
  {id: 'print', name: 'Impresión', desc: 'Hojas A4 y carta, tarjetas, postales y pósters', spr: 'printer'},
  {id: 'slides', name: 'Presentación', desc: 'Diapositivas 16:9 o 4:3', spr: 'chart'},
  {id: 'web', name: 'Web y apps', desc: 'Imagen para compartir, íconos y fondos de pantalla', spr: 'globe'},
  {id: 'photo', name: 'Editar una foto mía', desc: 'Sube una imagen y retócala', spr: 'camera'},
  {id: 'pdf', name: 'Trabajar con un PDF', desc: 'Conviértelo en páginas editables', spr: 'doc'},
  {
    id: 'clip',
    name: 'Trabajar con un video',
    desc: 'Crea un GIF o edita los cuadros de un video',
    spr: 'film',
  },
  {
    id: 'custom',
    name: 'Medidas propias',
    desc: 'Escribe el tamaño en px, cm, mm o pulgadas',
    spr: 'pencil',
  },
];
const DEST = {
  social: [
    ['Instagram · Publicación cuadrada', 1080, 1080, 'Feed'],
    ['Instagram · Publicación vertical', 1080, 1350, 'Feed 4:5'],
    ['Instagram · Historia o Reel', 1080, 1920, '9:16'],
    ['TikTok · Video', 1080, 1920, '9:16'],
    ['Facebook · Publicación', 1200, 630, ''],
    ['Facebook · Portada', 820, 312, ''],
    ['X (Twitter) · Publicación', 1600, 900, '16:9'],
    ['X (Twitter) · Cabecera', 1500, 500, '3:1'],
    ['Pinterest · Pin', 1000, 1500, '2:3'],
    ['LinkedIn · Publicación', 1200, 627, ''],
    ['LinkedIn · Banner', 1584, 396, ''],
    ['WhatsApp · Estado', 1080, 1920, '9:16'],
    ['Foto de perfil', 400, 400, 'Cuadrada'],
  ],
  video: [
    ['YouTube · Miniatura', 1280, 720, '16:9'],
    ['YouTube · Banner del canal', 2560, 1440, ''],
    ['Video Full HD', 1920, 1080, '16:9'],
    ['Video vertical', 1080, 1920, '9:16'],
    ['Twitch · Banner de perfil', 1200, 480, ''],
    ['Twitch · Emote', 112, 112, 'PNG transparente'],
    ['Discord · Avatar', 512, 512, ''],
    ['Discord · Banner', 960, 540, ''],
  ],
  png: [
    ['Sticker o ícono', 512, 512, 'Recomendado'],
    ['Logo', 1000, 1000, ''],
    ['Ícono pequeño', 256, 256, ''],
    ['Sprite pixel', 128, 128, 'Se ve nítido al ampliar'],
    ['Emote', 112, 112, ''],
    ['Recorte grande', 2000, 2000, 'Alta resolución'],
  ],
  print: [
    ['A4 vertical · 150 ppp', 1240, 1754, 'Casero'],
    ['A4 vertical · 300 ppp', 2480, 3508, 'Imprenta'],
    ['A4 horizontal · 150 ppp', 1754, 1240, ''],
    ['Carta · 150 ppp', 1275, 1650, ''],
    ['Tarjeta de presentación · 300 ppp', 1050, 600, '3.5 × 2 in'],
    ['Postal 10 × 15 cm · 300 ppp', 1181, 1772, ''],
    ['Invitación 5 × 7 in · 300 ppp', 1500, 2100, ''],
    ['Póster 18 × 24 in · 100 ppp', 1800, 2400, ''],
  ],
  slides: [
    ['Presentación 16:9 · Full HD', 1920, 1080, ''],
    ['Presentación 16:9 · HD', 1280, 720, ''],
    ['Presentación 4:3', 1600, 1200, ''],
  ],
  web: [
    ['Imagen para compartir (OG)', 1200, 630, 'Vista previa en redes'],
    ['Banner web', 1920, 600, ''],
    ['Ícono de app', 1024, 1024, ''],
    ['Favicon grande', 256, 256, ''],
    ['Fondo de pantalla Full HD', 1920, 1080, ''],
    ['Fondo de pantalla móvil', 1170, 2532, ''],
  ],
};
const BGM = [
  ['none', 'Transparente', 'Para PNG sin fondo'],
  ['white', 'Blanco', 'Liso'],
  ['color', 'Color liso', 'Tú eliges'],
  ['gradient', 'Degradado pixel', 'Dos colores'],
  ['pattern', 'Patrón', 'Rayas, puntos, estrellas'],
];
const HOME_FACTS = [
  ['doc', 'Diseño', 'Capas, texto, formas, imágenes con filtros y recorte, plantillas y kit de marca.'],
  ['printer', 'Impresión', 'Póster en hojas con plano de armado y separación de logos por color y forma.'],
  ['film', 'Animación', 'GIF a partir de videos, imágenes o páginas, con edición cuadro a cuadro.'],
  ['download', 'Salida', 'PNG, JPG, WebP, PDF, ZIP y GIF.'],
];
const H = {
  step: 1,
  showCats: false,
  cat: null,
  dest: -1,
  custom: false,
  cw: 1080,
  ch: 1080,
  unit: 'px',
  dpi: 300,
  bg: 'gradient',
  c1: '#0b2a8a',
  c2: '#3fe0ff',
  pat: 'stripes',
  tpl: -1,
  name: '',
  photo: null,
  pdf: null,
  psize: 'photo',
  sure: false,
  tc: {},
};
let savedInfo = null;
const homeEl = $('#home');
const catOf = id => CATS.find(c => c.id === id);
const isFile = () => H.cat === 'photo' || H.cat === 'pdf';
function homeSize() {
  if (H.cat === 'photo')
    return H.photo
      ? {
          photo: [H.photo.w, H.photo.h],
          sq: [1080, 1080],
          ig: [1080, 1350],
          st: [1080, 1920],
          hd: [1920, 1080],
        }[H.psize]
      : null;
  if (H.cat === 'pdf') return null;
  if (H.cat === 'custom' || H.custom) {
    const f = H.unit === 'px' ? 1 : H.unit === 'cm' ? H.dpi / 2.54 : H.unit === 'mm' ? H.dpi / 25.4 : H.dpi;
    return [Math.round(H.cw * f), Math.round(H.ch * f)];
  }
  const d = (DEST[H.cat] || [])[H.dest];
  return d ? [d[1], d[2]] : null;
}
const sizeOK = z => z && z[0] >= 16 && z[1] >= 16 && z[0] <= 5000 && z[1] <= 5000;
const bgFromH = () =>
  H.bg === 'none'
    ? {pat: 'none', c1: '#ffffff', c2: '#ffffff'}
    : H.bg === 'white'
      ? {pat: 'solid', c1: '#ffffff', c2: '#ffffff'}
      : H.bg === 'color'
        ? {pat: 'solid', c1: H.c1, c2: H.c1}
        : H.bg === 'gradient'
          ? {pat: 'gradient', c1: H.c1, c2: H.c2}
          : {pat: H.pat, c1: H.c1, c2: H.c2};
const canNext = () =>
  H.step === 1 ? !!H.cat : H.cat === 'pdf' ? !!H.pdf : H.cat === 'photo' ? !!H.photo : sizeOK(homeSize());
function withSize(w, h, fn) {
  const ow = S.w,
    oh = S.h;
  S.w = w;
  S.h = h;
  try {
    return fn();
  } finally {
    S.w = ow;
    S.h = oh;
  }
}
function templateThumb(i, w, h) {
  const key = w + 'x' + h;
  H.tc[key] = H.tc[key] || {};
  if (!H.tc[key][i])
    H.tc[key][i] = withSize(w, h, () => renderPageCanvas(TPL[i].build(), Math.min(1, 220 / Math.max(w, h))));
  const src = H.tc[key][i],
    c = cv(src.width, src.height);
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
function swRow(key) {
  return `<div class="sws">${PAL.map(c => `<i class="sw" tabindex="0" role="button" aria-label="${c}" style="background:${c}" data-hc="${key}:${c}"></i>`).join('')}</div>`;
}
function bgConfig() {
  if (H.tpl >= 0)
    return '<p class="hint">La plantilla trae su propio fondo. Podrás cambiarlo en el editor.</p>';
  if (H.bg === 'none')
    return '<p class="hint">Verás un cuadriculado en el editor. Al descargar en PNG, el fondo queda transparente.</p>';
  if (H.bg === 'white') return '';
  const one = H.bg === 'color';
  return `<div class="bgcfg"><div class="row"><label style="min-width:90px">${one ? 'Color' : 'Color 1'}</label><input type="color" data-h="c1" value="${H.c1}"></div>${swRow('c1')}
  ${one ? '' : `<div class="row"><label style="min-width:90px">Color 2</label><input type="color" data-h="c2" value="${H.c2}"></div>${swRow('c2')}`}
  ${
    H.bg === 'pattern'
      ? `<div class="row"><label style="min-width:90px">Patrón</label><select data-h="pat">${[
          ['stripes', 'Rayas'],
          ['checker', 'Ajedrez'],
          ['dots', 'Puntos'],
          ['stars', 'Estrellas'],
        ]
          .map(([k, l]) => `<option value="${k}"${H.pat === k ? ' selected' : ''}>${l}</option>`)
          .join('')}</select></div>`
      : ''
  }</div>`;
}
function customForm() {
  return `<div class="cform"><div class="row wrap"><label class="num"><span>Ancho</span><input type="number" data-h="cw" value="${H.cw}" min="1" step="any"></label><label class="num"><span>Alto</span><input type="number" data-h="ch" value="${H.ch}" min="1" step="any"></label></div>
  <div class="row"><label style="min-width:70px">Unidad</label><select data-h="unit">${[
    ['px', 'Píxeles'],
    ['cm', 'Centímetros'],
    ['mm', 'Milímetros'],
    ['in', 'Pulgadas'],
  ]
    .map(([k, l]) => `<option value="${k}"${H.unit === k ? ' selected' : ''}>${l}</option>`)
    .join('')}</select></div>
  ${
    H.unit === 'px'
      ? ''
      : `<div class="row"><label style="min-width:70px">Calidad</label><select data-h="dpi">${[
          [72, '72 ppp · pantalla'],
          [150, '150 ppp · impresión casera'],
          [300, '300 ppp · imprenta'],
        ]
          .map(([k, l]) => `<option value="${k}"${H.dpi === k ? ' selected' : ''}>${l}</option>`)
          .join('')}</select></div>`
  }
  <p class="hint">Equivale a <b id="hres"></b></p></div>`;
}
function homeBody() {
  const st = H.step,
    cat = catOf(H.cat);
  if (st === 1) {
    return `<div class="hhero">${LOGO_MARK}<div><div class="hword">MOON<b>LIGHT</b> STUDIO</div><p>Diseño, impresión y GIF en pixel art</p></div></div>
    <h2>Tu estudio de diseño en el navegador</h2>
    <p class="lead">Editor con estética pixel art que corre completo en tu equipo: sin cuenta ni servidor, tus archivos no salen de aquí.</p>
    <ul class="hfacts">${HOME_FACTS.map(([ic, t, d]) => `<li><span data-ic="${ic}"></span><b>${t}</b><small>${d}</small></li>`).join('')}</ul>
    <div class="hcta"><button class="btn on" data-act="toggle" aria-expanded="${H.showCats}">${H.showCats ? 'Ocultar opciones' : 'Nuevo proyecto'}</button></div>
    ${H.showCats ? `<h3 class="hh">¿Qué vas a crear?</h3><div class="hgrid">${CATS.map(c => `<button class="hcard${H.cat === c.id ? ' on' : ''}" data-act="cat:${c.id}"><span data-ic="${c.spr}"></span><b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>` : ''}
    ${savedInfo ? `<h3 class="hh">O sigue con tu trabajo</h3><button class="hcard wide" data-act="continue"><span data-ic="star"></span><b>Continuar: ${esc(savedInfo.name)}</b><small>${savedInfo.w} × ${savedInfo.h} px · guardado en este navegador</small></button>` : ''}`;
  }
  if (st === 2 && H.cat === 'photo') {
    const opts = [
      ['photo', 'Igual que la foto'],
      ['sq', 'Cuadrado 1080 × 1080'],
      ['ig', 'Instagram vertical 1080 × 1350'],
      ['st', 'Historia 1080 × 1920'],
      ['hd', 'Pantalla completa 1920 × 1080'],
    ];
    return `<h2>Sube tu foto</h2><p class="lead">Acepta JPG, PNG, WebP y GIF. Se procesa en tu navegador, no se envía a ningún servidor.</p>
    <button class="btn on" data-act="pickphoto">${H.photo ? 'Cambiar foto' : 'Elegir una foto'}</button><input type="file" id="hphoto" accept="image/*" hidden>
    ${
      H.photo
        ? `<h3 class="hh">Tu foto · ${H.photo.w} × ${H.photo.h} px</h3><img class="hprev" src="${esc(H.photo.src)}" alt="Foto elegida">
    <h3 class="hh">Tamaño del lienzo</h3><div class="hlist">${opts.map(([k, l]) => `<button class="hdest${H.psize === k ? ' on' : ''}" data-act="psz:${k}"><span class="dt"><b>${l}</b>${k === 'photo' ? `<small>${H.photo.w} × ${H.photo.h} px</small>` : ''}</span></button>`).join('')}</div>`
        : ''
    }`;
  }
  if (st === 2 && H.cat === 'pdf') {
    return `<h2>Elige tu PDF</h2><p class="lead">Cada página se convierte en una imagen editable (máximo 30 páginas). Se procesa en tu navegador.</p>
    <button class="btn on" data-act="pickpdf">${H.pdf ? 'Cambiar PDF' : 'Elegir un PDF'}</button><input type="file" id="hpdf" accept="application/pdf,.pdf" hidden>
    ${H.pdf ? `<p class="lead" style="margin-top:14px">Archivo: <b>${esc(H.pdf.name)}</b></p>` : ''}`;
  }
  if (st === 2) {
    if (H.cat === 'custom')
      return `<h2>Escribe tus medidas</h2><p class="lead">Usa píxeles para pantalla o cm, mm y pulgadas para impresión.</p>${customForm()}`;
    const list = DEST[H.cat] || [];
    return `<h2>¿Dónde lo vas a usar?</h2><p class="lead">${cat.name}: elige el destino y tendrás los píxeles exactos.</p>
    <div class="hlist">${list
      .map((d, i) => {
        const r = d[1] / d[2],
          rw = r >= 1 ? 40 : Math.max(8, Math.round(40 * r)),
          rh = r >= 1 ? Math.max(8, Math.round(40 / r)) : 40;
        return `<button class="hdest${H.dest === i && !H.custom ? ' on' : ''}" data-act="dest:${i}"><span class="rbox"><i style="width:${rw}px;height:${rh}px"></i></span><span class="dt"><b>${d[0]}</b><small>${d[1]} × ${d[2]} px${d[3] ? ' · ' + d[3] : ''}</small></span></button>`;
      })
      .join('')}
      <button class="hdest${H.custom ? ' on' : ''}" data-act="dest:custom"><span class="rbox"><i style="width:30px;height:22px;background:var(--gold)"></i></span><span class="dt"><b>Otras medidas</b><small>px, cm, mm o pulgadas</small></span></button></div>
    ${H.custom ? customForm() : ''}`;
  }
  return `<h2>Fondo y plantilla</h2><p class="lead">Elige cómo empieza tu lienzo. Todo se puede cambiar después.</p>
  <h3 class="hh">Fondo</h3><div class="hgrid sm">${BGM.map(([k, l, d]) => `<button class="hcard${H.bg === k && H.tpl < 0 ? ' on' : ''}" data-act="bg:${k}"><span data-bgp="${k}"></span><b>${l}</b><small>${d}</small></button>`).join('')}</div>
  <div id="bgcfg">${bgConfig()}</div>
  <h3 class="hh">Plantilla (opcional)</h3><div class="hgrid sm"><button class="hcard${H.tpl < 0 ? ' on' : ''}" data-act="tpl:-1"><b>Empezar en blanco</b><small>Con el fondo elegido arriba</small></button>
  ${TPL.map((t, i) => `<button class="hcard tpl${H.tpl === i ? ' on' : ''}" data-act="tpl:${i}"><span data-tp="${i}"></span><b>${t.name}</b></button>`).join('')}</div>`;
}
function homeShow() {
  return '<section class="hshow"><h3 class="hh">Lo que puedes crear</h3><div class="hstage"></div></section>';
}
function homeSide() {
  const z = homeSize(),
    cat = catOf(H.cat),
    d = (DEST[H.cat] || [])[H.dest];
  const destName =
    H.cat === 'custom' || H.custom
      ? 'Medidas propias'
      : H.cat === 'photo'
        ? 'Tu foto'
        : H.cat === 'pdf'
          ? H.pdf
            ? H.pdf.name
            : '—'
          : d
            ? d[0]
            : '—';
  const bgName =
    isFile() || H.step < 3 ? '—' : H.tpl >= 0 ? 'De la plantilla' : (BGM.find(b => b[0] === H.bg) || [])[1];
  const hasSize = sizeOK(z);
  return `<div class="sumbox"><h3>Tu lienzo</h3><div class="sprev"><canvas id="sprev" width="10" height="10"></canvas></div>
  <div class="sline"><span>Tipo</span><b>${cat ? cat.name : '—'}</b></div><div class="sline"><span>Destino</span><b>${esc(destName)}</b></div>
  <div class="sline"><span>Tamaño</span><b>${hasSize ? `${z[0]} × ${z[1]} px` : H.cat === 'pdf' ? 'Del PDF' : '—'}</b></div><div class="sline"><span>Fondo</span><b>${bgName || '—'}</b></div>
  ${z && (z[0] > 5000 || z[1] > 5000) ? '<p class="hint" style="color:var(--warn)">El máximo es 5000 px por lado.</p>' : ''}
  <label class="num" style="margin-top:10px"><span>Nombre del proyecto</span><input type="text" data-h="name" value="${esc(H.name)}" placeholder="Sin título" maxlength="40"></label></div>`;
}
function paintSide() {
  const c = $('#sprev');
  if (!c) return;
  const z = homeSize();
  if (!sizeOK(z)) {
    c.width = 80;
    c.height = 80;
    const x = c.getContext('2d');
    x.fillStyle = '#0b2a8a';
    x.fillRect(0, 0, 80, 80);
    x.fillStyle = '#3fe0ff';
    x.font = '40px VT323,monospace';
    x.fillText('?', 32, 52);
    return;
  }
  const k = Math.min(220 / z[0], 150 / z[1], 1) || 1,
    w = Math.max(8, Math.round(z[0] * k)),
    h = Math.max(8, Math.round(z[1] * k));
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (H.cat === 'photo' && H.photo) {
    const im = getImg(H.photo.src),
      draw = () => {
        const s = Math.max(w / im.width, h / im.height);
        x.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s);
      };
    im._ok
      ? draw()
      : im.addEventListener(
          'load',
          () => {
            draw();
          },
          {once: true},
        );
    return;
  }
  if (H.step === 3 && H.tpl >= 0) {
    x.drawImage(templateThumb(H.tpl, z[0], z[1]), 0, 0, w, h);
    return;
  }
  if (H.cat === 'pdf') {
    x.fillStyle = '#fff';
    x.fillRect(0, 0, w, h);
    return;
  }
  const b = H.step < 3 ? {pat: 'none', c1: '#fff', c2: '#fff'} : bgFromH();
  if (b.pat === 'none') {
    for (let j = 0; j < h; j += 8)
      for (let i = 0; i < w; i += 8) {
        x.fillStyle = ((i + j) / 8) & 1 ? '#2a3f8f' : '#1b2b66';
        x.fillRect(i, j, 8, 8);
      }
  } else x.drawImage(bgCanvas({bg: b}, z[0], z[1]), 0, 0, w, h);
}
function paintBgPreviews() {
  $$('[data-bgp]', homeEl).forEach(sp => {
    const k = sp.dataset.bgp,
      b =
        k === 'none'
          ? 'none'
          : k === 'white'
            ? 'solid'
            : k === 'color'
              ? 'solid'
              : k === 'gradient'
                ? 'gradient'
                : H.pat;
    const c = bgPreview(b, k === 'white' ? '#ffffff' : H.c1, k === 'white' ? '#ffffff' : H.c2);
    c.style.cssText = 'width:64px;height:42px;image-rendering:pixelated;border:2px solid #fff;display:block';
    sp.replaceChildren(c);
  });
}
const LOGO_HTML = $('#logo').innerHTML;
const LOGO_MARK = $('#logo svg').outerHTML;
let homeKey = '';
function renderHome() {
  const last = isFile() ? 2 : 3,
    st = H.step;
  const key = `${H.step}|${H.cat}|${H.showCats}`;
  if (key !== homeKey) {
    homeKey = key;
    playEnter(homeEl, 1400);
  }
  homeEl.innerHTML = `<div class="hwrap"><header class="hhead"><div id="logo">${LOGO_HTML}</div>
    <span class="sp"></span>
    <button class="btn sm" data-act="help">? Ayuda</button>${S.active ? '<button class="btn sm on" data-act="close">Volver al editor</button>' : ''}</header>
    <div class="hmain${st === 1 ? ' cover' : ''}"><section class="hbody">${homeBody()}
    ${st > 1 ? `<div class="hnav"><button class="btn" data-act="back">← Atrás</button><span class="sp"></span>${st < last ? `<button class="btn on" data-act="next"${canNext() ? '' : ' disabled'}>Siguiente →</button>` : `<button class="btn on" data-act="create"${canNext() ? '' : ' disabled'}>${H.sure ? '¿Reemplazar el proyecto actual? Pulsa de nuevo' : 'Crear diseño ✓'}</button>`}</div>` : ''}</section>${st === 1 ? homeShow() : ''}
    <aside class="hside" id="hside">${homeSide()}</aside></div></div>`;
  $$('[data-ic]', homeEl).forEach(sp => sp.replaceChildren(MoonIcons.el(sp.dataset.ic)));
  const z = homeSize();
  $$('[data-tp]', homeEl).forEach(sp => {
    const sz = sizeOK(z) ? z : [1080, 1080];
    sp.replaceChildren(templateThumb(+sp.dataset.tp, sz[0], sz[1]));
  });
  paintBgPreviews();
  paintSide();
  hres();
}
function hres() {
  const e = $('#hres');
  if (!e) return;
  const z = homeSize();
  e.textContent =
    z && isFinite(z[0]) && isFinite(z[1])
      ? `${z[0]} × ${z[1]} px${z[0] > 5000 || z[1] > 5000 ? ' (máximo 5000 por lado)' : ''}`
      : '—';
}
function openHome() {
  Object.assign(H, {
    step: 1,
    showCats: false,
    cat: null,
    dest: -1,
    custom: false,
    tpl: -1,
    name: '',
    photo: null,
    pdf: null,
    psize: 'photo',
    sure: false,
  });
  homeEl.classList.add('on');
  homeKey = '';
  renderHome();
  homeEl.scrollTop = 0;
}
function closeHome() {
  homeEl.classList.remove('on');
}
homeEl.addEventListener('click', ev => {
  const sw = ev.target.closest('[data-hc]');
  if (sw) {
    const [k, v] = sw.dataset.hc.split(':');
    H[k] = v;
    $$(`[data-h="${k}"]`, homeEl).forEach(i => (i.value = v));
    paintBgPreviews();
    paintSide();
    return;
  }
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const [a, v] = b.dataset.act.split(':');
  if (a !== 'create') H.sure = false;
  if (a === 'cat' && v === 'clip') {
    closeHome();
    MoonGif.open({pick: true});
  } else if (a === 'cat') {
    H.cat = v;
    H.dest = -1;
    H.custom = v === 'custom';
    H.bg = v === 'png' ? 'none' : v === 'print' ? 'white' : 'gradient';
    H.tpl = -1;
    H.step = 2;
    renderHome();
    homeEl.scrollTop = 0;
  } else if (a === 'dest') {
    if (v === 'custom') {
      H.custom = true;
      H.dest = -1;
    } else {
      H.custom = false;
      H.dest = +v;
    }
    renderHome();
  } else if (a === 'psz') {
    H.psize = v;
    renderHome();
  } else if (a === 'next') {
    if (canNext()) {
      H.step++;
      renderHome();
      homeEl.scrollTop = 0;
    }
  } else if (a === 'back') {
    H.step = Math.max(1, H.step - 1);
    if (H.step === 1) H.cat = null;
    renderHome();
    homeEl.scrollTop = 0;
  } else if (a === 'bg') {
    H.bg = v;
    H.tpl = -1;
    renderHome();
  } else if (a === 'tpl') {
    H.tpl = +v;
    renderHome();
  } else if (a === 'pickphoto') $('#hphoto').click();
  else if (a === 'pickpdf') $('#hpdf').click();
  else if (a === 'toggle') {
    H.showCats = !H.showCats;
    renderHome();
  } else if (a === 'continue') continueSaved();
  else if (a === 'close') closeHome();
  else if (a === 'help') openHelp();
  else if (a === 'create') {
    if (S.active && !H.sure) {
      H.sure = true;
      renderHome();
      return;
    }
    createProject();
  }
});
homeEl.addEventListener('input', ev => {
  const t = ev.target,
    k = t.dataset.h;
  if (!k) return;
  if (k === 'name') {
    H.name = t.value;
    return;
  }
  if (k === 'cw' || k === 'ch') H[k] = parseFloat(t.value) || 0;
  else if (k === 'dpi') H.dpi = +t.value;
  else if (k === 'unit') {
    const z0 = homeSize() || [1080, 1080];
    H.unit = t.value;
    const f = H.unit === 'px' ? 1 : H.unit === 'cm' ? H.dpi / 2.54 : H.unit === 'mm' ? H.dpi / 25.4 : H.dpi;
    H.cw = +(z0[0] / f).toFixed(H.unit === 'px' ? 0 : 1);
    H.ch = +(z0[1] / f).toFixed(H.unit === 'px' ? 0 : 1);
  } else H[k] = t.value;
  if (k === 'unit') {
    renderHome();
    return;
  }
  if (k === 'pat' || k === 'c1' || k === 'c2') paintBgPreviews();
  $('#hside').innerHTML = homeSide();
  paintSide();
  hres();
  const nx = $('[data-act="next"]', homeEl) || $('[data-act="create"]', homeEl);
  if (nx) nx.disabled = !canNext();
});
homeEl.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'hphoto' && t.files[0])
    readImage(t.files[0], 3000)
      .then(o => {
        H.photo = o;
        H.psize = 'photo';
        renderHome();
      })
      .catch(() => toast('Solo se aceptan imágenes'));
  if (t.id === 'hpdf' && t.files[0]) {
    H.pdf = t.files[0];
    renderHome();
  }
});
homeEl.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.matches('.sw')) {
    ev.target.click();
  }
});
function continueSaved() {
  try {
    restore(savedInfo.js);
  } catch {
    toast('No se pudo abrir el proyecto guardado');
    return;
  }
  resetHistory();
  S.active = true;
  S.fit = true;
  S.sel = [];
  S.tab = 'elements';
  afterOpen();
}
function afterOpen() {
  savedInfo = null;
  S.uploads = [];
  S.pages.forEach(p =>
    p.els.forEach(e => {
      if (e.type === 'image' && !S.uploads.includes(e.src)) S.uploads.push(e.src);
    }),
  );
  closeHome();
  renderRail();
  loadFonts().then(() => {
    bmCache.clear();
    refresh({props: true, panel: true, fit: true});
  });
  refresh({props: true, panel: true, fit: true});
  updHist();
}
async function createProject() {
  const z = homeSize();
  savedInfo = null;
  S.name = (H.name || '').trim() || 'Sin título';
  $('#name').value = S.name;
  resetHistory();
  S.sel = [];
  S.cur = 0;
  S.fit = true;
  S.uploads = [];
  S.active = true;
  if (H.cat === 'pdf') {
    S.w = 1080;
    S.h = 1080;
    S.pages = [newPage({pat: 'solid', c1: '#ffffff', c2: '#ffffff'})];
    S.tab = 'images';
    closeHome();
    renderRail();
    refresh({props: true, panel: true, fit: true});
    S.conv.fitpdf = true;
    await importPDF(H.pdf);
    if (S.pages.length > 1) {
      S.pages.shift();
      S.cur = 0;
    }
    resetHistory();
    S.sel = [];
    S.conv.fmt = 'pdf';
    refresh({props: true, panel: true, fit: true});
    return;
  }
  S.w = clamp(z[0], 16, 5000);
  S.h = clamp(z[1], 16, 5000);
  if (H.cat === 'photo') {
    const pgx = newPage({pat: 'solid', c1: '#ffffff', c2: '#ffffff'});
    pgx.els.push(mk('image', {src: H.photo.src, x: 0, y: 0, w: S.w, h: S.h, px: 1}));
    S.pages = [pgx];
    S.tab = 'images';
  } else if (H.tpl >= 0) {
    S.pages = [TPL[H.tpl].build()];
    S.tab = 'text';
  } else {
    S.pages = [newPage(bgFromH())];
    S.tab = 'elements';
  }
  S.conv.fmt = S.pages[0].bg.pat === 'none' ? 'png' : H.cat === 'print' ? 'pdf' : 'jpg';
  S.conv.pages = 'cur';
  afterOpen();
  toast(`Lienzo listo: ${S.w} × ${S.h} px`);
}
function openHelp() {
  $('#mbox').innerHTML = `<h3>Guía rápida</h3>
  <h4>1 · Empieza</h4><p>En <b>Inicio</b> eliges qué vas a crear y dónde lo usarás. El editor prepara los píxeles exactos por ti.</p>
  <h4>2 · Agrega cosas</h4><p>En el menú de la izquierda: <b>Plantillas</b>, <b>Elementos</b>, <b>Texto</b>, <b>Imágenes</b> y <b>Fondo</b>.</p>
  <h4>3 · Edítalo</h4><p>Haz clic en un objeto para seleccionarlo y arrástralo. Las esquinas lo agrandan y el punto de arriba lo gira. A la derecha cambias color, tamaño, sombra, filtros y recorte. Doble clic en un texto para escribir.</p>
  <h4>4 · PNG sin fondo</h4><p>En <b>Fondo</b> elige <b>Transparente</b> y en <b>Exportar</b> descarga en PNG. Para quitar el fondo de una foto, selecciónala y usa <b>Quitar fondo</b>.</p>
  <h4>Más herramientas</h4><p><b>Elementos</b>: formas, collage con celdas para fotos, código QR y gráficos. <b>Dibujar</b>: pincel y borrador pixel a pixel. <b>Marca</b>: tus colores y fuentes guardados. En Exportar puedes sacar tu diseño en varios tamaños a la vez. Al seleccionar un objeto, el panel derecho ofrece modos de mezcla, contorno de sticker, degradados y efectos de texto.</p>
  <h4>Imprimir en grande y separar piezas</h4><p><b>Póster en hojas</b> parte un logo o diseño en hojas A4, Carta y más, con el tamaño final en cm. <b>Separar piezas</b> divide un logo por color y forma en proyectos aparte, sin tocar el original.</p>
  <h4>Crear GIF</h4><p><b>Crear GIF</b> combina videos e imágenes (o páginas de tu diseño) en un GIF animado: recortas cada video, eliges la duración de cada imagen y puedes unirlos con fundido.</p>
  <h4>Reglas y guías</h4><p>Arrastra desde la regla de arriba o la de la izquierda para crear una guía. Los objetos se pegan a ellas. Para quitarla, arrástrala de vuelta a la regla; <b>Quitar guías</b> borra todas. El botón <b>Reglas</b> las oculta.</p>
  <h4>5 · Cambiar el tamaño</h4><p>Pulsa el recuadro con los píxeles de la barra superior, o abre <b>Tamaño</b>.</p>
  <h4>6 · Descarga</h4><p>En <b>Exportar</b> descargas JPG, PNG o PDF. También puedes convertir un PDF en páginas editables.</p>
  <h4>Atajos</h4><p><kbd>Ctrl+Z</kbd> deshacer · <kbd>Ctrl+Y</kbd> rehacer · <kbd>Ctrl+D</kbd> duplicar · <kbd>Supr</kbd> borrar · <kbd>Flechas</kbd> mover · <kbd>Shift+clic</kbd> varios objetos · <kbd>Ctrl+rueda</kbd> zoom</p>
  <div class="row"><button class="btn sm warn" id="xclose">Cerrar</button></div>`;
  $('#modal').classList.add('on');
}
$('#home-btn').onclick = openHome;
$('#help-btn').onclick = openHelp;
$('#sizechip').onclick = () => {
  S.tab = 'size';
  renderRail();
  renderPanel();
};
