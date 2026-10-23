// Interactions
function drag(ev, move, end) {
  ev.preventDefault();
  const up = e => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    end && end(e);
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
}
function snapCalc(box, ignore) {
  const xs = [0, S.w / 2, S.w],
    ys = [0, S.h / 2, S.h];
  if (S.rulers) userGuides().forEach(g => (g.axis === 'x' ? xs : ys).push(g.pos));
  els().forEach(o => {
    if (ignore.includes(o.id) || o.hidden) return;
    xs.push(o.x, o.x + o.w / 2, o.x + o.w);
    ys.push(o.y, o.y + o.h / 2, o.y + o.h);
  });
  const T = 8 / S.zoom;
  let ax = 0,
    ay = 0,
    gx = null,
    gy = null,
    bx = T,
    by = T;
  [box.x, box.x + box.w / 2, box.x + box.w].forEach(v =>
    xs.forEach(c => {
      const d = c - v;
      if (Math.abs(d) < bx) {
        bx = Math.abs(d);
        ax = d;
        gx = c;
      }
    }),
  );
  [box.y, box.y + box.h / 2, box.y + box.h].forEach(v =>
    ys.forEach(c => {
      const d = c - v;
      if (Math.abs(d) < by) {
        by = Math.abs(d);
        ay = d;
        gy = c;
      }
    }),
  );
  return {ax, ay, g: [...(gx !== null ? [{v: gx}] : []), ...(gy !== null ? [{h: gy}] : [])]};
}
function startMove(ev) {
  const list = selEls().filter(e => !e.locked);
  if (!list.length) return;
  const st = list.map(e => [e, e.x, e.y]),
    p0 = {x: ev.clientX, y: ev.clientY};
  let moved = false;
  drag(
    ev,
    m => {
      let dx = (m.clientX - p0.x) / S.zoom,
        dy = (m.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) * S.zoom < 3) return;
      if (!moved) {
        moved = true;
        touch(true);
      }
      S.guides = [];
      if (S.snap && !m.altKey) {
        const xs = st.map(([, x]) => x + dx),
          ys = st.map(([, , y]) => y + dy);
        const box = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...st.map(([e], i) => xs[i] + e.w)) - Math.min(...xs),
          h: Math.max(...st.map(([e], i) => ys[i] + e.h)) - Math.min(...ys),
        };
        const r = snapCalc(
          box,
          list.map(e => e.id),
        );
        dx += r.ax;
        dy += r.ay;
        S.guides = r.g;
      }
      st.forEach(([e, x, y]) => {
        e.x = Math.round(x + dx);
        e.y = Math.round(y + dy);
        const n = $(`.el[data-id="${e.id}"]`);
        if (n) place(e, n);
      });
      renderOverlay();
      syncProps();
    },
    () => {
      S.guides = [];
      renderOverlay();
      syncProps();
      scheduleSave();
    },
  );
}
function startResize(ev, hd) {
  const e = prim();
  if (!e) return;
  touch(true);
  if (hd === 'rot') {
    const r = pageEl.getBoundingClientRect(),
      cx = r.left + (e.x + e.w / 2) * S.zoom,
      cy = r.top + (e.y + e.h / 2) * S.zoom;
    drag(ev, m => {
      let a = (Math.atan2(m.clientY - cy, m.clientX - cx) * 180) / Math.PI + 90;
      if (m.shiftKey) a = Math.round(a / 15) * 15;
      e.rot = Math.round(((a % 360) + 360) % 360);
      const n = $(`.el[data-id="${e.id}"]`);
      if (n) place(e, n);
      renderOverlay();
      syncProps();
    });
    return;
  }
  const hx = hd.includes('e') ? 1 : hd.includes('w') ? -1 : 0,
    hy = hd.includes('s') ? 1 : hd.includes('n') ? -1 : 0;
  const s0 = {w: e.w, h: e.h, size: e.size},
    cx0 = e.x + e.w / 2,
    cy0 = e.y + e.h / 2,
    rr = (e.rot * Math.PI) / 180,
    cos = Math.cos(rr),
    sin = Math.sin(rr),
    p0 = {x: ev.clientX, y: ev.clientY};
  drag(
    ev,
    m => {
      const dx = (m.clientX - p0.x) / S.zoom,
        dy = (m.clientY - p0.y) / S.zoom,
        ldx = dx * cos + dy * sin,
        ldy = -dx * sin + dy * cos;
      let nw = s0.w + hx * ldx,
        nh = s0.h + hy * ldy;
      if (hx && hy && (e.type === 'image' || e.type === 'sprite' || e.type === 'text' || m.shiftKey)) {
        const k = Math.max(12 / s0.w, nw / s0.w);
        nw = s0.w * k;
        nh = s0.h * k;
      }
      nw = Math.max(12, nw);
      nh = Math.max(12, nh);
      if (e.type === 'text') {
        nh = s0.h;
        if (hx && hy) e.size = Math.max(6, Math.round((s0.size * nw) / s0.w));
      }
      const lsx = (hx * (nw - s0.w)) / 2,
        lsy = (hy * (nh - s0.h)) / 2,
        gx = lsx * cos - lsy * sin,
        gy = lsx * sin + lsy * cos;
      e.w = Math.round(nw);
      e.h = Math.round(nh);
      e.x = Math.round(cx0 + gx - e.w / 2);
      e.y = Math.round(cy0 + gy - e.h / 2);
      renderStage();
      syncProps();
    },
    scheduleSave,
  );
}
pageEl.addEventListener('pointerdown', ev => {
  if (S.pickCb) {
    ev.preventDefault();
    const r = pageEl.getBoundingClientRect(),
      sc = Math.min(1, 1200 / Math.max(S.w, S.h)),
      c = renderPageCanvas(pg(), sc);
    const x = clamp(Math.floor(((ev.clientX - r.left) / S.zoom) * sc), 0, c.width - 1),
      y = clamp(Math.floor(((ev.clientY - r.top) / S.zoom) * sc), 0, c.height - 1),
      d = c.getContext('2d').getImageData(x, y, 1, 1).data;
    const cb = S.pickCb;
    S.pickCb = null;
    pageEl.classList.remove('picking');
    if (d[3] < 8) {
      toast('Ahí no hay color: es transparente');
      return;
    }
    const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    cb(hex);
    return;
  }
  if (S.draw.mode) {
    startDraw(ev);
    return;
  }
  if (editing && ev.target.closest('.txt') === editing) return;
  if (editing) endEdit();
  const h = ev.target.closest('[data-h]');
  if (h) {
    startResize(ev, h.dataset.h);
    return;
  }
  const n = ev.target.closest('.el');
  if (!n) {
    if (S.sel.length) {
      S.sel = [];
      refresh({props: true});
    }
    return;
  }
  const e = findEl(n.dataset.id);
  if (!e) return;
  if (ev.shiftKey) {
    const g = expandGroup([e.id]);
    S.sel = S.sel.includes(e.id) ? S.sel.filter(i => !g.includes(i)) : [...new Set([...S.sel, ...g])];
    refresh({props: true});
    return;
  }
  if (!S.sel.includes(e.id)) {
    S.sel = expandGroup([e.id]);
    refresh({props: true});
  }
  startMove(ev);
});
stageEl.addEventListener('pointerdown', ev => {
  if (ev.target === stageEl || ev.target === wrapEl) {
    if (editing) endEdit();
    if (S.sel.length) {
      S.sel = [];
      refresh({props: true});
    }
  }
});
pageEl.addEventListener('dblclick', ev => {
  const n = ev.target.closest('.el');
  if (!n) return;
  const e = findEl(n.dataset.id);
  if (e && e.type === 'image' && !e.locked) {
    S.sel = [e.id];
    openCrop();
    return;
  }
  if (!e || e.type !== 'text' || e.locked) return;
  const t = $('.txt', n);
  editing = t;
  t.contentEditable = 'true';
  t.focus();
  const r = document.createRange();
  r.selectNodeContents(t);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
});
function endEdit() {
  if (!editing) return;
  const t = editing;
  editing = null;
  t.contentEditable = 'false';
  const n = t.closest('.el'),
    e = n && findEl(n.dataset.id);
  if (e) {
    const v = t.innerText.replace(/\n$/, '');
    if (v !== e.text) {
      touch(true);
      e.text = v || 'Texto';
    }
  }
  refresh({props: true});
}
stageEl.addEventListener(
  'wheel',
  ev => {
    if (ev.ctrlKey || ev.metaKey) {
      ev.preventDefault();
      setZoom(S.zoom * (ev.deltaY < 0 ? 1.1 : 0.9));
    }
  },
  {passive: false},
);
