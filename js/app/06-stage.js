// Stage
(() => {
  Object.assign(window, {place, textStyle, renderStage, renderOverlay, fitZoom, setZoom, pfltHold});
  const pageEl = $('#page'),
    wrapEl = $('#wrap'),
    stageEl = $('#stage');
  Object.assign(window, {pageEl, wrapEl, stageEl});
  const pfltEl = cv(1, 1);
  pfltEl.className = 'pflt';
  pfltEl.hidden = true;
  let pfltKey = '',
    pfltT = 0,
    pfltHeld = false,
    capFor = '',
    cap = 1;
  const pfltOn = () => Object.keys(S.pflt).length > 0;
  const pfltScale = () => Math.min(1, S.zoom * devicePixelRatio, cap);
  const pfltSig = () =>
    JSON.stringify([S.w, S.h, S.pflt, pfltScale(), pg()], (k, v) =>
      typeof v === 'string' && v.length > 256 ? v.length + v.slice(-32) : v,
    );
  function pfltSync() {
    clearTimeout(pfltT);
    if (!pfltOn()) {
      pfltEl.hidden = true;
      pfltKey = '';
      return;
    }
    pfltEl.hidden = pfltHeld || !!editing || pfltSig() !== pfltKey;
    if (pfltEl.hidden) pfltT = setTimeout(pfltDraw, 150);
  }
  function pfltDraw() {
    clearTimeout(pfltT);
    if (pfltHeld || editing || !pfltOn()) return;
    const ks = Object.keys(S.pflt).sort().join();
    if (ks !== capFor) {
      capFor = ks;
      cap = 1;
    }
    const k = pfltSig();
    if (k !== pfltKey) {
      const sc = pfltScale(),
        t0 = performance.now(),
        c = renderPageCanvas(pg(), sc);
      pfltEl.width = c.width;
      pfltEl.height = c.height;
      pfltEl.getContext('2d').drawImage(c, 0, 0);
      const ms = performance.now() - t0;
      if (ms > 100) cap = sc * Math.sqrt(80 / ms);
      pfltKey = k;
    }
    pfltEl.hidden = false;
  }
  function pfltHold(on) {
    pfltHeld = on;
    if (!on) return pfltDraw();
    clearTimeout(pfltT);
    pfltEl.hidden = true;
  }
  function textStyle(t, e) {
    Object.assign(t.style, {
      fontFamily: `"${e.font}",monospace`,
      fontSize: e.size + 'px',
      lineHeight: e.lh,
      letterSpacing: e.ls + 'px',
      textAlign: e.align,
      fontWeight: e.bold ? 700 : 400,
      fontStyle: e.italic ? 'italic' : 'normal',
      color: e.grad ? 'transparent' : e.fill,
      textTransform: e.upper ? 'uppercase' : 'none',
      background: e.grad ? gradCss(e) : e.tbg ? e.tbc || '#000000' : 'transparent',
      webkitBackgroundClip: e.grad ? 'text' : 'border-box',
      webkitTextStroke: e.tsw ? `${e.tsw}px ${e.tsc || '#000000'}` : '0',
      paintOrder: 'stroke fill',
    });
  }
  function place(e, n) {
    Object.assign(n.style, {
      left: e.x + 'px',
      top: e.y + 'px',
      width: e.w + 'px',
      height: e.type === 'text' ? 'auto' : e.h + 'px',
      transform: `rotate(${e.rot}deg)`,
      opacity: e.op,
      filter: e.shadow ? `drop-shadow(${e.sd}px ${e.sd}px 0 ${e.sc})` : 'none',
      mixBlendMode: e.blend || 'normal',
    });
  }
  function renderStage() {
    const p = pg();
    wrapEl.style.width = S.w * S.zoom + 'px';
    wrapEl.style.height = S.h * S.zoom + 'px';
    pageEl.style.width = S.w + 'px';
    pageEl.style.height = S.h + 'px';
    pageEl.style.transform = `scale(${S.zoom})`;
    const reusable = new Map();
    pageEl.querySelectorAll('.el').forEach(n => n._key && reusable.set(n.dataset.id, n));
    pageEl.innerHTML = '';
    const bg = bgCanvas(p, S.w, S.h);
    bg.className = 'bg';
    pageEl.append(bg);
    const clipEl = document.createElement('div');
    clipEl.className = 'clip';
    pageEl.append(clipEl);
    const nodes = {};
    p.els.forEach(e => {
      if (e.hidden) return;
      let n;
      if (e.type === 'text') {
        n = document.createElement('div');
        const t = document.createElement('div');
        t.className = 'txt';
        t.textContent = e.text;
        textStyle(t, e);
        if (e.grad && e.tbg) n.style.background = e.tbc || '#000000';
        n.append(t);
      } else {
        const key = bitmapKey(e),
          old = reusable.get(e.id);
        if (old && old._key === key) n = old;
        else {
          n = document.createElement('div');
          n._key = key;
          const c = (e.type === 'media' && mediaNode(e)) || bitmap(e);
          c.style.cssText = `width:100%;height:100%;display:block;image-rendering:${smoothImage(e) ? 'auto' : 'pixelated'}`;
          n.append(c);
          if (e.missing && !e.src) {
            const m = document.createElement('span');
            m.className = 'miss';
            m.textContent = 'Falta esta imagen';
            m.style.fontSize = Math.max(14, Math.min(e.w, e.h) / 9) + 'px';
            n.append(m);
          }
        }
      }
      n.className = 'el' + (e.locked ? ' locked' : '');
      n.dataset.id = e.id;
      place(e, n);
      clipEl.append(n);
      nodes[e.id] = n;
    });
    p.els.forEach(e => {
      if (e.type === 'text' && nodes[e.id]) {
        e.h = nodes[e.id].offsetHeight || e.h;
      }
    });
    pageEl.append(pfltEl);
    if (S.grid) {
      const g = document.createElement('div');
      g.className = 'gridov';
      pageEl.append(g);
    }
    const ov = document.createElement('div');
    ov.className = 'ovl';
    ov.id = 'ovl';
    pageEl.append(ov);
    renderOverlay();
    mediaSync();
    pfltSync();
    pageEl.classList.toggle('transp', p.bg.pat === 'none');
    $('#sizechip').textContent = `${S.w} × ${S.h} px`;
    $('#zinfo').textContent = Math.round(S.zoom * 100) + '%';
    $('#pinfo').textContent = `${S.cur + 1} / ${S.pages.length}`;
    $('#tgrid').classList.toggle('on', S.grid);
    $('#tsnap').classList.toggle('on', S.snap);
    renderRulers();
  }
  function renderOverlay() {
    const ov = $('#ovl');
    if (!ov) return;
    ov.innerHTML = '';
    const z = S.zoom,
      bw = 2 / z,
      hs = 13 / z,
      list = selEls().filter(e => !e.hidden);
    ov.style.setProperty('--bw', bw + 'px');
    ov.style.setProperty('--hs', hs + 'px');
    list.forEach(e => {
      const o = document.createElement('div');
      o.className = 'ov' + (list.length > 1 ? ' multi' : '');
      Object.assign(o.style, {
        left: e.x + 'px',
        top: e.y + 'px',
        width: e.w + 'px',
        height: e.h + 'px',
        transform: `rotate(${e.rot}deg)`,
        borderWidth: bw + 'px',
      });
      if (list.length === 1 && !e.locked) {
        const hs8 =
          e.type === 'text'
            ? ['e', 'w', 'ne', 'nw', 'se', 'sw']
            : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        const pos = {
          n: [50, 0],
          s: [50, 100],
          e: [100, 50],
          w: [0, 50],
          ne: [100, 0],
          nw: [0, 0],
          se: [100, 100],
          sw: [0, 100],
        };
        hs8.forEach(h => {
          const d = document.createElement('i');
          d.dataset.h = h;
          d.style.left = pos[h][0] + '%';
          d.style.top = pos[h][1] + '%';
          d.style.cursor =
            h.length == 2
              ? h === 'ne' || h === 'sw'
                ? 'nesw-resize'
                : 'nwse-resize'
              : h === 'n' || h === 's'
                ? 'ns-resize'
                : 'ew-resize';
          o.append(d);
        });
        const r = document.createElement('i');
        r.dataset.h = 'rot';
        r.style.left = '50%';
        r.style.top = -28 / z + 'px';
        r.style.cursor = 'grab';
        o.append(r);
      }
      ov.append(o);
    });
    if (list.length === 1) {
      const e = list[0],
        d = document.createElement('div');
      d.className = 'dimlbl';
      d.textContent = `${Math.round(e.w)} × ${Math.round(e.h)}`;
      Object.assign(d.style, {
        left: e.x + e.w / 2 + 'px',
        top: e.y + e.h + (e.rot ? Math.max(e.w, e.h) / 2 - e.h / 2 : 0) + 28 / z + 'px',
        fontSize: 12 / z + 'px',
        padding: `${3 / z}px ${6 / z}px`,
      });
      ov.append(d);
    }
    S.guides.forEach(g => {
      const d = document.createElement('div');
      d.className = 'guide';
      if (g.v !== undefined)
        Object.assign(d.style, {left: g.v - 1 / z + 'px', top: 0, width: 2 / z + 'px', height: '100%'});
      else Object.assign(d.style, {top: g.h - 1 / z + 'px', left: 0, height: 2 / z + 'px', width: '100%'});
      ov.append(d);
    });
  }
  function fitZoom() {
    const cs = getComputedStyle(stageEl),
      aw = stageEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      ah = stageEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    S.zoom = clamp(Math.min(aw / S.w, ah / S.h), 0.05, 2);
  }
  function setZoom(z) {
    S.fit = false;
    S.zoom = clamp(z, 0.05, 3);
    renderStage();
  }
})();
