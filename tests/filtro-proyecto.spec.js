const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const valido = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'proyecto-valido.json'), 'utf8'));

async function preparar(page) {
  const problemas = await open(page);
  await createProject(page);
  await page.evaluate(() => {
    S.pages = ['#ff8020', '#2060ff'].map(c => {
      const p = newPage({pat: 'solid', c1: c, c2: c});
      p.els.push(
        mk('text', {text: 'MMMM', x: 80, y: 80, w: 900, h: 300, size: 220, fill: '#ff0000'}),
        mk('rect', {x: 100, y: 600, w: 300, h: 300, fill: '#00c040'}),
      );
      return p;
    });
    S.cur = 0;
    S.sel = [];
    refresh({props: true, panel: true});
  });
  return problemas;
}

async function elegir(page, preset) {
  const sec = page.locator('#props [data-sec="pflt"]');
  if (!(await sec.evaluate(d => d.open))) await sec.locator('> summary').click();
  await sec.locator(`[data-pfp="${preset}"]`).click();
}

async function abrirArchivo(page, js) {
  await page.evaluate(() => openStudio(() => MoonStudio.open('poster')));
  await page.setInputFiles('#st-json', {
    name: 'proyecto.moonlight.json',
    mimeType: 'application/json',
    buffer: Buffer.from(js),
  });
  await expect(page.locator('#toast')).toContainText('Proyecto abierto');
  return page.evaluate(() => [S.pflt, S.pfp]);
}

async function exportarPNG(page, i, info) {
  await page.evaluate(i => {
    S.cur = i;
    S.sel = [];
    refresh({props: true});
  }, i);
  await page.click('#rail [data-tab="export"]');
  await page.click('[data-cvset="fmt:png"]');
  await page.click('[data-cvset="pages:cur"]');
  const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cvgo')]);
  const file = info.outputPath(`pagina-${i}.png`);
  await d.saveAs(file);
  return fs.readFileSync(file).toString('base64');
}

const comparar = (page, i, b64) =>
  page.evaluate(
    async ([i, b64]) => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + b64;
      await im.decode();
      const c = cv(im.width, im.height),
        x = c.getContext('2d');
      x.drawImage(im, 0, 0);
      const out = x.getImageData(0, 0, c.width, c.height).data,
        crudo = renderPageCanvas(S.pages[i], 1, mediaFrame, null),
        cd = crudo.getContext('2d').getImageData(0, 0, crudo.width, crudo.height).data,
        ref = renderPageCanvas(S.pages[i], 1, mediaFrame, null);
      applyFilter(ref, S.pflt);
      const copia = cv(ref.width, ref.height),
        cx = copia.getContext('2d');
      cx.drawImage(ref, 0, 0);
      const rd = cx.getImageData(0, 0, ref.width, ref.height).data,
        px = (d, X, Y) => [...d.slice((Y * c.width + X) * 4, (Y * c.width + X) * 4 + 3)],
        gris = ([r, g, b]) => Math.abs(r - g) <= 1 && Math.abs(g - b) <= 1;
      let texto = null;
      for (let Y = 80; Y < 380 && !texto; Y += 2)
        for (let X = 80; X < 980 && !texto; X += 2) {
          const [r, g, b] = px(cd, X, Y);
          if (r > 200 && g < 40 && b < 40) texto = [X, Y];
        }
      let distintos = 0;
      for (let k = 0; k < out.length; k++) if (out[k] !== rd[k]) distintos++;
      return {
        tam: [c.width, c.height],
        distintos,
        antes: [px(cd, 1050, 1050), texto && px(cd, ...texto), px(cd, 250, 750)],
        fondo: gris(px(out, 1050, 1050)),
        texto: !!texto && gris(px(out, ...texto)),
        forma: gris(px(out, 250, 750)),
      };
    },
    [i, b64],
  );

