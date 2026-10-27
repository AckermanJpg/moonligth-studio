const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const dentro = (box, width) => box && box.x >= 0 && box.x + box.width <= width + 0.5;

async function conElementos(page) {
  await page.evaluate(() => {
    const r = (id, x, y) => ({...mk('rect', {x, y, w: 200, h: 200}), id});
    pg().els = [r('a', 100, 100), r('b', 600, 100), r('c', 100, 600)];
    S.sel = [];
    refresh({props: true});
  });
}

const enPantalla = (page, x, y) =>
  page.evaluate(
    ([x, y]) => {
      const r = pageEl.getBoundingClientRect();
      return [r.left + x * S.zoom, r.top + y * S.zoom];
    },
    [x, y],
  );

async function deslizar(page, [x0, y0], [x1, y1], enMedio) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: x0, y: y0}]});
  for (let i = 1; i <= 8; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{x: x0 + ((x1 - x0) * i) / 8, y: y0 + ((y1 - y0) * i) / 8}],
    });
  const r = enMedio && (await enMedio());
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  return r;
}

const seleccion = page => page.evaluate(() => [...S.sel].sort());

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
      const resto = [
        '#home-btn',
        '#name',
        '#sizechip',
        '#news-btn',
        '#help-btn',
        '#present-btn',
        '#save-btn',
      ];
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

    test('Selección múltiple: cada toque suma o quita y el arrastre en zona vacía dibuja el recuadro', async ({
      page,
    }) => {
      await open(page);
      await createProject(page);
      await conElementos(page);
      const boton = page.locator('#multi-btn');
      await expect(boton).toBeVisible();
      const caja = await boton.boundingBox();
      expect(caja.width).toBeGreaterThanOrEqual(24);
      expect(caja.height).toBeGreaterThanOrEqual(24);
      await expect(boton).toHaveAttribute('aria-pressed', 'false');
      await boton.tap();
      await expect(boton).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => getComputedStyle(stageEl).touchAction)).toBe('none');
      await page.touchscreen.tap(...(await enPantalla(page, 200, 200)));
      await page.touchscreen.tap(...(await enPantalla(page, 700, 200)));
      expect(await seleccion(page)).toEqual(['a', 'b']);
      await page.touchscreen.tap(...(await enPantalla(page, 200, 200)));
      expect(await seleccion(page)).toEqual(['b']);
      await expect(page.locator('#selmsg')).toHaveText('1 elemento seleccionado');
      const visible = await deslizar(
        page,
        await enPantalla(page, 50, 450),
        await enPantalla(page, 250, 650),
        () => page.locator('.marq').isVisible(),
      );
      expect(visible).toBe(true);
      expect(await seleccion(page)).toEqual(['b', 'c']);
      await expect(page.locator('#selmsg')).toHaveText('2 elementos seleccionados');
      await page.waitForTimeout(700);
      await boton.tap();
      await expect(boton).toHaveAttribute('aria-pressed', 'false');
      expect(await page.evaluate(() => getComputedStyle(stageEl).touchAction)).toBe('auto');
    });

    test('fuera del modo múltiple el dedo se comporta como antes', async ({page}) => {
      await open(page);
      await createProject(page);
      await conElementos(page);
      expect(await page.evaluate(() => getComputedStyle(stageEl).touchAction)).toBe('auto');
      await page.touchscreen.tap(...(await enPantalla(page, 200, 200)));
      expect(await seleccion(page)).toEqual(['a']);
      await page.touchscreen.tap(...(await enPantalla(page, 500, 500)));
      expect(await seleccion(page)).toEqual([]);
      const visible = await deslizar(
        page,
        await enPantalla(page, 50, 450),
        await enPantalla(page, 250, 650),
        () => page.locator('.marq').count(),
      );
      expect(visible).toBe(0);
      expect(await seleccion(page)).toEqual([]);
    });

    test('Seleccionar todo desde el menú Más', async ({page}) => {
      await open(page);
      await createProject(page);
      await conElementos(page);
      await expect(page.locator('#selall-top')).toBeHidden();
      await page.click('#more-btn');
      const b = page.locator('#selall-top');
      await expect(b).toBeVisible();
      expect(dentro(await b.boundingBox(), width)).toBeTruthy();
      await b.click();
      expect(await seleccion(page)).toEqual(['a', 'b', 'c']);
      await expect(page.locator('#more-btn')).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('#selmsg')).toHaveText('3 elementos seleccionados');
    });

    test('Pausar todo desde el menú Más, sin tapar las otras opciones', async ({page}) => {
      await open(page);
      await createProject(page);
      const gif = [...require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'anim.gif'))];
      await page.evaluate(b => loadMedia(new File([new Uint8Array(b)], 'a.gif', {type: 'image/gif'})), gif);
      await page.waitForFunction(() => els().length === 1);
      await expect(page.locator('#pauseall')).toBeHidden();
      await page.click('#more-btn');
      const b = page.locator('#pauseall');
      await expect(b).toBeVisible();
      const box = await b.boundingBox(),
        sel = await page.locator('#selall-top').boundingBox();
      expect(dentro(box, width)).toBeTruthy();
      expect(box.y).toBeGreaterThanOrEqual(sel.y + sel.height);
      const tope = await page.evaluate(() => {
        const r = document.getElementById('pauseall').getBoundingClientRect();
        return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).closest('.menu-media');
      });
      expect(tope).toBe(true);
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#more-btn')).toHaveAttribute('aria-expanded', 'false');
      expect(await page.evaluate(() => mediaPaused(els()[0].id))).toBe(true);
    });

    test('el aviso amarillo no tapa ningún control, ni con el menú Más abierto', async ({page}) => {
      await open(page);
      await createProject(page);
      await expect(page.locator('#flash')).toBeVisible();
      const tapados = () =>
        page.evaluate(() =>
          [...document.querySelectorAll('#app button, #app input, #app select')]
            .filter(n => n.offsetParent)
            .filter(n => {
              const r = n.getBoundingClientRect();
              return [
                [r.left + r.width / 2, r.top + r.height / 2],
                [r.left + 2, r.top + 2],
                [r.right - 2, r.top + 2],
                [r.left + 2, r.bottom - 2],
                [r.right - 2, r.bottom - 2],
              ].some(([x, y]) => document.elementFromPoint(x, y)?.closest('#flash'));
            })
            .map(n => n.id || n.textContent.trim()),
        );
      expect(await tapados()).toEqual([]);
      await page.click('#more-btn');
      await expect(page.locator('#flash')).toBeVisible();
      expect(await tapados()).toEqual([]);
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

    test('con novedades sin leer, Más lleva el punto y lo dice; Novedades está dentro y lo quita', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        if (!sessionStorage.getItem('sembrado')) {
          localStorage.setItem('moonlight-news-v1', JSON.stringify({aviso: '1.1.0', leido: '1.1.0'}));
          sessionStorage.setItem('sembrado', '1');
        }
      });
      await open(page);
      await createProject(page);
      const mas = page.locator('#more-btn'),
        nov = page.locator('#news-btn');
      await expect(mas).toHaveClass(/\bunread\b/);
      await expect(mas).toHaveAttribute('aria-label', 'Más opciones: hay novedades sin leer');
      await mas.click();
      await expect(nov).toBeVisible();
      await expect(nov).toHaveClass(/\bunread\b/);
      expect(dentro(await nov.boundingBox(), width)).toBeTruthy();
      await nov.click();
      await expect(page.locator('#mbox h3')).toHaveText('Novedades');
      await page.click('#xclose');
      await expect(mas).not.toHaveClass(/\bunread\b/);
      await expect(mas).toHaveAttribute('aria-label', 'Más opciones');
      await expect(nov).not.toHaveClass(/\bunread\b/);
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
