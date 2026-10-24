const {test, expect} = require('@playwright/test');
const {stubFonts} = require('./helpers');

const estrellas = page => page.evaluate(() => document.querySelector('#home canvas').toDataURL());
const diapositiva = page =>
  page.evaluate(() => [...document.querySelectorAll('.hdot')].findIndex(d => d.classList.contains('on')));

async function abrir(page) {
  await stubFonts(page);
  await page.clock.install();
  await page.goto('/index.html');
  await page.waitForSelector('#home.on');
  await page.clock.runFor(500);
}

test.describe('sin preferencia de movimiento reducido', () => {
  test('el fondo de estrellas y el carrusel se mueven', async ({page}) => {
    await abrir(page);
    const e0 = await estrellas(page);
    const d0 = await diapositiva(page);
    await page.clock.runFor(12000);
    expect(await estrellas(page)).not.toBe(e0);
    expect(await diapositiva(page)).not.toBe(d0);
  });
});

test.describe('con prefers-reduced-motion: reduce', () => {
  test.use({reducedMotion: 'reduce'});

  test('el fondo de estrellas y el carrusel quedan quietos', async ({page}) => {
    await abrir(page);
    const e0 = await estrellas(page);
    const d0 = await diapositiva(page);
    await page.clock.runFor(12000);
    expect(await estrellas(page)).toBe(e0);
    expect(await diapositiva(page)).toBe(d0);
  });
});
