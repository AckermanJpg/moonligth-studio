const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

async function auditarRegiones(page) {
  return page.evaluate(() => {
    const encabezados = [...document.querySelectorAll('header')].filter(h => !h.closest('article, aside, main, nav, section'));
    const banners = encabezados.filter(h => h.offsetParent !== null || getComputedStyle(h).position === 'fixed');
    const complementos = [...document.querySelectorAll('aside')].filter(a => a.getClientRects().length);
    const nombres = [...complementos, ...document.querySelectorAll('nav')]
      .filter(e => e.getClientRects().length)
      .map(e => (e.getAttribute('aria-label') || '').trim());
    return {banners: banners.length, sinNombre: nombres.filter(n => !n).length, repetidos: nombres.length - new Set(nombres).size};
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
