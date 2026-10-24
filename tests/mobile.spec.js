const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const dentro = (box, width) => box && box.x >= 0 && box.x + box.width <= width + 0.5;

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

    test('Descargar, Deshacer y Rehacer están visibles y Deshacer y Rehacer miden 32 px', async ({page}) => {
      await open(page);
      await createProject(page);
      for (const id of ['#export-btn', '#undo', '#redo']) {
        expect(dentro(await page.locator(id).boundingBox(), width), id).toBeTruthy();
      }
      for (const id of ['#undo', '#redo']) {
        const box = await page.locator(id).boundingBox();
        expect(box.width, id).toBeGreaterThanOrEqual(32);
        expect(box.height, id).toBeGreaterThanOrEqual(32);
      }
    });

    test('el menú Más guarda lo demás de la barra superior', async ({page}) => {
      await open(page);
      await createProject(page);
      const resto = ['#home-btn', '#name', '#sizechip', '#help-btn', '#present-btn', '#save-btn'];
      await expect(page.locator('#more-btn')).toBeVisible();
      await expect(page.locator('#more-btn')).toHaveAttribute('aria-expanded', 'false');
      for (const id of resto) await expect(page.locator(id), id).toBeHidden();
      await page.click('#more-btn');
      await expect(page.locator('#more-btn')).toHaveAttribute('aria-expanded', 'true');
      for (const id of resto) {
        await expect(page.locator(id), id).toBeVisible();
        expect(dentro(await page.locator(id).boundingBox(), width), id).toBeTruthy();
      }
      await page.keyboard.press('Escape');
      for (const id of resto) await expect(page.locator(id), id).toBeHidden();
      await expect(page.locator('#more-btn')).toBeFocused();
    });

    test('la barra inferior entra completa sin cortarse', async ({page}) => {
      await open(page);
      await createProject(page);
      const r = await page.evaluate(() => {
        const bar = document.getElementById('bar').getBoundingClientRect();
        const botones = [...document.querySelectorAll('#bar button')].map(b => {
          const x = b.getBoundingClientRect();
          return {id: b.id, izq: x.left, der: x.right, corta: b.scrollWidth > b.clientWidth + 1};
        });
        return {barBottom: bar.bottom, alto: innerHeight, ancho: innerWidth, botones};
      });
      expect(r.barBottom).toBeLessThanOrEqual(r.alto + 0.5);
      for (const b of r.botones) {
        expect(b.izq, b.id).toBeGreaterThanOrEqual(0);
        expect(b.der, b.id).toBeLessThanOrEqual(r.ancho + 0.5);
        expect(b.corta, b.id).toBe(false);
      }
    });

    test('las reglas están ocultas por defecto y Ajustar aprovecha el espacio', async ({page}) => {
      await open(page);
      await createProject(page);
      expect(await page.evaluate(() => S.rulers)).toBe(false);
      await expect(page.locator('#rulerx')).toBeHidden();
      await page.click('#zfit');
      const r = await page.evaluate(() => {
        const st = document.getElementById('stage'),
          cs = getComputedStyle(st),
          util = Math.min(
            st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
            st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom),
          );
        return {lado: Math.min(S.w, S.h) * S.zoom, util};
      });
      expect(r.lado / r.util).toBeGreaterThan(0.95);
      const ajustar = await page.locator('#zfit').boundingBox();
      expect(ajustar.x + ajustar.width).toBeGreaterThanOrEqual(width - 12);
    });

    test('las pestañas muestran que siguen hacia la derecha', async ({page}) => {
      await open(page);
      await createProject(page);
      const r = await page.evaluate(() => {
        const rail = document.getElementById('rail'),
          cs = getComputedStyle(rail);
        return {
          desborda: rail.scrollWidth > rail.clientWidth,
          degradados: (cs.backgroundImage.match(/linear-gradient/g) || []).length,
          fijacion: cs.backgroundAttachment,
        };
      });
      expect(r.desborda).toBe(true);
      expect(r.degradados).toBeGreaterThanOrEqual(4);
      expect(r.fijacion).toContain('local');
    });
  });
}
