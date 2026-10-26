const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test.use({viewport: {width: 1440, height: 900}});

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

const enPantalla = (page, x, y) =>
  page.evaluate(
    ([x, y]) => {
      const r = pageEl.getBoundingClientRect();
      return [r.left + x * S.zoom, r.top + y * S.zoom];
    },
    [x, y],
  );

async function arrastrar(page, [x0, y0], [x1, y1], {shift = false, enMedio} = {}) {
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8);
  if (enMedio) await enMedio();
  await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
}

const recuadro = async (page, a, b, o) =>
  arrastrar(page, await enPantalla(page, ...a), await enPantalla(page, ...b), o);

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

test('con zoom al 150 % el recuadro toma el elemento girado por su rectángulo envolvente y no el fondo bloqueado', async ({
  page,
}) => {
  await preparar(page);
  await page.evaluate(() => {
    setZoom(1.5);
    stageEl.scrollLeft = 750;
    stageEl.scrollTop = 0;
  });
  await recuadro(page, [612, 175], [632, 198]);
  expect(await seleccion(page)).toEqual(['girado']);
  await expect(page.locator('#selmsg')).toHaveText('1 elemento seleccionado');
});

test('el recuadro puede empezar en la zona gris fuera de la página y se ve mientras se arrastra', async ({
  page,
}) => {
  await preparar(page);
  const [x0, y0] = await enPantalla(page, 0, 80);
  let visible = false;
  await arrastrar(page, [x0 - 20, y0], await enPantalla(page, 420, 220), {
    enMedio: async () => (visible = await page.locator('.marq').isVisible()),
  });
  expect(visible).toBe(true);
  await expect(page.locator('.marq')).toHaveCount(0);
  expect(await seleccion(page)).toEqual(['a', 'b']);
  await expect(page.locator('#selmsg')).toHaveText('2 elementos seleccionados');
});

test('Shift + arrastre suma a la selección actual', async ({page}) => {
  await preparar(page);
  await page.mouse.click(...(await enPantalla(page, 150, 150)));
  expect(await seleccion(page)).toEqual(['a']);
  await recuadro(page, [280, 80], [420, 220], {shift: true});
  expect(await seleccion(page)).toEqual(['a', 'b']);
});

test('un clic sin arrastre deselecciona en la zona vacía y sigue seleccionando un bloqueado', async ({
  page,
}) => {
  await preparar(page, {fondo: false});
  await page.mouse.click(...(await enPantalla(page, 150, 150)));
  expect(await seleccion(page)).toEqual(['a']);
  const [x, y] = await enPantalla(page, 500, 600);
  await arrastrar(page, [x, y], [x + 3, y + 2]);
  expect(await seleccion(page)).toEqual([]);
  await page.mouse.click(...(await enPantalla(page, 150, 150)));
  const [gx, gy] = await enPantalla(page, 0, 300);
  await page.mouse.click(gx - 20, gy);
  expect(await seleccion(page)).toEqual([]);
  await preparar(page);
  await page.mouse.click(...(await enPantalla(page, 500, 600)));
  expect(await seleccion(page)).toEqual(['fondo']);
});

test('el recuadro expande los grupos y no toma elementos ocultos', async ({page}) => {
  await preparar(page);
  await recuadro(page, [90, 390], [130, 430]);
  expect(await seleccion(page)).toEqual(['g1', 'g2']);
  await recuadro(page, [320, 420], [380, 480]);
  expect(await seleccion(page)).toEqual([]);
});
