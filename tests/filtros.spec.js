const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {open} = require('./helpers');

const ARCHIVO = path.join(__dirname, 'fixtures', 'filtros.json');

test('los filtros producen los mismos píxeles que la instantánea guardada', async ({page}) => {
  await open(page);
  const hashes = await page.evaluate(() => {
    const fnv = s => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(16);
    };
    const lienzo = (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d');
      const d = x.createImageData(w, h);
      let s = 12345;
      for (let i = 0; i < d.data.length; i += 4) {
        s = (Math.imul(s, 1103515245) + 12345) >>> 0;
        const gx = (i / 4) % w,
          gy = Math.floor(i / 4 / w);
        d.data[i] = (s >>> 16) & 255;
        d.data[i + 1] = ((gx * 255) / w) | 0;
        d.data[i + 2] = ((gy * 255) / h) | 0;
        d.data[i + 3] = gx > w - 6 ? 0 : 255;
      }
      x.putImageData(d, 0, 0);
      return c;
    };
    const aplicar = f => {
      const c = lienzo(64, 48);
      applyFilter(c, f);
      return fnv([...c.getContext('2d').getImageData(0, 0, 64, 48).data].join(','));
    };
    const R = {};
    for (const [n, f] of Object.entries(PRESETS)) R['preset:' + n] = aplicar(JSON.parse(JSON.stringify(f)));
    for (const [k, , mn, mx] of FSL)
      for (const v of [mn, mx, Math.round((mn + mx) / 3)]) R[`ajuste:${k}:${v}`] = aplicar({[k]: v});
    for (const k of Object.keys(PALS))
      for (const d of [0, 60]) R[`paleta:${k}:${d}`] = aplicar({pal: k, dith: d});
    R['duotono'] = aplicar({duo: ['#102030', '#f0e0a0']});
    R['duotono:tramado'] = aplicar({duo: ['#102030', '#f0e0a0'], dith: 80});
    R['clave'] = aplicar({key: '#ff00ff', tol: 60});
    R['clave:tolerancia por defecto'] = aplicar({key: '#808080'});
    R['combinado'] = aplicar({
      auto: 70,
      blur: 2,
      sharp: 50,
      emboss: 30,
      edge: 20,
      glitch: 3,
      b: 10,
      c: 20,
      s: 30,
      h: 40,
      temp: 15,
      sep: 30,
      gray: 20,
      inv: 10,
      sol: 20,
      fade: 20,
      noise: 15,
      vig: 40,
      scan: 30,
      post: 4,
      dith: 50,
    });
    R['combinado:umbral'] = aplicar({thr: 50, vig: 20});
    R['vacío'] = aplicar({});
    return R;
  });
  if (process.env.ACTUALIZAR_FILTROS) fs.writeFileSync(ARCHIVO, JSON.stringify(hashes, null, 2) + '\n');
  expect(hashes).toEqual(JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')));
});
