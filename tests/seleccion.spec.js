const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

async function preparar(page, {fondo = true} = {}) {
  await open(page);
  await createProject(page);
  await page.evaluate(fondo => {
    const r = (id, o) => ({...mk('rect', {w: 100, h: 100, ...o}), id});
    pg().els = [
      ...(fondo ? [{...mk('image', {src: '', x: 0, y: 0, w: S.w, h: S.h, locked: true}), id: 'fondo'}] : []),
      r('a', {x: 100, y: 100}),
      r('b', {x: 300, y: 100}),
      r('g1', {x: 100, y: 400, w: 80, h: 80, gid: 'g9'}),
      r('g2', {x: 700, y: 700, w: 80, h: 80, gid: 'g9'}),
      r('oculto', {x: 300, y: 400, hidden: true}),
      r('girado', {x: 600, y: 100, w: 200, h: 40, rot: 45}),
    ];
    S.sel = [];
    refresh({props: true});
  }, fondo);
}

const seleccion = page => page.evaluate(() => [...S.sel].sort());

test('Seleccionar todo en Capas y Ctrl+A dejan la misma selección y la anuncian', async ({page}) => {
  await preparar(page);
  await page.click('#props [data-selall]');
  const conBoton = await seleccion(page);
  expect(conBoton).toEqual(['a', 'b', 'fondo', 'g1', 'g2', 'girado']);
  await expect(page.locator('#selmsg')).toHaveText('6 elementos seleccionados');
  await page.evaluate(() => {
    S.sel = [];
    refresh({props: true});
  });
  await page.locator('#stage').click({position: {x: 5, y: 5}});
  await page.keyboard.press('Control+a');
  expect(await seleccion(page)).toEqual(conBoton);
});

test('el anuncio usa singular con un solo elemento', async ({page}) => {
  await preparar(page, {fondo: false});
  await page.evaluate(() => {
    pg().els = pg().els.slice(0, 1);
    refresh({props: true});
  });
  await page.click('#props [data-selall]');
  await expect(page.locator('#selmsg')).toHaveText('1 elemento seleccionado');
  await expect(page.locator('#selmsg')).toHaveAttribute('aria-live', 'polite');
});
