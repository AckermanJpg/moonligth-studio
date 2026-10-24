const {test, expect} = require('@playwright/test');
const {open, createProject, stubFonts} = require('./helpers');

const TITULO = 'Tu estudio de diseño en el navegador';

test.describe('sin JavaScript', () => {
  test.use({javaScriptEnabled: false});

  test('el H2 del inicio ya está en index.html y es visible', async ({page}) => {
    await stubFonts(page);
    await page.goto('/index.html');
    const h2 = page.locator('#home.on .hbody > h2');
    await expect(h2).toBeVisible();
    await expect(h2).toHaveText(TITULO);
    await expect(page.locator('#home .hbody .lead')).toBeVisible();
  });
});

async function observarH2(page) {
  await page.addInitScript(() => {
    window.__h2 = {distintos: new Set(), quitados: 0};
    const visto = () => {
      const h2 = document.querySelector('#home .hbody > h2');
      if (h2) window.__h2.distintos.add(h2);
    };
    new MutationObserver(ms => {
      visto();
      ms.forEach(m =>
        m.removedNodes.forEach(n => {
          if (n.nodeType === 1 && (n.matches('#home .hbody > h2') || n.querySelector('#home .hbody > h2')))
            window.__h2.quitados++;
        }),
      );
    }).observe(document, {childList: true, subtree: true});
  });
}

const resumenH2 = page =>
  page.evaluate(() => ({distintos: window.__h2.distintos.size, quitados: window.__h2.quitados}));

test('el script reutiliza el H2 del inicio en vez de crearlo', async ({page}) => {
  await observarH2(page);
  await open(page);
  await page.waitForTimeout(800);
  expect(await resumenH2(page)).toEqual({distintos: 1, quitados: 0});
  await expect(page.locator('#home .hbody > h2')).toHaveText(TITULO);
  await expect(page.locator('#hside .sumbox')).toBeVisible();
  await expect(page.locator('#home .hshow')).toBeVisible();
});

test('con un proyecto guardado reutiliza el H2 y agrega Continuar', async ({page}) => {
  await open(page);
  await createProject(page);
  await expect(page.locator('#savest')).toHaveText(/Guardado/);
  await page.close();
  const otra = await page.context().newPage();
  await observarH2(otra);
  await stubFonts(otra);
  await otra.goto('/index.html');
  await otra.waitForSelector('#home.on [data-act="continue"]');
  expect(await resumenH2(otra)).toEqual({distintos: 1, quitados: 0});
  await expect(otra.locator('#home .hbody > h2')).toHaveText(TITULO);
});

test('el foco entra al inicio al cargar', async ({page}) => {
  await open(page);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => !!document.activeElement.closest('#home'))).toBe(true);
});
