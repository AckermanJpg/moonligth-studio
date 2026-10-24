const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

async function auditarRegiones(page) {
  return page.evaluate(() => {
    const encabezados = [...document.querySelectorAll('header')].filter(
      h => !h.closest('article, aside, main, nav, section'),
    );
    const banners = encabezados.filter(
      h => h.offsetParent !== null || getComputedStyle(h).position === 'fixed',
    );
    const complementos = [...document.querySelectorAll('aside')].filter(a => a.getClientRects().length);
    const nombres = [...complementos, ...document.querySelectorAll('nav')]
      .filter(e => e.getClientRects().length)
      .map(e => (e.getAttribute('aria-label') || '').trim());
    return {
      banners: banners.length,
      sinNombre: nombres.filter(n => !n).length,
      repetidos: nombres.length - new Set(nombres).size,
    };
  });
}

test('el inicio tiene un solo banner y regiones con nombre único', async ({page}) => {
  await open(page);
  expect(await auditarRegiones(page)).toEqual({banners: 1, sinNombre: 0, repetidos: 0});
});

test('el editor tiene un solo banner y regiones con nombre único', async ({page}) => {
  await open(page);
  await createProject(page);
  expect(await auditarRegiones(page)).toEqual({banners: 1, sinNombre: 0, repetidos: 0});
});

test('el logo aparece una sola vez en el inicio', async ({page}) => {
  await open(page);
  expect(await page.evaluate(() => document.querySelectorAll('[id="logo"]').length)).toBe(1);
  expect(await page.locator('#home #logo').count()).toBe(0);
  await expect(page.locator('#home .hhero .mark')).toBeVisible();
});

test('todos los botones de index.html declaran su type', async ({page}) => {
  const html = await (await page.request.get('/index.html')).text();
  const sinType = [...html.matchAll(/<button\b[^>]*>/g)].filter(m => !/\btype=/.test(m[0]));
  expect(sinType.map(m => m[0])).toEqual([]);
});

test.describe('tamaño mínimo de #sizechip (WCAG 2.2, criterio 2.5.8)', () => {
  for (const ancho of [1440, 800, 390]) {
    test(`mide al menos 24 × 24 px a ${ancho} px`, async ({page}) => {
      await page.setViewportSize({width: ancho, height: 800});
      await open(page);
      await createProject(page);
      if (ancho <= 720) await page.click('#more-btn');
      const caja = await page.locator('#sizechip').boundingBox();
      expect(caja.width).toBeGreaterThanOrEqual(24);
      expect(caja.height).toBeGreaterThanOrEqual(24);
    });
  }
});

test('el editor tiene un h1 visualmente oculto', async ({page}) => {
  await open(page);
  await createProject(page);
  const h1 = page.locator('main h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(/Moonlight Studio/);
  const caja = await h1.boundingBox();
  expect(caja.width).toBeLessThanOrEqual(1);
  expect(caja.height).toBeLessThanOrEqual(1);
  expect(await page.locator('h1').count()).toBe(1);
});

async function primerSalto(page) {
  return page.evaluate(() => {
    const visibles = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(
      h => h.getClientRects().length,
    );
    let previo = 0;
    for (const h of visibles) {
      const nivel = +h.tagName[1];
      if (previo && nivel > previo + 1)
        return `${h.tagName} "${h.textContent.trim().slice(0, 30)}" tras h${previo}`;
      previo = nivel;
    }
    return null;
  });
}

test('los encabezados no saltan de nivel en el inicio ni en el editor', async ({page}) => {
  await open(page);
  expect(await primerSalto(page)).toBeNull();
  await createProject(page);
  for (const pestana of [
    'templates',
    'elements',
    'text',
    'images',
    'bg',
    'draw',
    'brand',
    'size',
    'export',
    'pages',
  ]) {
    await page.click(`#rail [data-tab="${pestana}"]`);
    expect(await primerSalto(page), pestana).toBeNull();
  }
  await page.click('#rail [data-tab="elements"]');
  await page.locator('#panel [data-shape]').first().click();
  expect(await primerSalto(page)).toBeNull();
});
