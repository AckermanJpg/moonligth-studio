// Brand kit
(() => {
  Object.assign(window, {
    loadBrand,
    saveBrand,
    applyBrandColor,
    applyBrandFont,
    palFromCanvas,
    extractPalette,
  });
  const BKEY = 'moonlight-brand-v1';
  const parseJSON = text => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };
  Object.assign(window, {parseJSON});
  function loadBrand() {
    const o = parseJSON(store.get(BKEY));
    if (o && o.colors && o.fonts) S.brand = o;
  }
  function saveBrand() {
    store.set(BKEY, JSON.stringify(S.brand));
  }
  function applyBrandColor(c) {
    const t = S.brandTarget;
    if (t === 'bg' || !S.sel.length) {
      touch(true);
      pg().bg.c1 = c;
      if (pg().bg.pat === 'none') pg().bg.pat = 'solid';
      refresh({panel: true});
      toast('Color aplicado al fondo');
      return;
    }
    touch(true);
    selEls().forEach(e => {
      if (t === 'stroke') e.stroke = c;
      else e.fill = c;
    });
    refresh({props: true});
  }
  function applyBrandFont(f) {
    const L = selEls().filter(e => e.type === 'text');
    loadFamily(f).finally(() => {
      if (L.length) {
        touch(true);
        L.forEach(e => (e.font = f));
        bmCache.clear();
        refresh({props: true});
      } else add(mk('text', {text: f, font: f, size: 64, w: S.w * 0.8}));
    });
  }
  function palFromCanvas(c) {
    const x = c.getContext('2d'),
      d = x.getImageData(0, 0, c.width, c.height).data,
      cnt = {};
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const k = (d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5);
      cnt[k] = (cnt[k] || 0) + 1;
    }
    const out = [];
    Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k]) => {
        const [r, g, b] = k.split(',').map(v => (+v << 5) + 16);
        if (out.length < 6 && out.every(o => Math.hypot(o[0] - r, o[1] - g, o[2] - b) > 70))
          out.push([r, g, b]);
      });
    return out.map(
      ([r, g, b]) => '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join(''),
    );
  }
  function extractPalette(e) {
    const im = getImg(e.src);
    if (!im._ok) return [];
    const c = cv(32, 32),
      x = c.getContext('2d');
    x.drawImage(im, 0, 0, 32, 32);
    const d = x.getImageData(0, 0, 32, 32).data,
      cnt = {};
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const k = (d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5);
      cnt[k] = (cnt[k] || 0) + 1;
    }
    const out = [];
    Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k]) => {
        const [r, g, b] = k.split(',').map(v => (+v << 5) + 16);
        if (out.length < 6 && out.every(o => Math.hypot(o[0] - r, o[1] - g, o[2] - b) > 70))
          out.push([r, g, b]);
      });
    return out.map(
      ([r, g, b]) => '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join(''),
    );
  }
})();
