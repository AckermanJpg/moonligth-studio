// Panels
const RAIL = [
  ['home', 'Inicio', 'home'],
  ['grp', 'Crear'],
  ['templates', 'Plantillas', 'doc'],
  ['elements', 'Elementos', 'star'],
  ['text', 'Texto', 'text'],
  ['images', 'Imágenes', 'camera'],
  ['draw', 'Dibujar', 'pencil'],
  ['bg', 'Fondo', 'moon'],
  ['brand', 'Marca', 'palette'],
  ['grp', 'Proyecto'],
  ['pages', 'Páginas', 'pages'],
  ['size', 'Tamaño', 'resize'],
  ['grp', 'Impresión'],
  ['poster', 'Póster en hojas', 'printer'],
  ['split', 'Separar piezas', 'gem'],
  ['grp', 'Animación'],
  ['gif', 'Crear GIF', 'film'],
  ['grp', 'Salida'],
  ['export', 'Exportar', 'download'],
];
const LEAD = {
  templates: 'Diseños listos para empezar. Elige uno y cambia sus textos, colores e imágenes.',
  elements: 'Formas, líneas y pegatinas. Haz clic en uno para ponerlo en el lienzo.',
  text: 'Agrega títulos y textos. Haz doble clic sobre un texto para escribirlo.',
  images: 'Sube fotos desde tu equipo. Al seleccionarlas puedes recortar, filtrar o quitar su fondo.',
  bg: 'Cambia el fondo de la página. Elige Transparente si quieres un PNG sin fondo.',
  pages: 'Un diseño puede tener varias páginas. Aquí las ordenas, duplicas o borras.',
  draw: 'Pinta pixel a pixel. Cada trazo queda como un objeto que puedes mover, escalar o recolorear.',
  brand: 'Guarda los colores y fuentes de tu marca y aplícalos con un clic.',
  size: 'Cambia las medidas del lienzo en píxeles. Elige un destino o escribe tus medidas.',
  export: 'Descarga tu diseño como JPG, PNG o PDF, o convierte otros archivos.',
  gif: 'Combina videos e imágenes en un solo GIF animado.',
  poster:
    'Agranda un logo o diseño a medidas reales en cm y pártelo en hojas numeradas para imprimir y pegar.',
  split:
    'Separa un logo o diseño en piezas por color y por forma, respetando sus bordes, cada una como proyecto aparte.',
};
function renderRail() {
  const R = $('#rail');
  R.innerHTML = '';
  RAIL.forEach(([k, l, spr]) => {
    if (k === 'grp') {
      const d = document.createElement('div');
      d.className = 'rgroup';
      d.textContent = l;
      R.append(d);
      return;
    }
    const b = document.createElement('button');
    b.className = 'tab' + (S.tab === k ? ' on' : '');
    b.dataset.tab = k;
    b.append(MoonIcons.el(spr), l);
    R.append(b);
  });
}
const BG_COMBOS_PIXEL = [
  ['#0b2a8a', '#3fe0ff'],
  ['#020821', '#1a5cff'],
  ['#050d2b', '#d6f8ff'],
  ['#1a5cff', '#d6f8ff'],
  ['#000000', '#8a2be2'],
  ['#ffffff', '#d6f8ff'],
];
const BG_COMBOS_NORMAL = [
  ['#ffffff', '#e5e7eb'],
  ['#f97316', '#ec4899'],
  ['#3b82f6', '#8b5cf6'],
  ['#10b981', '#06b6d4'],
  ['#111827', '#4b5563'],
  ['#fde68a', '#fca5a5'],
];
const STYLE_BASE = {normal: {px: 1, fill: '#3b82f6'}, pixel: {}};
const styleSeg = () =>
  `<div class="seg styleseg" role="group" aria-label="Estilo">${[
    ['normal', 'Normal'],
    ['pixel', 'Pixel'],
  ]
    .map(
      ([k, l]) =>
        `<button class="btn sm${S.style === k ? ' on' : ''}" data-style="${k}" aria-pressed="${S.style === k}">${l}</button>`,
    )
    .join('')}</div>`;
function setStyle(k) {
  S.style = k;
  store.set(STYLE_KEY, k);
  renderPanel();
}
const swHTML = f =>
  `<div class="sws" data-for="${f}">${PAL.map(c => `<i class="sw" tabindex="0" role="button" aria-label="${c}" style="background:${c}" data-color="${c}"></i>`).join('')}</div>`;
