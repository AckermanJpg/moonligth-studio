const {test, expect} = require('@playwright/test');
const {FILE_URL, open, cspViolations} = require('./helpers');

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
