const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

for (const width of [360, 390, 430]) {
  test.describe(`móvil ${width}px`, () => {
    test.use({viewport: {width, height: 800}, hasTouch: true, isMobile: true});

    test('sin desborde horizontal en el inicio y en el editor', async ({page}) => {
      await open(page);
      const desborde = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(await desborde()).toBeLessThanOrEqual(0);
      await createProject(page);
      expect(await desborde()).toBeLessThanOrEqual(0);
    });

    test('Descargar, Deshacer y Rehacer están visibles', async ({page}) => {
      test.fail(true, 'Deshacer y Rehacer quedan fuera de la barra superior en móvil (punto 5)');
      await open(page);
      await createProject(page);
      for (const id of ['#export-btn', '#undo', '#redo']) {
        const box = await page.locator(id).boundingBox();
        expect(box, id).not.toBeNull();
        expect(box.x, id).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, id).toBeLessThanOrEqual(width);
      }
    });
  });
}