function bgPreview(k, c1, c2, smooth = S.style === 'normal') {
  const W = 192,
    H = 128;
  if (k === 'none') {
    const c = cv(W / 8, H / 8),
      x = c.getContext('2d');
    for (let j = 0; j < H / 8; j++)
      for (let i = 0; i < W / 8; i++) {
        x.fillStyle = (i + j) & 1 ? '#2a3f8f' : '#1b2b66';
        x.fillRect(i, j, 1, 1);
      }
    return c;
  }
  return bgCanvas({bg: {pat: k, c1, c2, smooth}}, W, H);
}
const PANELS = {
  templates() {
    return `<h3>Plantillas</h3>${styleSeg()}<div class="grid g2" id="tpls"></div><p class="hint">Al elegir una, reemplaza la página actual. Puedes deshacer con Ctrl+Z.</p>`;
  },
  elements() {
    const pixel = S.style === 'pixel';
    return `<h3>Elementos</h3>${styleSeg()}<div class="row"><input type="text" id="elsearch" placeholder="${pixel ? 'Buscar: corazón, espada, nube…' : 'Buscar: círculo, flecha, globo…'}" aria-label="Buscar elementos"></div>
    <h4>Formas</h4><div class="grid" id="shp">${SHAPES.filter(s => (pixel ? !s[2] : true))
      .map(
        ([k, n]) =>
          `<button class="card" data-shape="${k}" title="${n}"><span data-thumb="${k}"></span></button>`,
      )
      .join('')}</div>
    <h4>Cuadrículas y collage</h4><div class="grid" id="grds">${GRIDS.map((g, i) => `<button class="card gridc" data-grid="${i}" title="collage cuadrícula ${g[0]}"><span data-gthumb="${i}"></span><span>${g[0]}</span></button>`).join('')}</div>
    <h4>Herramientas</h4><div class="grid g2"><button class="card" data-tool="qr" title="código qr enlace"><span data-ic2="gem"></span>Código QR</button><button class="card" data-tool="chart" title="gráfico barras pastel líneas datos"><span data-ic2="chart"></span>Gráfico</button></div>
    ${
      pixel
        ? `<h4>Íconos y pegatinas pixel (${Object.keys(SPR).length})</h4><div class="grid" id="spr">${Object.keys(
            SPR,
          )
            .map(
              k =>
                `<button class="card" data-sprite="${k}" title="${k} ${SPRN[k] || ''}"><span data-thumb="s:${k}"></span></button>`,
            )
            .join('')}</div>`
        : '<p class="hint">Las pegatinas e íconos pixel están en el estilo Pixel.</p>'
    }
    <p class="hint">Shift + clic para multi-selección. Arrastra las esquinas para escalar.</p>`;
  },
  text() {
    const pixel = S.style === 'pixel',
      groups = Object.entries(FONTG).filter(([g]) => pixel || g !== 'Pixel');
    return `<h3>Texto</h3>${styleSeg()}<h4>Estilos base</h4>${
      pixel
        ? `<button class="txtbtn" data-text="h" style="font:400 15px 'Press Start 2P'">Agregar título</button>
    <button class="txtbtn" data-text="s" style="font:400 18px 'Silkscreen'">Agregar subtítulo</button>
    <button class="txtbtn" data-text="b" style="font:400 22px 'DotGothic16'">Agregar un poco de texto</button>
    <h4>Combinaciones</h4>
    <button class="txtbtn" data-text="c1" style="font:400 15px 'Press Start 2P';color:#3fe0ff;text-shadow:3px 3px 0 #1a5cff">FULL MOON</button>
    <button class="txtbtn" data-text="c2" style="font:700 26px 'Pixelify Sans';color:#ffd84a;text-shadow:3px 3px 0 #ff3d6e">ALL-OUT!</button>
    <button class="txtbtn" data-text="c3" style="font:400 32px 'VT323';color:#d6f8ff">00:00 THE DARK HOUR</button>
    <button class="txtbtn" data-text="c4" style="font:400 14px 'Silkscreen';color:#fff;text-shadow:3px 3px 0 #0b2a8a">MEMENTO MORI</button>`
        : `<button class="txtbtn" data-text="nh" style="font:700 24px 'Montserrat'">Agregar título</button>
    <button class="txtbtn" data-text="ns" style="font:400 20px 'Poppins'">Agregar subtítulo</button>
    <button class="txtbtn" data-text="nb" style="font:400 16px 'Nunito'">Agregar un poco de texto</button>
    <h4>Combinaciones</h4>
    <button class="txtbtn" data-text="n1" style="font:700 28px 'Playfair Display'">Elegancia</button>
    <button class="txtbtn" data-text="n2" style="font:400 32px 'Bebas Neue';color:#ff6b6b;letter-spacing:2px">GRAN OFERTA</button>
    <button class="txtbtn" data-text="n3" style="font:700 30px 'Dancing Script';color:#ff8fc7">Con cariño</button>
    <button class="txtbtn" data-text="n4" style="font:400 18px 'Oswald';letter-spacing:5px">MINIMAL STUDIO</button>`
    }
    <h4>Todas las fuentes (${groups.reduce((n, [, l]) => n + l.length, 0)})</h4>${groups
      .map(
        ([g, l]) =>
          `<div class="hint">${g}</div>${l.map(f => `<button class="txtbtn" data-font="${f}" style="font:400 20px '${f}',monospace">${f}</button>`).join('')}`,
      )
      .join('')}`;
  },
  images() {
    return `<h3>Imágenes</h3><div class="drop" id="drop">Arrastra imágenes aquí o pega con Ctrl+V</div>
    <button class="btn" id="pick" style="width:100%">Elegir archivo</button><input type="file" id="file" accept="image/*" multiple hidden>
    <h4>Tus imágenes</h4>${S.uploads.length ? `<div class="ups">${S.uploads.map((s, i) => `<img data-up="${i}" src="${s}" alt="Imagen ${i + 1}" tabindex="0">`).join('')}</div>` : '<p class="hint">Aún no subes ninguna. Usa el control Pixelado para convertirlas en pixel art.</p>'}`;
  },
  bg() {
    const b = pg().bg,
      none = b.pat === 'none',
      pixel = S.style === 'pixel';
    return `<h3>Fondo</h3>${styleSeg()}<h4>Tipo de fondo</h4><div class="grid g2">${PATS.filter(
      ([k]) => pixel || ['none', 'solid', 'gradient', 'image'].includes(k),
    )
      .map(
        ([k, n, d]) =>
          `<button class="card" data-pat="${k}" style="${b.pat === k ? 'border-color:var(--gold);box-shadow:3px 3px 0 var(--royal)' : ''}"><span data-pp="${k}"></span><b>${n}</b>${d}</button>`,
      )
      .join('')}</div>
    ${none || !pixel || (b.pat === 'gradient' && b.smooth) ? '' : `<h4>Tamaño del pixel</h4><div class="row"><input type="range" data-bgpx min="2" max="32" value="${b.px || 8}"><span id="bgpxv">${b.px || 8}</span></div>`}
    ${b.pat === 'image' ? `<h4>Imagen de fondo</h4><button class="btn sm on" data-bgpick="1">Subir imagen</button><input type="file" id="bgfile" accept="image/*" hidden>${S.uploads.length ? `<div class="ups" style="margin-top:8px">${S.uploads.map((u, i) => `<img data-bgimg="${i}" src="${esc(u)}" alt="Imagen ${i + 1}" tabindex="0">`).join('')}</div>` : '<p class="hint">Sube una imagen o usa una de la pestaña Imágenes.</p>'}` : ''}
    ${
      none
        ? '<p class="hint">El cuadriculado solo se ve en el editor. Descarga en PNG para conservar la transparencia.</p>'
        : `<h4>${b.pat === 'solid' ? 'Color' : 'Color principal'}</h4><div class="row"><input type="color" data-bg="c1" value="${b.c1}"><button class="btn sm" data-dropper="bg:c1">◉ Cuentagotas</button></div>${swHTML('bg:c1')}
    ${b.pat === 'solid' ? '' : `<h4>Segundo color</h4><div class="row"><input type="color" data-bg="c2" value="${b.c2}"></div>${swHTML('bg:c2')}`}
    <h4>Combos</h4><div class="grid g2">${(pixel ? BG_COMBOS_PIXEL : BG_COMBOS_NORMAL)
      .map(
        ([a, c]) =>
          `<button class="card" data-combo="${a},${c}" style="background:linear-gradient(90deg,${a} 50%,${c} 50%);height:34px;min-height:0"></button>`,
      )
      .join('')}</div>`
    }
    <h4>Todas las páginas</h4><div class="row"><button class="btn sm" data-bgall="1">Usar este fondo en todas</button></div>`;
  },
  draw() {
    const d = S.draw;
    return `<h3>Dibujar</h3><div class="seg"><button class="btn sm${d.mode === 'brush' ? ' on' : ''}" data-drmode="brush">✎ Pincel</button><button class="btn sm${d.mode === 'erase' ? ' on' : ''}" data-drmode="erase">⌫ Borrador</button><button class="btn sm" data-drmode="off"${d.mode ? '' : ' disabled'}>■ Terminar</button></div>
    <h4>Tamaño del pixel</h4><div class="row"><select data-dr="cs">${[4, 6, 8, 12, 16, 24, 32, 48].map(v => `<option value="${v}"${d.cs === v ? ' selected' : ''}>${v} px</option>`).join('')}</select></div>
    <h4>Simetría</h4><div class="row"><select data-dr="mirror" aria-label="Simetría del pincel">${[
      ['off', 'Ninguna'],
      ['h', 'Espejo horizontal'],
      ['v', 'Espejo vertical'],
      ['both', 'Cuatro cuadrantes'],
    ]
      .map(([v, l]) => `<option value="${v}"${d.mirror === v ? ' selected' : ''}>${l}</option>`)
      .join('')}</select></div>
    <h4>Color</h4><div class="row"><input type="color" data-dr="color" value="${d.color}"></div>${swHTML('draw')}
    <p class="hint">${d.mode ? 'Arrastra sobre el lienzo. Esc para terminar.' : 'Elige Pincel o Borrador y arrastra sobre el lienzo.'} Cada trazo se guarda como un objeto que puedes mover y escalar. El borrador funciona sobre dibujos sin girar.</p>`;
  },
  brand() {
    const B = S.brand;
    return `<h3>Marca</h3><h4>Aplicar color a</h4><div class="seg">${[
      ['fill', 'Relleno'],
      ['stroke', 'Borde'],
      ['bg', 'Fondo'],
    ]
      .map(
        ([k, l]) =>
          `<button class="btn sm${S.brandTarget === k ? ' on' : ''}" data-btarget="${k}">${l}</button>`,
      )
      .join('')}</div>
    <h4>Colores de marca</h4><div class="sws">${B.colors.map((c, i) => `<i class="bsw${S.brandDel ? ' del' : ''}" tabindex="0" role="button" aria-label="${c}" style="background:${c}" data-bcol="${i}"></i>`).join('')}</div>
    <div class="row"><input type="color" id="bnew" value="#ff3d8e" aria-label="Elegir color"><input type="text" id="bhex" placeholder="#RRGGBB" maxlength="7" style="width:86px" aria-label="Código del color"><button class="btn sm" data-bact="addcol">Agregar</button></div>
    <div class="row"><button class="btn sm on" data-bact="drop">◉ Cuentagotas</button><button class="btn sm" data-bact="photo">Colores del diseño</button></div>
    <div class="row"><button class="btn sm${S.brandDel ? ' on' : ''}" data-bact="del">${S.brandDel ? 'Listo' : 'Quitar colores'}</button></div>
    <h4>Fuentes de marca</h4>${B.fonts.map((f, i) => `<button class="txtbtn" data-bfont="${i}" style="font:400 20px '${f}',monospace">${f}${S.brandDel ? '  ×' : ''}</button>`).join('')}
    <div class="row"><select id="bfsel">${FONTS.map(f => `<option>${f}</option>`).join('')}</select><button class="btn sm" data-bact="addfont">Agregar</button></div>
    <p class="hint">Tus colores y fuentes se guardan en este navegador. Clic en un color lo aplica a lo seleccionado; clic en una fuente cambia el texto seleccionado o agrega uno nuevo.</p>`;
  },
  size() {
    return `<h3>Tamaño</h3><div class="sumline">Ahora: <b>${S.w} × ${S.h} px</b></div>
    <h4>Elegir un destino</h4><div class="row"><select id="szsel"><option value="">Elige un destino…</option>${CATS.filter(
      c => DEST[c.id],
    )
      .map(
        c =>
          `<optgroup label="${c.name}">${DEST[c.id].map(d => `<option value="${d[1]}x${d[2]}">${d[0]} · ${d[1]}×${d[2]}</option>`).join('')}</optgroup>`,
      )
      .join('')}</select></div>
    <h4>O escribe tus medidas</h4>
    <div class="row wrap"><label class="num"><span>Ancho</span><input type="number" id="szw" value="${S.w}" min="1" step="any"></label><label class="num"><span>Alto</span><input type="number" id="szh" value="${S.h}" min="1" step="any"></label></div>
    <div class="row"><label>Unidad</label><select id="szu" style="width:120px"><option value="px">píxeles</option><option value="cm">cm</option><option value="mm">mm</option><option value="in">pulgadas</option></select></div>
    <div class="row" id="szdr" hidden><label>Calidad</label><select id="szd" style="width:150px"><option value="72">72 ppp · pantalla</option><option value="150">150 ppp</option><option value="300" selected>300 ppp · imprenta</option></select></div>
    <p class="hint" id="szres">= ${S.w} × ${S.h} px</p>
    <div class="row"><input type="checkbox" id="szscale" checked><label for="szscale" style="min-width:0">Ajustar el contenido al nuevo tamaño</label></div>
    <button class="btn" id="szapply" style="width:100%">Aplicar tamaño</button><p class="hint">Máximo 5000 px por lado.</p>`;
  },
  export() {
    const c = S.conv,
      all = c.pages === 'all';
    return `<h3>Exportar</h3><h4>Descargar diseño</h4>
    <div class="seg">${['jpg', 'png', 'webp', 'pdf'].map(f => `<button class="btn sm${c.fmt === f ? ' on' : ''}" data-cvset="fmt:${f}">${f.toUpperCase()}</button>`).join('')}</div>
    <div class="seg" style="margin-top:6px">${[
      ['cur', 'Página actual'],
      ['all', 'Todas'],
    ]
      .map(
        ([k, l]) =>
          `<button class="btn sm${c.pages === k ? ' on' : ''}" data-cvset="pages:${k}">${l}</button>`,
      )
      .join('')}</div>
    <div class="row"><label>Escala</label><select data-cv="scale" style="width:90px">${[
      [0.5, '0.5×'],
      [1, '1×'],
      [2, '2×'],
    ]
      .map(([v, l]) => `<option value="${v}"${c.scale === v ? ' selected' : ''}>${l}</option>`)
      .join('')}</select></div>
    <div class="row"><label>Calidad</label><input type="range" data-cv="q" min="50" max="100" value="${c.q}"><span id="qv">${c.q}</span></div>
    <button class="btn" id="cvgo" style="width:100%">Descargar ${c.fmt.toUpperCase()}${all && c.fmt !== 'pdf' ? ' (ZIP)' : ''}</button>
    <div class="sumline">Salida: <b>${Math.round(S.w * c.scale)} × ${Math.round(S.h * c.scale)} px</b></div>
    <p class="hint">${c.fmt === 'pdf' ? 'El PDF lleva cada página elegida como imagen.' : all ? 'Con varias páginas recibes un ZIP con un archivo por página.' : 'Se guarda una imagen de la página actual.'}</p>${S.pages.some(p => p.bg.pat === 'none') ? `<p class="hint" style="color:var(--gold)">${c.fmt === 'png' ? 'Tu fondo es transparente: el PNG lo conserva.' : 'Tu fondo es transparente. JPG y PDF lo rellenan de blanco; usa PNG para conservarlo.'}</p>` : ''}
    <div class="row"><button class="btn sm" id="cvprev">Vista previa / JSON</button></div>
    <h4>Exportar en varios tamaños</h4><p class="hint">Adapta la página actual a varios formatos y descarga un ZIP.</p>
    ${MS.map((m, i) => `<div class="row"><input type="checkbox" id="ms${i}" data-ms="${i}"${S.msSel[i] ? ' checked' : ''}><label for="ms${i}" style="min-width:0">${m[0].replace(/_/g, ' ')} · ${m[1]}×${m[2]}</label></div>`).join('')}
    <button class="btn sm" id="msgo" style="width:100%">Descargar ZIP de tamaños</button>
    <h4>Convertir archivos</h4>
    <div class="row"><input type="checkbox" id="fitpdf"${c.fitpdf ? ' checked' : ''}><label for="fitpdf" style="min-width:0">Ajustar lienzo al PDF</label></div>
    <button class="btn sm" data-cvpick="cvpdf" style="width:100%;margin-bottom:6px">PDF → páginas editables</button>
    <button class="btn sm" data-cvpick="cvj" style="width:100%;margin-bottom:6px">Imagen → JPG</button>
    <button class="btn sm" data-cvpick="cvp" style="width:100%;margin-bottom:6px">Imagen → PNG</button>
    <button class="btn sm" data-cvpick="cvf" style="width:100%;margin-bottom:6px">Imágenes → PDF</button>
    <input type="file" id="cvpdf" accept="application/pdf,.pdf" hidden><input type="file" id="cvj" accept="image/*" multiple hidden><input type="file" id="cvp" accept="image/*" multiple hidden><input type="file" id="cvf" accept="image/*" multiple hidden>
    <p class="hint">Todo se procesa en tu navegador. Cada descarga te pide confirmación.</p>`;
  },
  gif() {
    return `<h3>Crear GIF</h3>
    <ol class="how"><li>Sube videos e imágenes</li><li>Ordénalos y recorta cada video</li><li>Elige tamaño, cuadros y colores</li><li>Crea y descarga el GIF</li></ol>
    <button class="btn on" data-studio="gif" style="width:100%">Abrir creador de GIF</button>
    <p class="hint">Tus archivos no se suben a ningún sitio: todo se procesa en tu navegador.</p>`;
  },
  poster(t = 'poster') {
    const poster = t === 'poster';
    return `<h3>${poster ? 'Póster en hojas' : 'Separar piezas'}</h3>
    <ol class="how">${
      poster
        ? '<li>Sube tu imagen</li><li>Escribe el tamaño final en cm</li><li>Elige el tamaño de hoja</li><li>Descarga el PDF o ábrelo como proyecto</li>'
        : '<li>Sube tu logo o diseño</li><li>Elige separar por color, por forma o ambos</li><li>Revisa las piezas encontradas</li><li>Ábrelas como proyectos o descárgalas</li>'
    }</ol>
    <button class="btn on" data-studio="${t}" style="width:100%">${poster ? 'Abrir póster en hojas' : 'Abrir separador de piezas'}</button>
    <p class="hint">Tu imagen original nunca se modifica.</p>`;
  },
  split(t) {
    return this.poster(t);
  },
  pages() {
    return `<h3>Páginas</h3><div class="row"><button class="btn sm" data-pg="add">+ Nueva</button><button class="btn sm" data-pg="dup">Duplicar</button><button class="btn sm warn" data-pg="del">Borrar</button><button class="btn sm" data-pg="l">◀ Mover</button><button class="btn sm" data-pg="r">Mover ▶</button></div><div id="pgl" style="margin-top:10px"></div>`;
  },
};
const PANEL_PAINT = {
  bg(P) {
    const b = pg().bg,
      nb = b.pat === 'none';
    $$('[data-pp]', P).forEach(sp => {
      const c = bgPreview(sp.dataset.pp, nb ? '#0b2a8a' : b.c1, nb ? '#3fe0ff' : b.c2);
      c.style.cssText =
        'width:56px;height:38px;image-rendering:pixelated;display:block;border:2px solid #fff';
      sp.replaceWith(c);
    });
  },
  templates() {
    const cards = [];
    TPL.forEach((tp, i) => {
      if (tplStyle(tp) !== S.style) return;
      const b = document.createElement('button');
      b.className = 'card tpl';
      b.dataset.tpl = i;
      const pageT = tp.build(),
        c = renderPageCanvas(pageT, 0.1);
      c.className = S.style === 'pixel' ? 'px' : '';
      b.append(c, tp.name);
      $('#tpls').append(b);
      cards.push([c, pageT]);
    });
    const fonts = [
      ...new Set(cards.flatMap(([, pageT]) => pageT.els.filter(e => e.type === 'text').map(e => e.font))),
    ];
    if (fonts.some(f => !fontSheets.has(f)))
      loadFamilies(fonts)
        .then(() =>
          cards.forEach(([c, pageT]) => {
            const n = renderPageCanvas(pageT, 0.1);
            n.className = c.className;
            c.replaceWith(n);
          }),
        )
        .catch(() => {});
  },
  thumbs(P) {
    $$('[data-gthumb]', P).forEach(sp => {
      const g = GRIDS[+sp.dataset.gthumb][1],
        c = cv(48, 36),
        x = c.getContext('2d');
      x.fillStyle = '#3fe0ff';
      g.forEach(([u, v, w, h]) =>
        x.fillRect(
          Math.round(u * 46 + 1),
          Math.round(v * 34 + 1),
          Math.max(2, Math.round(w * 46) - 2),
          Math.max(2, Math.round(h * 34) - 2),
        ),
      );
      sp.replaceWith(c);
    });
    $$('[data-ic2]', P).forEach(sp => sp.replaceWith(MoonIcons.el(sp.dataset.ic2)));
    $$('[data-thumb]', P).forEach(s => {
      const k = s.dataset.thumb,
        e = k.startsWith('s:')
          ? mk('sprite', {spr: k.slice(2), fill: '#3fe0ff'})
          : mk(k, {
              w: 64,
              h: k === 'line' || k === 'arrowl' ? 28 : 64,
              px: S.style === 'pixel' ? 4 : 1,
              fill: S.style === 'pixel' ? '#3fe0ff' : STYLE_BASE.normal.fill,
              sw: k === 'line' || k === 'arrowl' ? 8 : 0,
            });
      const c = bitmap(e);
      c.style.cssText = `width:48px;height:auto;image-rendering:${S.style === 'pixel' ? 'pixelated' : 'auto'}`;
      s.replaceWith(c);
    });
  },
};
function renderPanel() {
  const P = $('#panel'),
    t = S.tab;
  if (t === 'text' || t === 'brand') loadAllFonts();
  let h = PANELS[t] ? PANELS[t](t) : '';
  if (LEAD[t]) h = h.replace(/(<h3>.*?<\/h3>)/, `$1<p class="lead">${LEAD[t]}</p>`);
  P.innerHTML = h;
  if (t === 'bg') PANEL_PAINT.bg(P);
  if (t === 'templates') PANEL_PAINT.templates();
  PANEL_PAINT.thumbs(P);
  if (t === 'pages') renderPageList();
}
function renderPageList() {
  const L = $('#pgl');
  if (!L) return;
  L.innerHTML = '';
  S.pages.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'pg' + (i === S.cur ? ' on' : '');
    d.dataset.go = i;
    d.tabIndex = 0;
    const c = renderPageCanvas(p, 0.1);
    c.className = 'px';
    d.append(c, document.createTextNode('Página ' + (i + 1)));
    L.append(d);
  });
}
const TEXTS = {
  h: {text: 'Título', font: 'Press Start 2P', size: 56},
  s: {text: 'Subtítulo', font: 'Silkscreen', size: 36, w: 560},
  b: {text: 'Escribe aquí tu texto', font: 'DotGothic16', size: 28, w: 520, lh: 1.5},
  c1: {
    text: 'FULL MOON',
    font: 'Press Start 2P',
    size: 64,
    fill: '#3fe0ff',
    shadow: true,
    sc: '#1a5cff',
    sd: 6,
    w: 760,
  },
  c2: {
    text: 'ALL-OUT!',
    font: 'Pixelify Sans',
    size: 96,
    bold: true,
    fill: '#ffd84a',
    shadow: true,
    sc: '#ff3d6e',
    sd: 8,
    w: 640,
  },
  c3: {text: '00:00\nTHE DARK HOUR', font: 'VT323', size: 84, fill: '#d6f8ff', w: 640, lh: 1},
  c4: {
    text: 'MEMENTO MORI',
    font: 'Silkscreen',
    size: 44,
    fill: '#ffffff',
    shadow: true,
    sc: '#0b2a8a',
    sd: 5,
    w: 560,
  },
  nh: {text: 'Título', font: 'Montserrat', bold: true, size: 72, fill: '#111827', w: 760},
  ns: {text: 'Subtítulo', font: 'Poppins', size: 44, fill: '#374151', w: 620},
  nb: {text: 'Escribe aquí tu texto', font: 'Nunito', size: 30, fill: '#4b5563', w: 560, lh: 1.5},
  n1: {text: 'Elegancia', font: 'Playfair Display', bold: true, size: 96, fill: '#111827', w: 760},
  n2: {text: 'GRAN OFERTA', font: 'Bebas Neue', size: 120, fill: '#ef4444', ls: 4, w: 760},
  n3: {text: 'Con cariño', font: 'Dancing Script', bold: true, size: 110, fill: '#be185d', w: 700},
  n4: {text: 'MINIMAL STUDIO', font: 'Oswald', size: 56, fill: '#111827', ls: 10, w: 760},
};
$('#panel').addEventListener('click', ev => {
  const q = s => ev.target.closest(s);
  let b;
  if ((b = q('[data-studio]')))
    openStudio(() => (b.dataset.studio === 'gif' ? MoonGif.open() : MoonStudio.open(b.dataset.studio)));
  else if ((b = q('[data-size]'))) {
    const [w, h] = b.dataset.size.split('x').map(Number);
    touch(true);
    S.w = w;
    S.h = h;
    S.fit = true;
    refresh({fit: true, props: true});
  } else if ((b = q('[data-tpl]'))) {
    touch(true);
    const t = TPL[b.dataset.tpl].build();
    S.pages[S.cur] = t;
    S.sel = [];
    refresh({props: true});
    loadFonts().then(() => {
      bmCache.clear();
      refresh({});
    });
  } else if ((b = q('[data-grid]'))) addGrid(+b.dataset.grid);
  else if ((b = q('[data-tool]'))) {
    const k = b.dataset.tool;
    if (k === 'qr') {
      loadQR();
      add(mk('qr'));
      toast('Escribe tu enlace en el panel derecho');
    } else add(mk('chart'));
  } else if ((b = q('[data-drmode]'))) {
    const m = b.dataset.drmode;
    setDrawMode(m === 'off' ? null : m);
  } else if ((b = q('[data-btarget]'))) {
    S.brandTarget = b.dataset.btarget;
    renderPanel();
  } else if ((b = q('[data-bcol]'))) {
    const i = +b.dataset.bcol;
    if (S.brandDel) {
      S.brand.colors.splice(i, 1);
      saveBrand();
      renderPanel();
    } else applyBrandColor(S.brand.colors[i]);
  } else if ((b = q('[data-bfont]'))) {
    const i = +b.dataset.bfont;
    if (S.brandDel) {
      S.brand.fonts.splice(i, 1);
      saveBrand();
      renderPanel();
    } else applyBrandFont(S.brand.fonts[i]);
  } else if ((b = q('[data-bact]'))) {
    const a = b.dataset.bact,
      B = S.brand;
    if (a === 'addcol') {
      let c = ($('#bhex').value || '').trim();
      if (c && c[0] !== '#') c = '#' + c;
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) c = $('#bnew').value;
      c = c.toLowerCase();
      if (c.length === 4) c = '#' + [...c.slice(1)].map(x => x + x).join('');
      if (B.colors.includes(c)) {
        toast('Ese color ya está en tu marca');
        return;
      }
      B.colors.push(c);
      saveBrand();
      renderPanel();
      toast('Color ' + c + ' agregado a tu marca');
    } else if (a === 'drop')
      pickColor(hex => {
        if (B.colors.includes(hex)) toast('Ese color ya está en tu marca');
        else {
          B.colors.push(hex);
          saveBrand();
          toast('Color ' + hex + ' agregado a tu marca');
        }
        renderPanel();
      });
    else if (a === 'addfont') {
      const f = $('#bfsel').value;
      if (!B.fonts.includes(f)) B.fonts.push(f);
      saveBrand();
      renderPanel();
    } else if (a === 'del') {
      S.brandDel = !S.brandDel;
      renderPanel();
    } else if (a === 'photo') {
      const e = prim(),
        src =
          e && e.type === 'image' && e.src
            ? extractPalette(e)
            : palFromCanvas(renderPageCanvas(pg(), Math.min(1, 96 / Math.max(S.w, S.h))));
      let n = 0;
      src.forEach(c => {
        if (!B.colors.includes(c)) {
          B.colors.push(c);
          n++;
        }
      });
      saveBrand();
      renderPanel();
      toast(
        n
          ? `${n} color(es) agregados de ${e && e.type === 'image' && e.src ? 'la imagen' : 'tu diseño'}`
          : 'No hay colores nuevos para agregar',
      );
    }
  } else if ((b = q('[data-dropper]'))) {
    const k = b.dataset.dropper;
    pickColor(hex => {
      touch(true);
      if (k.startsWith('bg:')) pg().bg[k.slice(3)] = hex;
      refresh({panel: true});
    });
  } else if (q('#msgo')) doMulti();
  else if ((b = q('[data-style]'))) setStyle(b.dataset.style);
  else if ((b = q('[data-shape]'))) add(mk(b.dataset.shape, STYLE_BASE[S.style]));
  else if ((b = q('[data-sprite]'))) add(mk('sprite', {spr: b.dataset.sprite}));
  else if ((b = q('[data-font]'))) {
    const f = b.dataset.font;
    loadFamily(f).finally(() => {
      add(
        mk('text', {
          text: f,
          font: f,
          size: 64,
          w: S.w * 0.8,
          ...(S.style === 'normal' && {fill: '#111827'}),
        }),
      );
    });
  } else if ((b = q('[data-text]'))) {
    const o = TEXTS[b.dataset.text];
    const e = mk('text', JSON.parse(JSON.stringify(o)));
    add(e);
    loadFonts().then(() => {
      bmCache.clear();
      refresh({});
    });
  } else if ((b = q('[data-up]'))) {
    const s = S.uploads[b.dataset.up],
      im = getImg(s),
      e0 = prim();
    if (e0 && e0.type === 'image' && !e0.src) {
      touch(true);
      e0.src = s;
      refresh({props: true});
    } else {
      const w = im.width || 600,
        h = im.height || 600;
      addImage(s, w, h);
    }
  } else if (q('[data-bgpick]')) $('#bgfile').click();
  else if ((b = q('[data-bgimg]'))) {
    touch(true);
    pg().bg.src = S.uploads[+b.dataset.bgimg];
    pg().bg.pat = 'image';
    refresh({panel: true});
  } else if ((b = q('[data-pat]'))) {
    touch(true);
    pg().bg.pat = b.dataset.pat;
    pg().bg.smooth = S.style === 'normal';
    if (b.dataset.pat === 'image' && !pg().bg.src && S.uploads[0]) pg().bg.src = S.uploads[0];
    if (b.dataset.pat === 'none') S.conv.fmt = 'png';
    refresh({panel: true});
  } else if (q('[data-bgall]')) {
    touch(true);
    const bg = JSON.stringify(pg().bg);
    S.pages.forEach(p => (p.bg = JSON.parse(bg)));
    refresh({panel: true});
    toast('Fondo aplicado a todas las páginas');
  } else if (q('#szapply')) {
    const [w, h] = szCalc();
    if (!(w >= 16 && h >= 16)) {
      toast('Las medidas son demasiado pequeñas');
      return;
    }
    resizeCanvas(clamp(w, 16, 5000), clamp(h, 16, 5000), $('#szscale').checked);
  } else if ((b = q('[data-combo]'))) {
    touch(true);
    [pg().bg.c1, pg().bg.c2] = b.dataset.combo.split(',');
    refresh({panel: true});
  } else if ((b = q('.sw'))) {
    const f = b.parentElement.dataset.for;
    if (f.startsWith('bg:')) {
      touch(true);
      pg().bg[f.slice(3)] = b.dataset.color;
      refresh({panel: true});
    } else if (f === 'draw') {
      S.draw.color = b.dataset.color;
      renderPanel();
    }
  } else if ((b = q('[data-pg]'))) {
    const a = b.dataset.pg;
    a === 'add'
      ? addPage()
      : a === 'dup'
        ? addPage(true)
        : a === 'del'
          ? delPage()
          : movePage(a === 'l' ? -1 : 1);
  } else if ((b = q('[data-go]'))) goPage(+b.dataset.go);
  else if ((b = q('[data-cvset]'))) {
    const [k, v] = b.dataset.cvset.split(':');
    S.conv[k] = v;
    renderPanel();
  } else if (q('#cvgo')) doExport();
  else if (q('#cvprev')) openExport();
  else if ((b = q('[data-cvpick]'))) $('#' + b.dataset.cvpick).click();
  else if (q('#pick')) $('#file').click();
});
$('#panel').addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.bg) {
    touch();
    pg().bg[t.dataset.bg] = t.value;
    renderStage();
  } else if (t.dataset.bgpx !== undefined) {
    touch();
    pg().bg.px = +t.value;
    $('#bgpxv').textContent = t.value;
    renderStage();
  } else if (t.dataset.cv) {
    S.conv[t.dataset.cv] = +t.value;
    if (t.dataset.cv === 'q') $('#qv').textContent = t.value;
    else renderPanel();
  } else if (t.id === 'fitpdf') S.conv.fitpdf = t.checked;
  else if (t.dataset.dr) {
    const k = t.dataset.dr;
    S.draw[k] = k === 'cs' ? +t.value : t.value;
  } else if (t.id === 'elsearch') {
    const q = t.value.trim().toLowerCase();
    $$('#panel [data-shape],#panel [data-sprite],#panel [data-grid],#panel [data-tool]').forEach(c => {
      c.hidden = !!q && !(c.title || '').toLowerCase().includes(q);
    });
  }
});
$('#panel').addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.ms !== undefined) S.msSel[+t.dataset.ms] = t.checked;
});
$('#panel').addEventListener('change', ev => {
  const t = ev.target,
    id = t.id;
  if (id === 'file') {
    [...t.files].forEach(loadFile);
    t.value = '';
  } else if (id === 'bgfile' && t.files[0]) {
    readImage(t.files[0], 2000)
      .then(o => {
        touch(true);
        if (!S.uploads.includes(o.src)) S.uploads.unshift(o.src);
        pg().bg.src = o.src;
        pg().bg.pat = 'image';
        refresh({panel: true});
      })
      .catch(() => toast('Solo se aceptan imágenes'));
    t.value = '';
  } else if (id === 'cvpdf') {
    importPDF(t.files[0]);
    t.value = '';
  } else if (id === 'cvj' || id === 'cvp' || id === 'cvf') {
    convertImages(t.files, {cvj: 'jpg', cvp: 'png', cvf: 'pdf'}[id]);
    t.value = '';
  }
});
$('#panel').addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.matches('.sw,[data-up],.pg')) ev.target.click();
});
$('#panel').addEventListener('dragover', ev => {
  ev.preventDefault();
  $('#drop')?.classList.add('over');
});
$('#panel').addEventListener('dragleave', () => $('#drop')?.classList.remove('over'));
$('#panel').addEventListener('drop', ev => {
  ev.preventDefault();
  $('#drop')?.classList.remove('over');
  [...ev.dataTransfer.files].forEach(loadFile);
});
$('#rail').addEventListener('click', ev => {
  const b = ev.target.closest('[data-tab]');
  if (!b) return;
  if (b.dataset.tab === 'home') {
    openHome();
    return;
  }
  if (S.draw.mode && b.dataset.tab !== 'draw') {
    S.draw.mode = null;
    pageEl.classList.remove('drawing');
  }
  S.tab = b.dataset.tab;
  renderRail();
  renderPanel();
  playEnter($('#rail .tab.on'), 400);
  playEnter($('#panel'), 600);
});
$('#props').addEventListener(
  'toggle',
  ev => {
    if (ev.target.matches('details.sec')) playEnter(ev.target, 300);
  },
  true,
);
function playEnter(el, ms) {
  if (!el) return;
  el.classList.remove('enter');
  void el.offsetWidth;
  el.classList.add('enter');
  clearTimeout(el._enter);
  el._enter = setTimeout(() => el.classList.remove('enter'), ms);
}
function szCalc() {
  const u = $('#szu').value,
    d = +$('#szd').value,
    f = u === 'px' ? 1 : u === 'cm' ? d / 2.54 : u === 'mm' ? d / 25.4 : d;
  return [Math.round(+$('#szw').value * f), Math.round(+$('#szh').value * f)];
}
$('#panel').addEventListener('input', ev => {
  const id = ev.target.id;
  if (!/^sz/.test(id) || id === 'szscale' || id === 'szapply') return;
  if (id === 'szsel' && ev.target.value) {
    const [w, h] = ev.target.value.split('x');
    $('#szu').value = 'px';
    $('#szdr').hidden = true;
    $('#szw').value = w;
    $('#szh').value = h;
  }
  if (id === 'szu') $('#szdr').hidden = ev.target.value === 'px';
  const [w, h] = szCalc();
  $('#szres').textContent = `= ${w} × ${h} px` + (w > 5000 || h > 5000 ? ' (máximo 5000 por lado)' : '');
});
function resizeCanvas(nw, nh, scale) {
  touch(true);
  const ow = S.w,
    oh = S.h;
  if (scale) S.pages.forEach(p => scaleEls(p.els, ow, oh, nw, nh));
  S.w = nw;
  S.h = nh;
  S.fit = true;
  refresh({fit: true, props: true, panel: true});
  toast(`Lienzo de ${nw} × ${nh} px`);
}
