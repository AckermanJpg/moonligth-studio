const {test, expect} = require('@playwright/test');
const {open} = require('./helpers');

test('las fuentes de la interfaz se sirven desde fonts/ y no bloquean con Google Fonts', async ({page}) => {
  const pedidas = [];
  page.on('request', r => pedidas.push(r.url()));
  await open(page);
  await page.waitForFunction(() => document.fonts.check('16px "Pixelify Sans"'));
  await page.waitForTimeout(500);

  const html = await (await page.request.get('/index.html')).text();
  expect(html).not.toMatch(/<link[^>]*rel="stylesheet"[^>]*fonts\.googleapis\.com/);

  const locales = pedidas.filter(u => /\/fonts\/.*\.woff2$/.test(u));
  expect(locales.some(u => u.includes('pixelify-sans-latin-wght-normal'))).toBe(true);
  expect(locales.some(u => u.includes('jersey-25-latin-400-normal'))).toBe(true);

  const precargas = await page.$$eval('head link[rel="preload"][as="font"]', ls =>
    ls.map(l => ({type: l.type, cross: l.hasAttribute('crossorigin')})),
  );
  expect(precargas.length).toBeGreaterThan(0);
  expect(precargas.length).toBeLessThanOrEqual(2);
  for (const p of precargas) expect(p).toEqual({type: 'font/woff2', cross: true});

  const swap = await page.evaluate(() =>
    ['Pixelify Sans', 'Jersey 25', 'DotGothic16'].map(f =>
      [...document.fonts].filter(x => x.family.replace(/"/g, '') === f).every(x => x.display === 'swap'),
    ),
  );
  expect(swap).toEqual([true, true, true]);

  const csp = await page.$eval('meta[http-equiv="Content-Security-Policy"]', m => m.content);
  expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
});

test('los archivos de fuente incluyen su licencia SIL OFL', async ({request}) => {
  for (const f of ['pixelify-sans', 'jersey-25', 'dotgothic16']) {
    const r = await request.get(`/fonts/OFL-${f}.txt`);
    expect(r.ok(), f).toBe(true);
    expect(await r.text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
  }
});
