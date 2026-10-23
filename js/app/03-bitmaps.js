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
  if (t === 'rect') p.rect(0, 0, w, h);
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
