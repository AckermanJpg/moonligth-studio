const {test, expect} = require('@playwright/test');
const {FILE_URL, open, createProject, cspViolations} = require('./helpers');

test('carga por http sin errores de JavaScript ni avisos de CSP', async ({page}) => {
  const problems = await open(page);
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});

test('carga abriendo index.html por file:// sin errores ni avisos de CSP', async ({page}) => {
  const problems = await open(page, FILE_URL);
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});

test('por file:// el asistente crea un lienzo sin errores en la consola', async ({page}) => {
  const problems = await open(page, FILE_URL);
  await createProject(page, {cat: 'social'});
  expect(await page.evaluate(() => [location.protocol, S.active, S.w, S.h])).toEqual([
    'file:',
    true,
    1080,
    1080,
  ]);
  await expect(page.locator('#page')).toBeVisible();
  const caja = await page.locator('#page').boundingBox();
  expect(caja.width).toBeGreaterThan(0);
  expect(caja.height).toBeGreaterThan(0);
  expect(problems).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});
