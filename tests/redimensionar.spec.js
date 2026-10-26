const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

async function preparar(page, tipo, extra = {}) {
  await open(page);
  await createProject(page);
  await page.evaluate(
    async ({tipo, extra}) => {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 600;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 800, 600);
      g.addColorStop(0, '#ff3d6e');
      g.addColorStop(1, '#1a5cff');
      x.fillStyle = g;
      x.fillRect(0, 0, 800, 600);
      const src = c.toDataURL('image/png');
      const im = getImg(src);
      await new Promise(r => (im._ok ? r() : im.addEventListener('load', r)));
      const e =
        tipo === 'text'
          ? mk('text', {text: 'Hola', x: 100, y: 100, w: 300, size: 40})
          : mk('image', {src, x: 100, y: 100, w: 400, h: 300, px: 1, ...extra});
      pg().els = [e];
      S.sel = [e.id];
      refresh({props: true});
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    },
    {tipo, extra},
  );
}

async function contarRenderStage(page) {
  await page.evaluate(() => {
    window.__rs = 0;
    const o = window.renderStage;
    window.renderStage = function () {
      window.__rs++;
      return o.apply(this, arguments);
    };
  });
}

async function arrastrarTirador(page, {soltar = true} = {}) {
  const h = await page.locator('#ovl [data-h="se"]').boundingBox();
  const sx = h.x + h.width / 2,
    sy = h.y + h.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(sx + i * 6, sy + i * 4);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  if (soltar) await page.mouse.up();
}

test('redimensionar no llama a renderStage durante el gesto y lo llama una vez al soltar', async ({page}) => {
  await preparar(page, 'image');
  await contarRenderStage(page);
  await arrastrarTirador(page, {soltar: false});
  expect(await page.evaluate(() => window.__rs)).toBe(0);
  const w = await page.evaluate(() => prim().w);
  expect(w).toBeGreaterThan(400);
  const ancho = await page.evaluate(() => document.querySelector(`.el[data-id="${prim().id}"]`).style.width);
  expect(ancho).toBe(w + 'px');
  await page.mouse.up();
  expect(await page.evaluate(() => window.__rs)).toBeLessThanOrEqual(1);
});

test('el bitmap final coincide con el dibujado directamente y la caché solo guarda el tamaño final', async ({
  page,
}) => {
  await preparar(page, 'image', {px: 4, flt: {blur: 2, s: 30}});
  const antes = await page.evaluate(() => bmCache.size);
  await arrastrarTirador(page);
  const r = await page.evaluate(() => {
    const e = prim(),
      c = document.querySelector(`.el[data-id="${e.id}"] canvas`),
      nuevas = bmCache.size;
    bmCache.clear();
    const d = bitmap(e),
      a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
      b = d.getContext('2d').getImageData(0, 0, d.width, d.height).data;
    return {
      nuevas,
      tam: [c.width, c.height, d.width, d.height],
      iguales: a.length === b.length && a.every((v, i) => v === b[i]),
    };
  });
  expect(r.nuevas - antes).toBe(1);
  expect(r.tam[0]).toBe(r.tam[2]);
  expect(r.tam[1]).toBe(r.tam[3]);
  expect(r.iguales).toBe(true);
});

test('deshacer devuelve el tamaño y la posición originales', async ({page}) => {
  await preparar(page, 'image');
  const geo = () => page.evaluate(() => (({x, y, w, h}) => ({x, y, w, h}))(prim()));
  const original = await geo();
  await arrastrarTirador(page);
  expect(await geo()).not.toEqual(original);
  await page.click('#undo');
  expect(await geo()).toEqual(original);
});

test('en un texto el gesto actualiza su tamaño de letra y su alto sin renderStage', async ({page}) => {
  await preparar(page, 'text');
  await contarRenderStage(page);
  await arrastrarTirador(page, {soltar: false});
  const r = await page.evaluate(() => {
    const e = prim(),
      n = document.querySelector(`.el[data-id="${e.id}"]`);
    return {
      rs: window.__rs,
      size: e.size,
      fs: n.querySelector('.txt').style.fontSize,
      h: e.h,
      oh: n.offsetHeight,
    };
  });
  expect(r.rs).toBe(0);
  expect(r.size).toBeGreaterThan(40);
  expect(r.fs).toBe(r.size + 'px');
  expect(r.h).toBe(r.oh);
  await page.mouse.up();
});

test('quieto más de 150 ms sin soltar, redibuja el bitmap al tamaño actual sin guardarlo en la caché', async ({
  page,
}) => {
  await preparar(page, 'image', {px: 4});
  await contarRenderStage(page);
  const antes = await page.evaluate(() => bmCache.size);
  await arrastrarTirador(page, {soltar: false});
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const e = prim(),
      c = document.querySelector(`.el[data-id="${e.id}"] canvas`),
      d = bitmap(e, false),
      a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
      b = d.getContext('2d').getImageData(0, 0, d.width, d.height).data;
    return {
      rs: window.__rs,
      nuevas: bmCache.size,
      tam: [c.width, c.height, Math.round(e.w / 4), Math.round(e.h / 4)],
      iguales: a.length === b.length && a.every((v, i) => v === b[i]),
      css: c.style.imageRendering,
    };
  });
  expect(r.rs).toBe(0);
  expect(r.nuevas).toBe(antes);
  expect(r.tam.slice(0, 2)).toEqual(r.tam.slice(2));
  expect(r.iguales).toBe(true);
  expect(r.css).toBe('pixelated');
  await page.mouse.up();
});
