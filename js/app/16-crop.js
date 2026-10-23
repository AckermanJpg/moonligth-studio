// Crop editor
const ASPECTS = [
  ['free', 'Libre'],
  ['orig', 'Original'],
  ['box', 'Marco actual'],
  ['1:1', '1:1'],
  ['4:3', '4:3'],
  ['3:4', '3:4'],
  ['16:9', '16:9'],
  ['9:16', '9:16'],
  ['3:2', '3:2'],
];
function openCrop() {
  const e = prim();
  if (!e || e.type !== 'image') return;
  const im = getImg(e.src);
  if (!im._ok) {
    toast('Espera a que cargue la imagen');
    return;
  }
  const M = $('#mbox');
  M.innerHTML = `<h3>Recortar imagen</h3><div class="seg" id="casp">${ASPECTS.map(([k, l]) => `<button class="btn sm${k === 'free' ? ' on' : ''}" data-asp="${k}">${l}</button>`).join('')}</div>
  <div style="margin:10px 0;text-align:center"><div class="cstage" id="cstage"><img id="cimg" src="${esc(e.src)}" alt="Imagen a recortar" draggable="false"><div id="cbox"><i data-ch="n"></i><i data-ch="s"></i><i data-ch="e"></i><i data-ch="w"></i><i data-ch="ne"></i><i data-ch="nw"></i><i data-ch="se"></i><i data-ch="sw"></i></div></div></div>
  <div class="row"><button class="btn sm on" id="capply">Aplicar recorte</button><button class="btn sm" id="creset">Imagen completa</button><button class="btn sm warn" id="ccancel">Cancelar</button></div>
  <p class="hint">Arrastra el recuadro para moverlo y los bordes para cambiar su tamaño.</p>`;
  $('#modal').classList.add('on');
  const img = $('#cimg'),
    box = $('#cbox');
  let R = null,
    lock = null;
  const dims = () => ({W: img.clientWidth, H: img.clientHeight});
  const draw = () => {
    Object.assign(box.style, {left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px'});
  };
  const init = () => {
    const {W, H} = dims(),
      c = e.crop || {x: 0, y: 0, w: 1, h: 1};
    R = {x: c.x * W, y: c.y * H, w: c.w * W, h: c.h * H};
    draw();
  };
  if (img.complete) init();
  else img.onload = init;
  const fitRatio = r => {
    const {W, H} = dims(),
      cx = R.x + R.w / 2,
      cy = R.y + R.h / 2;
    let w = R.w,
      h = w / r;
    if (h > H) {
      h = H;
      w = h * r;
    }
    if (w > W) {
      w = W;
      h = w / r;
    }
    R = {w, h, x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h)};
    draw();
  };
  $('#casp').onclick = ev => {
    const b = ev.target.closest('[data-asp]');
    if (!b) return;
    $$('#casp .btn').forEach(x => x.classList.toggle('on', x === b));
    const k = b.dataset.asp,
      {W, H} = dims();
    if (k === 'free') {
      lock = null;
      return;
    }
    lock = k === 'orig' ? W / H : k === 'box' ? e.w / e.h : (([a, c]) => a / c)(k.split(':').map(Number));
    fitRatio(lock);
  };
  box.addEventListener('pointerdown', ev => {
    const hd = ev.target.dataset.ch,
      {W, H} = dims(),
      R0 = {...R},
      p0 = {x: ev.clientX, y: ev.clientY};
    if (!hd) {
      drag(ev, m => {
        R.x = clamp(R0.x + m.clientX - p0.x, 0, W - R0.w);
        R.y = clamp(R0.y + m.clientY - p0.y, 0, H - R0.h);
        draw();
      });
      return;
    }
    const hx = hd.includes('e') ? 1 : hd.includes('w') ? -1 : 0,
      hy = hd.includes('s') ? 1 : hd.includes('n') ? -1 : 0;
    const ax = hx > 0 ? R0.x : hx < 0 ? R0.x + R0.w : R0.x + R0.w / 2,
      ay = hy > 0 ? R0.y : hy < 0 ? R0.y + R0.h : R0.y + R0.h / 2;
    drag(ev, m => {
      const dx = m.clientX - p0.x,
        dy = m.clientY - p0.y;
      let nw = R0.w + hx * dx,
        nh = R0.h + hy * dy;
      nw = Math.max(24, nw);
      nh = Math.max(24, nh);
      if (lock) {
        if (hx) nh = nw / lock;
        else nw = nh * lock;
      }
      const mw = hx > 0 ? W - ax : hx < 0 ? ax : 2 * Math.min(ax, W - ax),
        mh = hy > 0 ? H - ay : hy < 0 ? ay : 2 * Math.min(ay, H - ay);
      if (lock) {
        const k = Math.min(1, mw / nw, mh / nh);
        nw *= k;
        nh *= k;
      } else {
        nw = Math.min(nw, mw);
        nh = Math.min(nh, mh);
      }
      R = {
        w: nw,
        h: nh,
        x: hx > 0 ? ax : hx < 0 ? ax - nw : ax - nw / 2,
        y: hy > 0 ? ay : hy < 0 ? ay - nh : ay - nh / 2,
      };
      draw();
    });
  });
  $('#creset').onclick = () => {
    const {W, H} = dims();
    R = {x: 0, y: 0, w: W, h: H};
    draw();
  };
  $('#ccancel').onclick = () => $('#modal').classList.remove('on');
  $('#capply').onclick = () => {
    const {W, H} = dims();
    touch(true);
    const full = R.w >= W - 1 && R.h >= H - 1;
    if (full) delete e.crop;
    else
      e.crop = {
        x: +(R.x / W).toFixed(4),
        y: +(R.y / H).toFixed(4),
        w: +(R.w / W).toFixed(4),
        h: +(R.h / H).toFixed(4),
      };
    const c = e.crop || {x: 0, y: 0, w: 1, h: 1},
      ratio = (c.w * im.width) / (c.h * im.height),
      cx = e.x + e.w / 2,
      cy = e.y + e.h / 2;
    let nw = e.w,
      nh = nw / ratio;
    if (nh > S.h * 1.2) {
      nh = S.h * 1.2;
      nw = nh * ratio;
    }
    e.w = Math.round(nw);
    e.h = Math.round(nh);
    e.x = Math.round(cx - e.w / 2);
    e.y = Math.round(cy - e.h / 2);
    $('#modal').classList.remove('on');
    refresh({props: true});
    toast('Recorte aplicado');
  };
}
