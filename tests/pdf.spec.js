const path = require('path');
const {test, expect} = require('@playwright/test');
const {open, createProject, cspViolations} = require('./helpers');

test('importar un PDF usa isEvalSupported: false y crea las páginas', async ({page}) => {
  await page.addInitScript(() => {
    window.__getDocument = [];
    let lib;
    Object.defineProperty(window, 'pdfjsLib', {
      configurable: true,
      get: () => lib,
      set: v => {
        lib = new Proxy(v, {
          get: (target, key) =>
            key === 'getDocument'
              ? (...args) => {
                  window.__getDocument.push(args[0] && args[0].isEvalSupported);
                  return target.getDocument(...args);
                }
              : target[key],
        });
      },
    });
  });
  const problems = await open(page);
  await createProject(page);
  const antes = await page.evaluate(() => S.pages.length);
  await page.click('#rail [data-tab="export"]');
  await page.setInputFiles('#cvpdf', path.join(__dirname, 'fixtures', 'muestra.pdf'));
  await expect(page.locator('#toast')).toContainText('PDF importado', {timeout: 30000});
  expect(await page.evaluate(() => S.pages.length)).toBe(antes + 2);
  expect(await page.evaluate(() => window.__getDocument)).toEqual([false]);
  expect(problems).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});
