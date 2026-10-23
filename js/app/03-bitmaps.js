// Bitmaps
const imgCache = {},
  bmCache = new Map();
function getImg(src) {
  let i = imgCache[src];
  if (!i) {
    i = new Image();
    i.onload = () => {
      i._ok = 1;
      bmCache.clear();
      refresh({});
    };
    i.src = src;
    imgCache[src] = i;
  }
  return i;
}
function crisp(x, w, h) {
  const d = x.getImageData(0, 0, w, h),
    a = d.data;
  for (let i = 3; i < a.length; i += 4) a[i] = a[i] >= 110 ? 255 : 0;
  x.putImageData(d, 0, 0);
}
function pathFor(t, w, h, th) {
  const p = new Path2D();
  th = th || 20;
  if (t === 'ringrect') {
    p.rect(0, 0, w, h);
    p.rect(th, th, Math.max(1, w - 2 * th), Math.max(1, h - 2 * th));
    return p;
  }
  if (t === 'ringell') {
    p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    p.ellipse(w / 2, h / 2, Math.max(1, w / 2 - th), Math.max(1, h / 2 - th), 0, 0, Math.PI * 2);
    return p;
  }
  if (t === 'heart') {
    p.moveTo(w / 2, h * 0.95);
    p.bezierCurveTo(-w * 0.1, h * 0.55, w * 0.05, -h * 0.05, w / 2, h * 0.3);
    p.bezierCurveTo(w * 0.95, -h * 0.05, w * 1.1, h * 0.55, w / 2, h * 0.95);
    p.closePath();
    return p;
  }
  const poly = pts => {
    pts.forEach(([a, b], i) => (i ? p.lineTo(a * w, b * h) : p.moveTo(a * w, b * h)));
    p.closePath();
  };
  if (t === 'rect') p.rect(0, 0, w, h);
  else if (t === 'rrect') p.roundRect(0, 0, w, h, Math.min(w, h) * 0.18);
  else if (t === 'pill') p.roundRect(0, 0, w, h, Math.min(w, h) / 2);
  else if (t === 'pentagon')
    poly(
      [0, 1, 2, 3, 4].map(i => [
        0.5 + 0.5 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 5),
        0.5 + 0.5 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 5),
      ]),
    );
  else if (t === 'octagon')
    poly([
      [0.3, 0],
      [0.7, 0],
      [1, 0.3],
      [1, 0.7],
      [0.7, 1],
      [0.3, 1],
      [0, 0.7],
      [0, 0.3],
    ]);
  else if (t === 'plus')
    poly([
      [0.33, 0],
      [0.67, 0],
      [0.67, 0.33],
      [1, 0.33],
      [1, 0.67],
      [0.67, 0.67],
      [0.67, 1],
      [0.33, 1],
      [0.33, 0.67],
      [0, 0.67],
      [0, 0.33],
      [0.33, 0.33],
    ]);
  else if (t === 'burst')
    poly(
      Array.from({length: 24}, (_, i) => [
        0.5 + (i % 2 ? 0.38 : 0.5) * Math.cos((i * Math.PI) / 12),
        0.5 + (i % 2 ? 0.38 : 0.5) * Math.sin((i * Math.PI) / 12),
      ]),
    );
  else if (t === 'bubble') {
    p.roundRect(0, 0, w, h * 0.8, Math.min(w, h) * 0.16);
    p.moveTo(w * 0.2, h * 0.78);
    p.lineTo(w * 0.15, h);
    p.lineTo(w * 0.4, h * 0.78);
    p.closePath();
  } else if (t === 'arrowr')
    poly([
      [0, 0.3],
      [0.55, 0.3],
      [0.55, 0],
      [1, 0.5],
      [0.55, 1],
      [0.55, 0.7],
      [0, 0.7],
    ]);
  else if (t === 'ellipse') p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (t === 'triangle') {
    p.moveTo(w / 2, 0);
    p.lineTo(w, h);
    p.lineTo(0, h);
    p.closePath();
  } else if (t === 'diamond') {
    p.moveTo(w / 2, 0);
    p.lineTo(w, h / 2);
    p.lineTo(w / 2, h);
    p.lineTo(0, h / 2);
    p.closePath();
  } else if (t === 'hex') {
    [
      [0.25, 0],
      [0.75, 0],
      [1, 0.5],
      [0.75, 1],
      [0.25, 1],
      [0, 0.5],
    ].forEach(([a, b], i) => (i ? p.lineTo(a * w, b * h) : p.moveTo(a * w, b * h)));
    p.closePath();
  } else if (t === 'star5') {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.4 : 1,
        a = -Math.PI / 2 + (i * Math.PI) / 5,
        px = w / 2 + (Math.cos(a) * r * w) / 2,
        py = h / 2 + (Math.sin(a) * r * h) / 2;
      i ? p.lineTo(px, py) : p.moveTo(px, py);
    }
    p.closePath();
  }
  return p;
}
