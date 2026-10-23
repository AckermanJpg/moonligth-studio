// Rulers and draggable guides
const RULER = 22;
const RULER_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const stageBox = $('#stagebox'),
  rulerX = $('#rulerx'),
  rulerY = $('#rulery'),
  guideLayer = $('#guides');
let liveGuide = null;

const userGuides = () => (pg().guidelines ||= []);

function rulerOrigin() {
  const b = stageBox.getBoundingClientRect(),
    r = pageEl.getBoundingClientRect();
  return {ox: r.left - b.left - RULER, oy: r.top - b.top - RULER};
}

function drawRuler(canvas, horizontal, origin, pageLen) {
  const dpr = window.devicePixelRatio || 1,
    len = Math.max(1, (horizontal ? stageBox.clientWidth : stageBox.clientHeight) - RULER),
    w = horizontal ? len : RULER,
    h = horizontal ? RULER : len,
    z = S.zoom,
    major = RULER_STEPS.find(s => s * z >= 70) || 10000,
    minor = major / (String(major)[0] === '2' ? 4 : 5),
    x = canvas.getContext('2d');
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  x.scale(dpr, dpr);
  x.fillStyle = '#030f3d';
  x.fillRect(0, 0, w, h);
  x.fillStyle = '#0c2f9e';
  if (horizontal) x.fillRect(origin, 0, pageLen * z, h);
  else x.fillRect(0, origin, w, pageLen * z);
  x.strokeStyle = '#8fb2ff';
  x.fillStyle = '#d6f8ff';
  x.font = '10px "Pixelify Sans", sans-serif';
  x.textBaseline = 'top';
  x.lineWidth = 1;
  x.beginPath();
  const first = Math.floor(-origin / z / minor) * minor,
    last = (len - origin) / z;
  for (let v = first; v <= last; v += minor) {
    const at = Math.round(origin + v * z) + 0.5,
      isMajor = Math.abs(v % major) < 1e-6,
      size = isMajor ? RULER : minor * z >= 6 ? 6 : 0;
    if (!size) continue;
    if (horizontal) {
      x.moveTo(at, RULER - size);
      x.lineTo(at, RULER);
    } else {
      x.moveTo(RULER - size, at);
      x.lineTo(RULER, at);
    }
    if (!isMajor) continue;
    if (horizontal) x.fillText(String(Math.round(v)), at + 3, 2);
    else {
      x.save();
      x.translate(2, at - 3);
      x.rotate(-Math.PI / 2);
      x.fillText(String(Math.round(v)), 0, 0);
      x.restore();
    }
  }
  x.stroke();
}

function renderRulers() {
  stageBox.classList.toggle('rulers', S.rulers);
  $('#trulers').classList.toggle('on', S.rulers);
  guideLayer.replaceChildren();
  if (!S.rulers || !pg()) return;
  const {ox, oy} = rulerOrigin();
  drawRuler(rulerX, true, ox, S.w);
  drawRuler(rulerY, false, oy, S.h);
  const lines = userGuides().map((g, i) => ({...g, i}));
  if (liveGuide) lines.push({...liveGuide, live: true});
  lines.forEach(g => {
    const d = document.createElement('div'),
      vertical = g.axis === 'x';
    d.className = `gl ${vertical ? 'v' : 'h'}${g.live ? ' live' : ''}`;
    d.dataset.pos = Math.round(g.pos);
    if (!g.live) {
      d.dataset.i = g.i;
      d.title = 'Arrastra para mover; llévala a la regla para quitarla';
    }
    d.style[vertical ? 'left' : 'top'] = (vertical ? ox : oy) + g.pos * S.zoom + 'px';
    guideLayer.append(d);
  });
}

function snapGuide(v, axis) {
  const size = axis === 'x' ? S.w : S.h,
    near = [0, size / 2, size].find(c => Math.abs(c - v) < 6 / S.zoom);
  return near ?? Math.round(v);
}

function dragGuide(ev, axis, index) {
  const list = userGuides(),
    existing = index !== undefined;
  let moved = false;
  const posOf = m => {
      const r = pageEl.getBoundingClientRect();
      return snapGuide(((axis === 'x' ? m.clientX - r.left : m.clientY - r.top) || 0) / S.zoom, axis);
    },
    inside = m => {
      const b = stageBox.getBoundingClientRect();
      return axis === 'x'
        ? m.clientX > b.left + RULER && m.clientX < b.right
        : m.clientY > b.top + RULER && m.clientY < b.bottom;
    };
  drag(
    ev,
    m => {
      if (existing) {
        if (!moved) touch(true);
        list[index].pos = posOf(m);
      } else liveGuide = {axis, pos: posOf(m)};
      moved = true;
      renderRulers();
    },
    m => {
      if (existing) {
        if (moved && !inside(m)) list.splice(index, 1);
      } else if (moved && inside(m)) {
        touch(true);
        list.push({axis, pos: liveGuide.pos});
      }
      liveGuide = null;
      renderRulers();
      scheduleSave();
    },
  );
}

rulerX.addEventListener('pointerdown', ev => dragGuide(ev, 'y'));
rulerY.addEventListener('pointerdown', ev => dragGuide(ev, 'x'));
guideLayer.addEventListener('pointerdown', ev => {
  const line = ev.target.closest('.gl');
  if (line && line.dataset.i !== undefined)
    dragGuide(ev, line.classList.contains('v') ? 'x' : 'y', +line.dataset.i);
});
stageEl.addEventListener('scroll', renderRulers);
if ('ResizeObserver' in window) new ResizeObserver(renderRulers).observe(stageBox);
else addEventListener('resize', renderRulers);

$('#trulers').onclick = () => {
  S.rulers = !S.rulers;
  store.set(RULERS_KEY, S.rulers ? '1' : '0');
  if (S.fit) {
    fitZoom();
    renderStage();
  } else renderRulers();
};
$('#tclear').onclick = () => {
  if (!userGuides().length) return toast('No hay guías en esta página');
  touch(true);
  pg().guidelines = [];
  renderRulers();
  scheduleSave();
  toast('Guías quitadas');
};