test('con Gris en el proyecto, fondo, texto y forma salen en gris en las dos páginas', async ({
  page,
}, info) => {
  const problemas = await preparar(page);
  await elegir(page, 'Gris');
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{gray: 100}, 'Gris']);
  for (const i of [0, 1]) {
    const r = await comparar(page, i, await exportarPNG(page, i, info));
    expect(r.antes[1]).not.toBeNull();
    expect(r.antes.every(([a, b, c]) => a !== b || b !== c)).toBe(true);
    expect([r.fondo, r.texto, r.forma]).toEqual([true, true, true]);
  }
  expect(problemas).toEqual([]);
});

test('el PNG exportado es igual píxel a píxel a renderPageCanvas + applyFilter de la página', async ({
  page,
}, info) => {
  await preparar(page);
  await elegir(page, 'Nítido');
  for (const i of [0, 1]) {
    const r = await comparar(page, i, await exportarPNG(page, i, info));
    expect(r.tam).toEqual([1080, 1080]);
    expect(r.distintos).toBe(0);
  }
});

test('los cuadros del GIF animado y del video llevan el filtro del proyecto', async ({page}) => {
  await preparar(page);
  await page.click('#rail [data-tab="images"]');
  await page.setInputFiles('#file', {
    name: 'anim.gif',
    mimeType: 'image/gif',
    buffer: fs.readFileSync(path.join(__dirname, 'fixtures', 'anim.gif')),
  });
  await page.waitForFunction(() => els().some(e => e.type === 'media'));
  await page.evaluate(() => {
    S.sel = [];
    refresh({props: true});
  });
  await elegir(page, 'Noir');
  const r = await page.evaluate(() => {
    const cuadro = pageAnimator(pg(), 1)(mediaFrame),
      ref = cv(S.w, S.h),
      x = ref.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, S.w, S.h);
    x.drawImage(renderPageCanvas(pg(), 1), 0, 0);
    const a = cuadro.getContext('2d').getImageData(0, 0, S.w, S.h).data,
      b = x.getImageData(0, 0, S.w, S.h).data;
    let distintos = 0;
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) distintos++;
    return {distintos, gris: a[0] === a[1] && a[1] === a[2]};
  });
  expect(r).toEqual({distintos: 0, gris: true});
});

test('el filtro se suma al filtro propio de cada imagen', async ({page}) => {
  await preparar(page);
  const r = await page.evaluate(() => {
    const c = cv(40, 40),
      x = c.getContext('2d');
    x.fillStyle = '#ff2000';
    x.fillRect(0, 0, 40, 40);
    imgCache[c.toDataURL()] = Object.assign(c, {_ok: true});
    const e = mk('image', {src: c.toDataURL(), x: 500, y: 500, w: 200, h: 200, px: 1, flt: {inv: 100}});
    S.pages[0].els.push(e);
    S.pflt = {gray: 100};
    const sin = renderPageCanvas(S.pages[0], 1, mediaFrame, null),
      con = renderPageCanvas(S.pages[0], 1);
    applyFilter(sin, S.pflt);
    const a = sin.getContext('2d').getImageData(600, 600, 1, 1).data,
      b = con.getContext('2d').getImageData(600, 600, 1, 1).data;
    return [[...a], [...b]];
  });
  expect(r[1]).toEqual(r[0]);
  expect(r[1][0]).toBe(r[1][1]);
  expect(r[1][0]).toBeGreaterThan(100);
});

test('las miniaturas de páginas y Presentar usan el filtro; las plantillas no', async ({page}) => {
  await preparar(page);
  await elegir(page, 'Invertir');
  const r = await page.evaluate(async () => {
    const lee = c => [
      ...c
        .getContext('2d')
        .getImageData(c.width - 2, c.height - 2, 1, 1)
        .data.slice(0, 3),
    ];
    S.tab = 'pages';
    renderPanel();
    const mini = lee($('#panel .pg canvas'));
    S.tab = 'templates';
    renderPanel();
    const b = $('#tpls [data-tpl]'),
      tpl = lee(renderPageCanvas(TPL[b.dataset.tpl].build(), 0.1, mediaFrame, null));
    await openPresent();
    const im = $('#pimg');
    await im.decode();
    const c = cv(im.naturalWidth, im.naturalHeight);
    c.getContext('2d').drawImage(im, 0, 0);
    return {mini, tpl, panel: lee($('canvas', b)), pres: lee(c)};
  });
  expect(r.mini).toEqual([0, 0x7f, 0xdf]);
  expect(r.pres).toEqual([0, 0x7f, 0xdf]);
  expect(r.panel).toEqual(r.tpl);
});

