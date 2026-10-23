// Draw tool
function startDraw(ev) {
  const cs = S.draw.cs,
    r = pageEl.getBoundingClientRect(),
    erase = S.draw.mode === 'erase',
    maxX = Math.ceil(S.w / cs),
    maxY = Math.ceil(S.h / cs);
  const cellAt = m => [
    Math.floor((m.clientX - r.left) / S.zoom / cs),
    Math.floor((m.clientY - r.top) / S.zoom / cs),
  ];
  const ov = cv(maxX, maxY);
  ov.id = 'drawov';
  ov.style.cssText = `width:${S.w}px;height:${S.h}px`;
  pageEl.append(ov);
  const x = ov.getContext('2d');
  x.fillStyle = S.draw.color;
  const cells = new Map();
  let last = null,
    touched = false;
  const putCell = a => {
    if (a[0] < 0 || a[1] < 0 || a[0] >= maxX || a[1] >= maxY) return;
    if (erase) {
      const wx = (a[0] + 0.5) * cs,
        wy = (a[1] + 0.5) * cs;
      els().forEach(e => {
        if (e.type !== 'draw' || e.hidden || e.rot) return;
        const lx = Math.floor((wx - e.x) / (e.w / e.gw)),
          ly = Math.floor((wy - e.y) / (e.h / e.gh)),
          n = e.cells.length;
        e.cells = e.cells.filter(c => !(c[0] === lx && c[1] === ly));
        if (e.cells.length !== n) {
          if (!touched) {
            touch(true);
            touched = true;
          }
          e.rev = (e.rev || 0) + 1;
        }
      });
    } else {
      cells.set(a[0] + ',' + a[1], a);
      x.fillRect(a[0], a[1], 1, 1);
    }
  };
  const put = a => {
    const m = S.draw.mirror,
      flipX = m === 'h' || m === 'both',
      flipY = m === 'v' || m === 'both';
    putCell(a);
    if (flipX) putCell([maxX - 1 - a[0], a[1]]);
    if (flipY) putCell([a[0], maxY - 1 - a[1]]);
    if (flipX && flipY) putCell([maxX - 1 - a[0], maxY - 1 - a[1]]);
  };
  const line = (a, b) => {
    let [x0, y0] = a;
    const [x1, y1] = b,
      dx = Math.abs(x1 - x0),
      dy = -Math.abs(y1 - y0),
      sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let er = dx + dy;
    for (;;) {
      put([x0, y0]);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * er;
      if (e2 >= dy) {
        er += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        er += dx;
        y0 += sy;
      }
    }
  };
  last = cellAt(ev);
  put(last);
  if (erase) renderStage();
  drag(
    ev,
    m => {
      const c = cellAt(m);
      line(last, c);
      last = c;
      if (erase) renderStage();
    },
    () => {
      ov.remove();
      if (!erase && cells.size) {
        const arr = [...cells.values()],
          x0 = Math.min(...arr.map(a => a[0])),
          y0 = Math.min(...arr.map(a => a[1])),
          x1 = Math.max(...arr.map(a => a[0])),
          y1 = Math.max(...arr.map(a => a[1]));
        touch(true);
        pg().els.push(
          mk('draw', {
            fill: S.draw.color,
            gw: x1 - x0 + 1,
            gh: y1 - y0 + 1,
            cells: arr.map(a => [a[0] - x0, a[1] - y0]),
            x: x0 * cs,
            y: y0 * cs,
            w: (x1 - x0 + 1) * cs,
            h: (y1 - y0 + 1) * cs,
            px: 1,
          }),
        );
      }
      if (erase)
        els().forEach(e => {
          if (e.type === 'draw' && !e.cells.length) e.hidden = true;
        });
      refresh({});
    },
  );
}
function pickColor(cb) {
  if (S.draw.mode) setDrawMode(null);
  S.pickCb = cb;
  pageEl.classList.add('picking');
  toast('Haz clic en el lienzo para tomar un color. Esc cancela.');
}
function setDrawMode(m) {
  S.draw.mode = m;
  pageEl.classList.toggle('drawing', !!m);
  if (m) {
    S.sel = [];
    refresh({props: true});
  }
  renderPanel();
}
