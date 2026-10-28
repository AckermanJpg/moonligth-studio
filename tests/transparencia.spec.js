const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open, createProject} = require('./helpers');

const MIME = {webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', jpg: 'image/jpeg', png: 'image/png'};
const file = name => ({
  name,
  mimeType: MIME[name.split('.').pop()],
  buffer: fs.readFileSync(path.join(__dirname, 'fixtures', name)),
});

async function subir(page, name) {
  await page.click('#rail [data-tab="images"]');
  const before = await page.evaluate(() => els().length);
  await page.setInputFiles('#file', file(name));
  await page.waitForFunction(n => els().length > n, before);
}

const pixel = (page, b64) =>
  page.evaluate(
    b64 =>
      new Promise(res => {
        const im = new Image();
        im.onload = () => {
          const c = cv(im.width, im.height),
            x = c.getContext('2d');
          x.drawImage(im, 0, 0);
          res([...x.getImageData(0, 0, 1, 1).data]);
        };
        im.src = 'data:image/png;base64,' + b64;
      }),
    b64,
  );

test.describe('Transparencia de las imágenes subidas', () => {
  for (const name of ['transparente.webp', 'transparente.svg', 'transparente.gif'])
    test(`${name} se guarda como PNG y conserva el borde transparente`, async ({page}) => {
      const problems = await open(page);
      await createProject(page);
      await subir(page, name);
      const r = await page.evaluate(() => {
        pg().bg.pat = 'none';
        const e = prim(),
          c = renderPageCanvas(pg(), 1),
          a = c.getContext('2d').getImageData(Math.round(e.x) + 1, Math.round(e.y) + 1, 1, 1).data[3];
        return {type: e.type, mime: e.src.slice(0, 14), a};
      });
      expect(r).toEqual({type: 'image', mime: 'data:image/png', a: 0});
      expect(problems).toEqual([]);
    });

  test('un JPG sin alfa sigue guardándose como JPEG', async ({page}) => {
    await open(page);
    await createProject(page);
    await subir(page, 'opaca.jpg');
    expect(await page.evaluate(() => prim().src.slice(0, 15))).toBe('data:image/jpeg');
  });

  test('PNG opaco sigue como image/png', async ({page}) => {
    await open(page);
    await createProject(page);
    await subir(page, 'opaca.png');
    expect(await page.evaluate(() => prim().src.slice(0, 15))).toBe('data:image/png;');
  });
});

test.describe('Fondo transparente al descargar', () => {
  async function descargar(page, info, marcar) {
    await page.click('#rail [data-tab="export"]');
    await page.click('[data-cvset="fmt:png"]');
    if (marcar) await page.check('#cvtransp');
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cvgo')]);
    const f = info.outputPath(marcar ? 'sin-fondo.png' : 'con-fondo.png');
    await d.saveAs(f);
    return pixel(page, fs.readFileSync(f).toString('base64'));
  }

  test('con la casilla, el PNG sale sin fondo y el diseño no cambia', async ({page}, info) => {
    await open(page);
    await createProject(page);
    const antes = await page.evaluate(() => JSON.stringify(pg().bg));
    expect(await page.evaluate(() => [pg().bg.pat, pg().bg.c1])).toEqual(['solid', '#ffffff']);
    expect((await descargar(page, info, true))[3]).toBe(0);
    expect(await page.evaluate(() => JSON.stringify(pg().bg))).toBe(antes);
  });

  test('sin la casilla, la esquina es blanca y opaca', async ({page}, info) => {
    await open(page);
    await createProject(page);
    expect(await descargar(page, info, false)).toEqual([255, 255, 255, 255]);
  });

  test('la casilla solo aparece con PNG y WEBP', async ({page}) => {
    await open(page);
    await createProject(page);
    await page.click('#rail [data-tab="export"]');
    for (const [fmt, n] of [
      ['jpg', 0],
      ['png', 1],
      ['webp', 1],
      ['pdf', 0],
    ]) {
      await page.click(`[data-cvset="fmt:${fmt}"]`);
      await expect(page.locator('#cvtransp')).toHaveCount(n);
    }
    await expect(page.locator('#cvtransp')).toHaveCount(0);
  });

  test('si la página ya es transparente, la casilla sale marcada y desactivada', async ({page}) => {
    await open(page);
    await createProject(page);
    await page.evaluate(() => (pg().bg.pat = 'none'));
    await page.click('#rail [data-tab="export"]');
    await page.click('[data-cvset="fmt:png"]');
    await expect(page.locator('#cvtransp')).toBeChecked();
    await expect(page.locator('#cvtransp')).toBeDisabled();
    await expect(page.getByText('Tu fondo es transparente: el PNG lo conserva.')).toBeVisible();
  });
});