test('guardar, recargar y abrir el JSON conserva el filtro del proyecto', async ({page}) => {
  await preparar(page);
  await elegir(page, 'Vintage');
  await expect(page.locator('#savest')).toHaveText(/Guardado/);
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.click('[data-act="continue"]');
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
  const vintage = await page.evaluate(() => PRESETS.Vintage);
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([vintage, 'Vintage']);
  const js = await page.evaluate(() => exportJSON());
  expect(JSON.parse(js).pflt).toEqual(vintage);
  await page.evaluate(() => {
    S.pflt = {};
    S.pfp = 'Original';
  });
  await page.click('#rail [data-tab="export"]');
  await page.click('#cvprev');
  await page.fill('#xjson', js);
  await page.click('#xload');
  await expect(page.locator('#toast')).toContainText('Proyecto cargado');
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([vintage, 'Vintage']);
  await page.evaluate(() => {
    S.pflt = {};
    S.pfp = 'Original';
  });
  expect(await abrirArchivo(page, js)).toEqual([vintage, 'Vintage']);
});

test('un JSON de v1.4.0 sin pflt abre sin errores y sin filtro', async ({page}) => {
  const problemas = await preparar(page);
  await elegir(page, 'Gris');
  expect(valido.pflt).toBeUndefined();
  await page.click('#rail [data-tab="export"]');
  await page.click('#cvprev');
  await page.fill('#xjson', JSON.stringify(valido));
  await page.click('#xload');
  await expect(page.locator('#toast')).toContainText('Proyecto cargado');
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{}, 'Original']);
  await page.evaluate(() => (S.pflt = {gray: 100}));
  expect(await abrirArchivo(page, JSON.stringify(valido))).toEqual([{}, 'Original']);
  expect(problemas).toEqual([]);
});

for (const [nombre, pflt] of [
  ['un ajuste que no es número', {gray: 'mucho'}],
  ['una paleta inexistente', {pal: 'no-existe'}],
  ['un duotono roto', {duo: ['#000000']}],
  ['una clave desconocida', {zzz: 1}],
  ['un texto', 'gris'],
])
  test(`validateProject rechaza un filtro del proyecto con ${nombre}`, async ({page}) => {
    await open(page);
    expect(await page.evaluate(o => validateProject(o), {...valido, pflt})).toBe(
      'filtro del proyecto inválido',
    );
  });

test('deshacer quita el filtro del proyecto y rehacer lo devuelve', async ({page}) => {
  await preparar(page);
  await elegir(page, 'Gris');
  await page.click('#undo');
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{}, 'Original']);
  await page.click('#redo');
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{gray: 100}, 'Gris']);
});

test('la sección tiene los presets, los ajustes manuales y Quitar filtro', async ({page}) => {
  await preparar(page);
  await elegir(page, 'Sepia');
  const sec = page.locator('#props [data-sec="pflt"]');
  expect(await sec.locator('[data-pfp]').count()).toBe(
    await page.evaluate(() => Object.keys(PRESETS).length),
  );
  await expect(sec.locator('[data-pfp="Sepia"]')).toHaveClass(/on/);
  expect(await sec.locator('[data-pfp] canvas').count()).toBe(
    await page.evaluate(() => Object.keys(PRESETS).length),
  );
  await sec.locator('input[data-pf="b"]').evaluate(i => {
    i.value = '30';
    i.dispatchEvent(new Event('input', {bubbles: true}));
  });
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{sep: 100, b: 30}, 'custom']);
  await sec.locator('[data-sec="pfcol"] > summary').click();
  await sec.locator('select[data-pf="pal"]').selectOption('gb');
  expect(await page.evaluate(() => S.pflt.pal)).toBe('gb');
  await sec.locator('#pfltreset').click();
  expect(await page.evaluate(() => [S.pflt, S.pfp])).toEqual([{}, 'Original']);
  await page.click('#undo');
  expect(await page.evaluate(() => S.pflt.pal)).toBe('gb');
});
