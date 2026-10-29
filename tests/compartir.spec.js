const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {FILE_URL, open, createProject} = require('./helpers');

const IG = 'https://www.instagram.com/moonlight___studio__/';

async function enlace(link) {
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText('Instagram');
  expect(
    await link.evaluate(a => [a.getAttribute('href'), a.target, a.rel, a.getAttribute('aria-label')]),
  ).toEqual([IG, '_blank', 'noopener noreferrer', 'Moonlight Studio en Instagram']);
}

test('el enlace a Instagram está en el inicio y en la Ayuda, con la URL exacta, target y rel', async ({
  page,
}) => {
  const problemas = await open(page);
  await enlace(page.locator('#home .hhead a[href*="instagram"]'));
  await page.click('[data-act="style:normal"]');
  await page.click('[data-act="cat:social"]');
  await expect(page.locator('#home [data-act="back"]')).toBeVisible();
  await enlace(page.locator('#home .hhead a[href*="instagram"]'));
  await page.click('#home [data-act="help"]');
  await enlace(page.locator('#mbox a[href*="instagram"]'));
  await page.click('#mbox #xclose');
  await page.reload();
  await page.waitForSelector('#home.on');
  await createProject(page);
  await page.click('#help-btn');
  await enlace(page.locator('#mbox a[href*="instagram"]'));
  expect(await page.locator('#top a[href*="instagram"], #bar a[href*="instagram"]').count()).toBe(0);
  expect(problemas).toEqual([]);
});

async function simular(page, {canShare = true, modos = []} = {}) {
  await page.addInitScript(
    ([canShare, modos]) => {
      window.__compartidos = [];
      window.__modos = modos;
      if (canShare !== 'ausente')
        Object.defineProperty(navigator, 'canShare', {
          configurable: true,
          value: d => canShare && !!(d && d.files && d.files.length && d.files[0] instanceof File),
        });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async d => {
          window.__compartidos.push(d);
          const m = window.__modos.shift();
          if (m) throw new DOMException('simulado', m);
        },
      });
    },
    [canShare, modos],
  );
}

async function exportar(page, fmt, pages = 'cur') {
  await page.click('#rail [data-tab="export"]');
  await page.click(`[data-cvset="fmt:${fmt}"]`);
  if (await page.locator(`[data-cvset="pages:${pages}"]`).count())
    await page.click(`[data-cvset="pages:${pages}"]`);
}

test('«Compartir» aparece con PNG, JPG y WEBP de la página actual, y no con PDF, GIF, video ni Todas', async ({
  page,
}) => {
  await simular(page);
  await open(page);
  await createProject(page);
  await page.click('#rail [data-tab="images"]');
  await page.setInputFiles('#file', {
    name: 'anim.gif',
    mimeType: 'image/gif',
    buffer: fs.readFileSync(path.join(__dirname, 'fixtures', 'anim.gif')),
  });
  await page.waitForFunction(() => els().some(e => e.type === 'media'));
  for (const fmt of ['png', 'jpg', 'webp']) {
    await exportar(page, fmt);
    await expect(page.locator('#cvshare')).toHaveText('Compartir');
    await exportar(page, fmt, 'all');
    await expect(page.locator('#cvshare')).toHaveCount(0);
  }
  for (const fmt of ['pdf', 'gif', 'video']) {
    await exportar(page, fmt);
    await expect(page.locator('#cvshare')).toHaveCount(0);
  }
});

for (const [nombre, canShare] of [
  ['sin canShare', 'ausente'],
  ['con canShare que devuelve false', false],
])
  test(`${nombre}, el botón Compartir no existe`, async ({page}) => {
    await simular(page, {canShare});
    await open(page);
    await createProject(page);
    for (const fmt of ['png', 'jpg', 'webp']) {
      await exportar(page, fmt);
      await expect(page.locator('#cvgo')).toBeVisible();
      await expect(page.locator('#cvshare')).toHaveCount(0);
    }
  });

test('abierto como file://, el botón Compartir no existe aunque canShare diga que sí', async ({page}) => {
  await simular(page);
  await open(page, FILE_URL);
  await createProject(page);
  expect(
    await page.evaluate(() => navigator.canShare({files: [new File([''], 'a.png', {type: 'image/png'})]})),
  ).toBe(true);
  await exportar(page, 'png');
  await expect(page.locator('#cvgo')).toBeVisible();
  await expect(page.locator('#cvshare')).toHaveCount(0);
});

