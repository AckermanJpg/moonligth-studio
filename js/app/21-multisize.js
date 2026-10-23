// Multi-size export
const MS = [
  ['IG_cuadrado', 1080, 1080],
  ['IG_historia', 1080, 1920],
  ['IG_vertical', 1080, 1350],
  ['X_publicacion', 1600, 900],
  ['YouTube_miniatura', 1280, 720],
  ['Facebook_publicacion', 1200, 630],
  ['Pinterest', 1000, 1500],
  ['LinkedIn', 1200, 627],
];
function scaleEls(list, ow, oh, nw, nh) {
  const k = Math.min(nw / ow, nh / oh),
    ox = (nw - ow * k) / 2,
    oy = (nh - oh * k) / 2;
  list.forEach(e => {
    e.x = Math.round(e.x * k + ox);
    e.y = Math.round(e.y * k + oy);
    e.w = Math.round(e.w * k);
    e.h = Math.round(e.h * k);
    e.sw = (e.sw || 0) * k;
    e.sd = Math.round(e.sd * k);
    e.th = Math.round((e.th || 20) * k);
    e.ol = (e.ol || 0) * k;
    e.tsw = (e.tsw || 0) * k;
    if (e.type === 'text') {
      e.size = Math.max(4, Math.round(e.size * k));
      e.ls *= k;
    } else if (e.type !== 'sprite' && e.type !== 'draw' && e.type !== 'qr')
      e.px = Math.max(1, Math.round(e.px * k));
  });
}
async function doMulti() {
  const sel = MS.filter((m, i) => S.msSel[i]);
  if (!sel.length) {
    toast('Elige al menos un tamaño');
    return;
  }
  toast('Generando tamaños…');
  await loadFonts();
  const c = S.conv,
    png = c.fmt === 'png' || c.fmt === 'webp',
    mime = c.fmt === 'png' ? 'image/png' : c.fmt === 'webp' ? 'image/webp' : 'image/jpeg',
    base = slug(S.name),
    files = [];
  for (const [n, w, h] of sel) {
    const cp = JSON.parse(JSON.stringify(pg()));
    scaleEls(cp.els, S.w, S.h, w, h);
    let cn = withSize(w, h, () => renderPageCanvas(cp, 1));
    if (!png) {
      const f = cv(w, h),
        fx = f.getContext('2d');
      fx.fillStyle = '#ffffff';
      fx.fillRect(0, 0, w, h);
      fx.drawImage(cn, 0, 0);
      cn = f;
    }
    const blob = await toBlob(cn, mime, c.q / 100);
    files.push({
      name: `${base}_${n}_${w}x${h}.${extOf(blob.type)}`,
      data: new Uint8Array(await blob.arrayBuffer()),
    });
  }
  saveFile(base + '_tamanos.zip', buildZip(files));
}
