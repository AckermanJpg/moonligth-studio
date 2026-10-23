// Properties
const nm = (k, l, v) =>
  `<label class="num"><span>${l}</span><input type="number" data-k="${k}" value="${Math.round(v)}"></label>`;
const BLENDS = [
  ['normal', 'Normal'],
  ['multiply', 'Multiplicar'],
  ['screen', 'Pantalla'],
  ['overlay', 'Superponer'],
  ['darken', 'Oscurecer'],
  ['lighten', 'Aclarar'],
  ['color-dodge', 'Sobreexponer'],
  ['difference', 'Diferencia'],
  ['soft-light', 'Luz suave'],
  ['hard-light', 'Luz fuerte'],
];
const MASKS = [
  ['', 'Ninguno'],
  ['ellipse', 'Círculo'],
  ['heart', 'Corazón'],
  ['star5', 'Estrella'],
  ['hex', 'Hexágono'],
  ['diamond', 'Rombo'],
  ['triangle', 'Triángulo'],
];
const secO = (k, d) => (S.sec[k] !== undefined ? S.sec[k] : d);
const sec = (k, title, body, d) =>
  `<details class="sec" data-sec="${k}"${secO(k, d) ? ' open' : ''}><summary>${title}</summary>${body}</details>`;
let propsKey = '';
function renderProps() {
  const P = $('#props'),
    list = selEls(),
    e = list[0],
    key = list.map(x => x.id).join(',');
  if (key !== propsKey) {
    propsKey = key;
    playEnter(P, 600);
  }
  let h;
  if (!e) {
    h = `<h3>Página</h3><div class="sumline">Tamaño: <b>${S.w} × ${S.h} px</b></div><div class="row"><button class="btn sm" data-gotab="size">Cambiar tamaño</button><button class="btn sm" data-gotab="bg">Cambiar fondo</button></div>
    ${sec('aid', 'Ayudas', `<div class="row"><button class="btn sm${S.grid ? ' on' : ''}" data-pr="grid">Cuadrícula</button><button class="btn sm${S.snap ? ' on' : ''}" data-pr="snap">Imán</button></div>`, true)}
    ${sec('lay', 'Capas', layersHTML(), true)}<p class="hint">Selecciona un objeto para editar su color, tamaño, sombra y más. Doble clic en un texto para escribir.</p>`;
    P.innerHTML = h;
    return;
  }
  const t = e.type,
    multi = list.length > 1,
    lab =
      {
        text: 'Texto',
        image: e.src ? 'Imagen' : 'Celda de foto',
        sprite: 'Ícono pixel',
        line: 'Línea',
        arrowl: 'Flecha',
        qr: 'Código QR',
        chart: 'Gráfico',
        draw: 'Dibujo',
      }[t] || 'Forma';
  h = `<h3>${multi ? list.length + ' objetos' : lab}</h3>
  <div class="row"><button class="btn sm" data-a="dup">Duplicar</button><button class="btn sm warn" data-a="del">Borrar</button><button class="btn sm${e.locked ? ' on' : ''}" data-a="lock">${e.locked ? 'Bloqueado' : 'Bloquear'}</button></div>`;
  const pos = `<div class="mini">Orden</div><div class="row"><button class="btn sm" data-a="front">Al frente</button><button class="btn sm" data-a="up">Subir</button><button class="btn sm" data-a="down">Bajar</button><button class="btn sm" data-a="back">Al fondo</button></div>
  <div class="mini">Alinear a la página</div><div class="row">${[
    ['l', '◧'],
    ['c', '▥'],
    ['r', '◨'],
    ['t', '⬒'],
    ['m', '▤'],
    ['b', '⬓'],
  ]
    .map(([k, s]) => `<button class="btn sm" data-al="${k}" aria-label="Alinear ${k}">${s}</button>`)
    .join('')}</div>
  <div class="mini">Girar y agrupar</div><div class="row"><button class="btn sm" data-rot90="1">Girar 90°</button>${multi ? '<button class="btn sm" data-grp="on">Agrupar</button>' : ''}${list.some(x => x.gid) ? '<button class="btn sm" data-grp="off">Desagrupar</button>' : ''}</div>
  ${
    multi
      ? `<div class="mini">Alinear entre sí</div><div class="row">${[
          ['l', '◧'],
          ['c', '▥'],
          ['r', '◨'],
          ['t', '⬒'],
          ['m', '▤'],
          ['b', '⬓'],
        ]
          .map(
            ([k, s]) =>
              `<button class="btn sm" data-alsel="${k}" aria-label="Alinear entre sí ${k}">${s}</button>`,
          )
          .join(
            '',
          )}</div><div class="row"><button class="btn sm" data-dist="h">Distribuir ↔</button><button class="btn sm" data-dist="v">Distribuir ↕</button></div>`
      : `<div class="mini">Posición</div><div class="row wrap">${nm('x', 'X', e.x)}${nm('y', 'Y', e.y)}</div><div class="row wrap">${t === 'text' ? nm('w', 'Ancho', e.w) : nm('w', 'Ancho', e.w) + nm('h', 'Alto', e.h)}${nm('rot', 'Giro°', e.rot)}</div>${t === 'text' ? '' : `<div class="row"><input type="checkbox" id="rlock"${S.rlock ? ' checked' : ''}><label for="rlock" style="min-width:0">Mantener proporción</label></div>`}`
  }`;
  h += sec('pos', 'Posición y orden', pos, true);
  const px = `<div class="mini">Pixelado</div><div class="row"><input type="range" data-k="px" min="1" max="40" step="1" value="${e.px}"><span data-v="px">${e.px}</span></div>`;
  const sw = `<div class="mini">Color</div><div class="row"><input type="color" data-k="fill" value="${e.fill}"><button class="btn sm" data-dropper="fill">◉ Cuentagotas</button></div>${swHTML('fill')}`;
  if (t === 'text') {
    h += sec(
      'txt',
      'Texto',
      `<div class="mini">Contenido</div><textarea data-k="text" rows="3" spellcheck="false">${esc(e.text || '')}</textarea><div class="mini">Fuente</div><div class="row"><select data-k="font">${Object.entries(
        FONTG,
      )
        .map(
          ([g, l]) =>
            `<optgroup label="${g}">${l.map(f => `<option${f === e.font ? ' selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</optgroup>`,
        )
        .join('')}</select></div>
    <div class="row wrap">${nm('size', 'Tamaño', e.size)}<label class="num"><span>Interlín.</span><input type="number" step="0.1" data-k="lh" value="${e.lh}"></label><label class="num"><span>Espaciado</span><input type="number" data-k="ls" value="${e.ls}"></label></div>
    <div class="seg"><button class="btn sm${e.bold ? ' on' : ''}" data-tg="bold"><b>B</b></button><button class="btn sm${e.italic ? ' on' : ''}" data-tg="italic"><i>I</i></button><button class="btn sm${e.upper ? ' on' : ''}" data-tg="upper">Aa→AA</button>
    ${['left', 'center', 'right'].map(a => `<button class="btn sm${e.align === a ? ' on' : ''}" data-al2="${a}">${{left: 'Izq', center: 'Cen', right: 'Der'}[a]}</button>`).join('')}</div>${sw}`,
      true,
    );
    h += sec(
      'tfx',
      'Efectos de texto',
      `<div class="mini">Contorno</div><div class="row"><input type="color" data-k="tsc" value="${e.tsc || '#000000'}">${nm('tsw', 'Grosor', e.tsw || 0)}</div>
    <div class="mini">Resaltado de fondo</div><div class="row"><input type="checkbox" id="tbg" data-k="tbg"${e.tbg ? ' checked' : ''}><label for="tbg">Activar</label><input type="color" data-k="tbc" value="${e.tbc || '#ffd84a'}"></div>`,
      false,
    );
  } else if (t === 'image') {
    if (!e.src) {
      h += sec(
        'cell',
        'Foto',
        `<p class="hint">Esta celda está vacía. Elige una foto o haz clic en una imagen subida (pestaña Imágenes).</p><div class="row"><button class="btn sm on" data-pickimg="1">Elegir fotos…</button></div><p class="hint">Si eliges varias, se reparten en las celdas vacías.</p><input type="file" id="cellfile" accept="image/*" multiple hidden>`,
        true,
      );
    } else {
      h += sec(
        'crop',
        'Recorte y marco',
        `<div class="row"><button class="btn sm on" data-crop="open">✂ Recortar</button><button class="btn sm" data-crop="reset"${e.crop ? '' : ' disabled'}>Quitar recorte</button></div>
      <div class="mini">Marco con forma</div><div class="row"><select data-k="mask">${MASKS.map(([k, l]) => `<option value="${k}"${(e.mask || '') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="mini">Borde</div><div class="row"><input type="color" data-k="stroke" value="${e.stroke}">${nm('sw', 'Grosor', e.sw)}</div>
      <div class="mini">Voltear</div><div class="row"><button class="btn sm${e.fx ? ' on' : ''}" data-flip="fx">↔ Horizontal</button><button class="btn sm${e.fy ? ' on' : ''}" data-flip="fy">↕ Vertical</button></div>${px}`,
        true,
      );
      h += sec(
        'rmbg',
        'Quitar fondo',
        `<div class="row"><button class="btn sm" data-bgkey="auto">Quitar color de la esquina</button><button class="btn sm" data-bgkey="off"${e.flt && e.flt.key ? '' : ' disabled'}>Restaurar</button></div>
      ${e.flt && e.flt.key ? `<div class="row"><label style="min-width:96px">Color</label><input type="color" data-f="key" value="${e.flt.key}"></div><div class="row"><label style="min-width:96px">Tolerancia</label><input type="range" data-f="tol" min="0" max="100" value="${e.flt.tol || 25}"><span data-fv="tol">${e.flt.tol || 25}</span></div>` : '<p class="hint">Sirve para fotos con fondo de un solo color. Pon el fondo de la página en Transparente y descarga en PNG.</p>'}`,
        false,
      );
      h += sec(
        'flt',
        `Filtros (${Object.keys(PRESETS).length})`,
        `<div class="fgrid">${Object.keys(PRESETS)
          .map(
            n =>
              `<button class="fp${(e.fp || 'Original') === n ? ' on' : ''}" data-fp="${n}" title="${n}"><span data-fth="${n}"></span>${n}</button>`,
          )
          .join('')}</div>`,
        true,
      );
      const du = (e.flt && e.flt.duo) || ['#020821', '#3fe0ff'];
      h += sec(
        'adj',
        'Ajustes manuales',
        FSL.map(
          ([k, l, mn, mx]) =>
            `<div class="row"><label style="min-width:96px">${l}</label><input type="range" data-f="${k}" min="${mn}" max="${mx}" value="${(e.flt && e.flt[k]) || 0}"><span data-fv="${k}" style="min-width:30px;text-align:right">${(e.flt && e.flt[k]) || 0}</span></div>`,
        ).join(''),
        false,
      );
      h += sec(
        'col',
        'Paleta y duotono',
        `<div class="row"><label style="min-width:96px">Paleta</label><select data-f="pal"><option value="">Ninguna</option>${Object.keys(
          PALS,
        )
          .map(k => `<option value="${k}"${e.flt && e.flt.pal === k ? ' selected' : ''}>${PALN[k]}</option>`)
          .join('')}</select></div>
      <div class="mini">Duotono (dos colores)</div><div class="row"><input type="color" data-f="duo0" value="${du[0]}"><input type="color" data-f="duo1" value="${du[1]}"><button class="btn sm" data-duooff="1"${e.flt && e.flt.duo ? '' : ' disabled'}>Quitar</button></div>
      <div class="row"><button class="btn sm warn" id="fltreset">Quitar todos los filtros</button></div>`,
        false,
      );
    }
  } else if (t === 'sprite' || t === 'draw') {
    h += sec('fill', 'Color', sw, true);
  } else if (t === 'qr') {
    h += sec(
      'qr',
      'Código QR',
      `<div class="mini">Enlace o texto</div><div class="row"><input type="text" data-k="text" value="${esc(e.text || '')}" maxlength="300"></div>
    <div class="mini">Color de los cuadros</div><div class="row"><input type="color" data-k="fill" value="${e.fill}"></div><div class="mini">Color de fondo</div><div class="row"><input type="color" data-k="bgc" value="${e.bgc || '#ffffff'}"><button class="btn sm${e.bgc ? '' : ' on'}" data-qrbg="${e.bgc ? 'off' : 'on'}">${e.bgc ? 'Hacer transparente' : 'Transparente'}</button></div>
    <p class="hint">Verifica el QR con tu teléfono antes de imprimir. Los colores deben contrastar bien.</p>`,
      true,
    );
  } else if (t === 'chart') {
    h += sec(
      'ch',
      'Gráfico',
      `<div class="mini">Tipo</div><div class="row"><select data-k="ctype">${[
        ['bar', 'Barras'],
        ['line', 'Líneas'],
        ['pie', 'Pastel'],
      ]
        .map(([k, l]) => `<option value="${k}"${e.ctype === k ? ' selected' : ''}>${l}</option>`)
        .join('')}</select></div>
    <div class="mini">Datos (una línea por dato: nombre, valor)</div><textarea data-k="cdata" rows="7" spellcheck="false">${esc(e.cdata || '')}</textarea>
    <div class="mini">Color del texto</div><div class="row"><input type="color" data-k="fill" value="${e.fill}"></div>${px}`,
      true,
    );
  } else {
    const ring = t.startsWith('ring'),
      ln = t === 'line' || t === 'arrowl';
    h += sec(
      'fill',
      'Relleno y borde',
      `${sw}
    ${ln ? '' : `<div class="mini">Degradado</div><div class="row"><input type="checkbox" id="grd" data-k="grad"${e.grad ? ' checked' : ''}><label for="grd">Activar</label><input type="color" data-k="fill2" value="${e.fill2 || '#ffffff'}"><select data-k="gang" style="width:96px"><option value="v"${e.gang === 'v' || !e.gang ? ' selected' : ''}>Vertical</option><option value="h"${e.gang === 'h' ? ' selected' : ''}>Horizontal</option><option value="d"${e.gang === 'd' ? ' selected' : ''}>Diagonal</option></select></div>`}
    ${ring ? `<div class="mini">Grosor del marco</div><div class="row">${nm('th', 'Grosor', e.th || 20)}</div>` : ''}
    <div class="mini">${ln ? 'Grosor' : 'Borde'}</div><div class="row">${ln ? '' : `<input type="color" data-k="stroke" value="${e.stroke}">`}${nm('sw', 'Grosor', e.sw)}</div>${px}`,
      true,
    );
  }
  h += sec(
    'look',
    'Apariencia y efectos',
    `<div class="mini">Opacidad</div><div class="row"><input type="range" data-k="op" min="0" max="1" step="0.05" value="${e.op}"></div>
    <div class="mini">Modo de mezcla</div><div class="row"><select data-k="blend">${BLENDS.map(([k, l]) => `<option value="${k}"${(e.blend || 'normal') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="mini">Sombra pixel</div><div class="row"><input type="checkbox" id="shd" data-k="shadow"${e.shadow ? ' checked' : ''}><label for="shd">Activar</label><input type="color" data-k="sc" value="${e.sc}">${nm('sd', 'Dist.', e.sd)}</div>
    <div class="mini">Estilo</div><div class="row"><button class="btn sm" data-sty="copy">Copiar estilo</button><button class="btn sm" data-sty="paste"${S.styleClip ? '' : ' disabled'}>Pegar estilo</button></div>
    ${t === 'text' ? '' : `<div class="mini">Contorno de sticker</div><div class="row"><input type="color" data-k="olc" value="${e.olc || '#ffffff'}">${nm('ol', 'Grosor', e.ol || 0)}</div>`}`,
    true,
  );
  h += sec('lay', 'Capas', layersHTML(), false);
  P.innerHTML = h;
  if (t === 'image' && e.src)
    $$('[data-fth]', P).forEach(sp => {
      const pr = PRESETS[sp.dataset.fth],
        c = bitmap({
          ...e,
          w: 72,
          h: 72,
          px: 2,
          sw: 0,
          rot: 0,
          fx: 0,
          fy: 0,
          mask: '',
          ol: 0,
          crop: e.crop,
          flt: pr,
        });
      c.style.cssText = 'width:100%;height:auto;display:block;image-rendering:pixelated';
      sp.replaceWith(c);
    });
}
function layersHTML() {
  return (
    [...els()]
      .reverse()
      .map(e => {
        const n =
          e.type === 'text'
            ? e.text.replace(/\n/g, ' ').slice(0, 18)
            : Object.fromEntries(SHAPES.map(x => [x[0], x[1]]))[e.type] ||
              {
                image: e.src ? 'Imagen' : 'Celda vacía',
                sprite: 'Ícono ' + e.spr,
                line: 'Línea',
                arrowl: 'Flecha',
                qr: 'Código QR',
                chart: 'Gráfico',
                draw: 'Dibujo',
              }[e.type] ||
              e.type;
        return `<div class="layer${S.sel.includes(e.id) ? ' on' : ''}${e.hidden ? ' hid' : ''}" data-layer="${e.id}"><span>${esc(n) || 'Texto'}</span><button data-lh="${e.id}" title="Mostrar/ocultar">${e.hidden ? 'OFF' : 'ON'}</button><button data-ll="${e.id}" title="Bloquear">${e.locked ? 'LOCK' : '—'}</button></div>`;
      })
      .join('') || '<p class="hint">Sin objetos todavía.</p>'
  );
}
function syncProps() {
  const e = prim();
  if (!e) return;
  $$('#props [data-k]').forEach(i => {
    if (i === document.activeElement) return;
    const k = i.dataset.k;
    if (k in e) {
      if (i.type === 'checkbox') i.checked = !!e[k];
      else i.value = i.type === 'number' && k !== 'lh' ? Math.round(e[k]) : e[k];
    }
  });
}
function setFlt(fn) {
  const L = selEls().filter(e => e.type === 'image');
  if (!L.length) return;
  touch();
  L.forEach(e => {
    e.flt = e.flt || {};
    fn(e);
    e.fp = 'custom';
    if (!Object.keys(e.flt).length) e.fp = 'Original';
  });
  refresh({});
}
$('#props').addEventListener(
  'toggle',
  ev => {
    const d = ev.target;
    if (d && d.dataset && d.dataset.sec) S.sec[d.dataset.sec] = d.open;
  },
  true,
);
$('#props').addEventListener('change', ev => {
  if (ev.target.id === 'cellfile' && ev.target.files.length) {
    fillCells(ev.target.files);
    ev.target.value = '';
  }
});
$('#props').addEventListener('input', ev => {
  const t = ev.target,
    k = t.dataset.k;
  if (t.dataset.f) {
    const f = t.dataset.f;
    if (f === 'duo0' || f === 'duo1')
      setFlt(e => {
        const d = (e.flt.duo || ['#020821', '#3fe0ff']).slice();
        d[f === 'duo0' ? 0 : 1] = t.value;
        e.flt.duo = d;
        delete e.flt.pal;
      });
    else if (f === 'pal' || f === 'key')
      setFlt(e => {
        t.value ? (e.flt[f] = t.value) : delete e.flt[f];
      });
    else {
      const v = parseFloat(t.value);
      setFlt(e => {
        v ? (e.flt[f] = v) : delete e.flt[f];
      });
      const sp = $(`#props [data-fv="${f}"]`);
      if (sp) sp.textContent = v;
      $$('#props .fp.on').forEach(b => b.classList.remove('on'));
    }
    return;
  }
  if (t.id === 'rlock') {
    S.rlock = t.checked;
    return;
  }
  if (!k) return;
  let v =
    t.type === 'checkbox'
      ? t.checked
      : t.type === 'number' || t.type === 'range'
        ? parseFloat(t.value)
        : t.value;
  if (typeof v === 'number' && isNaN(v)) return;
  if (k === 'w' || k === 'h') v = Math.max(8, v);
  if (S.rlock && (k === 'w' || k === 'h') && S.sel.length === 1) {
    const e = prim();
    if (e && e.type !== 'text') {
      const r = e.w / e.h;
      set(k === 'w' ? 'h' : 'w', Math.max(8, Math.round(k === 'w' ? v / r : v * r)));
    }
  }
  set(k, v);
  const sp = $(`#props [data-v="${k}"]`);
  if (sp) sp.textContent = v;
  renderOverlay();
  if (k === 'font')
    Promise.all([document.fonts.load(`32px "${v}"`), document.fonts.load(`700 32px "${v}"`)])
      .then(() => {
        bmCache.clear();
        refresh({});
      })
      .catch(() => {});
});
$('#props').addEventListener('click', ev => {
  const q = s => ev.target.closest(s);
  let b;
  if ((b = q('[data-fp]'))) {
    const n = b.dataset.fp;
    touch(true);
    selEls()
      .filter(e => e.type === 'image')
      .forEach(e => {
        e.flt = JSON.parse(JSON.stringify(PRESETS[n]));
        e.fp = n;
      });
    refresh({props: true});
  } else if ((b = q('[data-crop]'))) {
    b.dataset.crop === 'open'
      ? openCrop()
      : (() => {
          const e = prim();
          touch(true);
          delete e.crop;
          refresh({props: true});
        })();
  } else if ((b = q('[data-bgkey]'))) {
    const e = prim();
    if (b.dataset.bgkey === 'off') {
      touch(true);
      delete e.flt.key;
      delete e.flt.tol;
      e.fp = Object.keys(e.flt).length ? 'custom' : 'Original';
      refresh({props: true});
    } else {
      const im = getImg(e.src);
      if (!im._ok) return;
      const c = cv(1, 1),
        x = c.getContext('2d');
      x.drawImage(im, 2, 2, 1, 1, 0, 0, 1, 1);
      const [r, g, bb] = x.getImageData(0, 0, 1, 1).data;
      touch(true);
      e.flt = e.flt || {};
      e.flt.key = '#' + [r, g, bb].map(v => v.toString(16).padStart(2, '0')).join('');
      e.flt.tol = 25;
      e.fp = 'custom';
      refresh({props: true});
    }
  } else if ((b = q('[data-dropper]'))) {
    const k = b.dataset.dropper;
    pickColor(hex => {
      touch(true);
      selEls().forEach(e => (e[k] = hex));
      refresh({props: true});
    });
  } else if (q('[data-rot90]')) {
    touch(true);
    const L = selEls(),
      x0 = Math.min(...L.map(e => e.x)),
      x1 = Math.max(...L.map(e => e.x + e.w)),
      y0 = Math.min(...L.map(e => e.y)),
      y1 = Math.max(...L.map(e => e.y + e.h)),
      cx0 = (x0 + x1) / 2,
      cy0 = (y0 + y1) / 2;
    L.forEach(e => {
      if (L.length > 1) {
        const cx = e.x + e.w / 2,
          cy = e.y + e.h / 2,
          nx = cx0 - (cy - cy0),
          ny = cy0 + (cx - cx0);
        e.x = Math.round(nx - e.w / 2);
        e.y = Math.round(ny - e.h / 2);
      }
      e.rot = ((e.rot || 0) + 90) % 360;
    });
    refresh({props: true});
  } else if ((b = q('[data-grp]'))) b.dataset.grp === 'on' ? groupSel() : ungroupSel();
  else if ((b = q('[data-sty]'))) b.dataset.sty === 'copy' ? copyStyle() : pasteStyle();
  else if ((b = q('[data-alsel]'))) alignSel(b.dataset.alsel);
  else if ((b = q('[data-dist]'))) distribute(b.dataset.dist);
  else if (q('[data-pickimg]')) $('#cellfile').click();
  else if (q('[data-duooff]')) {
    touch(true);
    selEls()
      .filter(e => e.type === 'image')
      .forEach(e => {
        if (e.flt) delete e.flt.duo;
      });
    refresh({props: true});
  } else if ((b = q('[data-qrbg]'))) {
    touch(true);
    const e = prim();
    e.bgc = b.dataset.qrbg === 'off' ? '' : '#ffffff';
    refresh({props: true});
  } else if ((b = q('[data-gotab]'))) {
    S.tab = b.dataset.gotab;
    renderRail();
    renderPanel();
  } else if ((b = q('[data-flip]'))) {
    touch(true);
    const k = b.dataset.flip;
    selEls()
      .filter(e => e.type === 'image')
      .forEach(e => (e[k] = !e[k]));
    refresh({props: true});
  } else if (q('#fltreset')) {
    touch(true);
    selEls()
      .filter(e => e.type === 'image')
      .forEach(e => {
        e.flt = {};
        e.fp = 'Original';
      });
    refresh({props: true});
  } else if ((b = q('[data-a]'))) {
    const a = b.dataset.a;
    a === 'dup'
      ? dup()
      : a === 'del'
        ? del()
        : a === 'lock'
          ? (touch(true), selEls().forEach(e => (e.locked = !e.locked)), refresh({props: true}))
          : order(a);
  } else if ((b = q('[data-al]'))) align(b.dataset.al);
  else if ((b = q('[data-tg]'))) {
    touch(true);
    const k = b.dataset.tg;
    const v = !prim()[k];
    selEls().forEach(e => (e[k] = v));
    refresh({props: true});
  } else if ((b = q('[data-al2]'))) {
    touch(true);
    selEls().forEach(e => (e.align = b.dataset.al2));
    refresh({props: true});
  } else if ((b = q('.sw'))) {
    touch(true);
    const f = b.parentElement.dataset.for;
    selEls().forEach(e => (e[f] = b.dataset.color));
    refresh({props: true});
  } else if ((b = q('[data-pr]'))) {
    S[b.dataset.pr] = !S[b.dataset.pr];
    refresh({props: true});
  } else if (q('#apply-size')) {
    const w = clamp(+$('#cw').value || 1080, 50, 4000),
      h = clamp(+$('#ch').value || 1080, 50, 4000);
    touch(true);
    S.w = w;
    S.h = h;
    refresh({fit: true, props: true});
  } else if ((b = q('[data-lh]'))) {
    const e = find(b.dataset.lh);
    touch(true);
    e.hidden = !e.hidden;
    if (e.hidden) S.sel = S.sel.filter(i => i !== e.id);
    refresh({props: true});
    ev.stopPropagation();
  } else if ((b = q('[data-ll]'))) {
    const e = find(b.dataset.ll);
    touch(true);
    e.locked = !e.locked;
    refresh({props: true});
  } else if ((b = q('[data-layer]'))) {
    const id = b.dataset.layer;
    S.sel = ev.shiftKey
      ? S.sel.includes(id)
        ? S.sel.filter(i => i !== id)
        : [...S.sel, id]
      : expandGroup([id]);
    refresh({props: true});
  }
});