for (const [fmt, tipo, ext] of [
  ['png', 'image/png', 'png'],
  ['jpg', 'image/jpeg', 'jpg'],
  ['webp', 'image/webp', 'webp'],
])
  test(`share recibe un File ${ext} con el nombre del proyecto y el mismo contenido que Descargar`, async ({
    page,
  }, info) => {
    await simular(page);
    await open(page);
    await createProject(page);
    await page.click('#rail [data-tab="templates"]');
    await page.locator('#tpls [data-tpl]').first().click();
    await page.fill('#name', 'Mi Póster Ñandú');
    await page.locator('#name').dispatchEvent('change');
    await exportar(page, fmt);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cvgo')]);
    const file = info.outputPath('descarga.' + ext);
    await d.saveAs(file);
    await page.click('#cvshare');
    await page.waitForFunction(() => window.__compartidos.length === 1);
    const r = await page.evaluate(async () => {
      const d = window.__compartidos[0],
        f = d.files[0],
        b = new Uint8Array(await f.arrayBuffer());
      let s = '';
      for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
      return {n: d.files.length, esFile: f instanceof File, nombre: f.name, tipo: f.type, b64: btoa(s)};
    });
    expect(r.nombre).toBe(d.suggestedFilename());
    expect(r).toMatchObject({n: 1, esFile: true, nombre: `Mi_Poster_Nandu.${ext}`, tipo});
    expect(Buffer.from(r.b64, 'base64').equals(fs.readFileSync(file))).toBe(true);
    await expect(page.locator('#cvshare')).toHaveText('Compartir');
  });

test('NotAllowedError deja «Compartir ahora» y el segundo toque comparte la imagen ya generada', async ({
  page,
}) => {
  await simular(page, {modos: ['NotAllowedError']});
  const problemas = await open(page);
  await createProject(page);
  await exportar(page, 'png');
  await page.click('#cvshare');
  await expect(page.locator('#cvshare')).toHaveText('Compartir ahora');
  await page.click('#cvshare');
  await page.waitForFunction(() => window.__compartidos.length === 2);
  expect(
    await page.evaluate(() => window.__compartidos[1].files[0] === window.__compartidos[0].files[0]),
  ).toBe(true);
  await expect(page.locator('#cvshare')).toHaveText('Compartir');
  expect(problemas).toEqual([]);
});

test('si se cambia el diseño, «Compartir ahora» genera la imagen de nuevo', async ({page}) => {
  await simular(page, {modos: ['NotAllowedError']});
  await open(page);
  await createProject(page);
  await exportar(page, 'png');
  await page.click('#cvshare');
  await expect(page.locator('#cvshare')).toHaveText('Compartir ahora');
  await page.evaluate(() => {
    pg().els.push(mk('rect', {x: 10, y: 10, w: 100, h: 100}));
    refresh({});
  });
  await page.click('#cvshare');
  await page.waitForFunction(() => window.__compartidos.length === 2);
  expect(
    await page.evaluate(() => window.__compartidos[1].files[0] === window.__compartidos[0].files[0]),
  ).toBe(false);
});

test('AbortError (la persona cierra el menú) no muestra ningún error', async ({page}) => {
  await simular(page, {modos: ['AbortError']});
  const problemas = await open(page);
  await createProject(page);
  await exportar(page, 'png');
  await page.click('#cvshare');
  await page.waitForFunction(() => window.__compartidos.length === 1);
  await page.waitForTimeout(300);
  await expect(page.locator('#cvshare')).toHaveText('Compartir');
  await expect(page.locator('#toast')).not.toContainText('No se pudo');
  expect(problemas).toEqual([]);
});

test('otro error al compartir avisa sin romper Descargar', async ({page}) => {
  await simular(page, {modos: ['DataError']});
  await open(page);
  await createProject(page);
  await exportar(page, 'png');
  await page.click('#cvshare');
  await expect(page.locator('#toast')).toContainText('No se pudo compartir');
  await expect(page.locator('#cvshare')).toHaveText('Compartir');
  const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cvgo')]);
  expect(d.suggestedFilename()).toMatch(/\.png$/);
});

test('el botón aparece solo con los formatos que canShare acepta', async ({page}) => {
  await page.addInitScript(() => {
    window.__preguntas = [];
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: d => {
        window.__preguntas.push(d.files[0].type);
        return d.files[0].type !== 'image/webp';
      },
    });
    Object.defineProperty(navigator, 'share', {configurable: true, value: async () => {}});
  });
  await open(page);
  await createProject(page);
  for (const [fmt, tipo, hay] of [
    ['png', 'image/png', 1],
    ['jpg', 'image/jpeg', 1],
    ['webp', 'image/webp', 0],
  ]) {
    await exportar(page, fmt);
    await expect(page.locator('#cvshare')).toHaveCount(hay);
    expect(await page.evaluate(() => window.__preguntas.at(-1))).toBe(tipo);
  }
});

test('la Ayuda menciona Compartir en el punto de Descarga', async ({page}) => {
  await open(page);
  await page.click('#home [data-act="help"]');
  const p = page.locator('#mbox h4', {hasText: 'Descarga'}).locator('xpath=following-sibling::p[1]');
  await expect(p).toContainText('Compartir');
});
