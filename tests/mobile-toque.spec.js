const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

for (const width of [375, 720])
  test.describe(`a ${width} px`, () => {
    test.use({viewport: {width, height: 800}, hasTouch: true, isMobile: true});

    test('Instagram, Novedades, Ayuda, Descargar y Compartir miden al menos 44 px de alto', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'canShare', {configurable: true, value: () => true});
        Object.defineProperty(navigator, 'share', {configurable: true, value: async () => {}});
      });
      await open(page);
      const alto = sel => page.locator(sel).evaluate(n => n.getBoundingClientRect().height);
      for (const sel of [
        '#home .hhead a[href*="instagram"]',
        '#home .hhead [data-act="news"]',
        '#home .hhead [data-act="help"]',
      ])
        expect(await alto(sel), sel).toBeGreaterThanOrEqual(44);
      await createProject(page);
      expect(await alto('#export-btn'), '#export-btn').toBeGreaterThanOrEqual(44);
      await page.click('#more-btn');
      for (const sel of ['#news-btn', '#help-btn']) expect(await alto(sel), sel).toBeGreaterThanOrEqual(44);
      await page.click('#more-btn');
      await page.click('#rail [data-tab="export"]');
      await page.click('[data-cvset="fmt:png"]');
      for (const sel of ['#cvgo', '#cvshare']) expect(await alto(sel), sel).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
