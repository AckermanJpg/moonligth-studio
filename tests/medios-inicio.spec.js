const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open, createProject} = require('./helpers');

const MIME = {gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm'};
const file = name => ({
  name,
  mimeType: MIME[name.split('.').pop()],
  buffer: fs.readFileSync(path.join(__dirname, 'fixtures', name)),
});

async function inicioCon(page, name, size) {
  await page.click('[data-act="style:normal"]');
  await page.click('[data-act="cat:photo"]');
  if (!(await page.locator('#hphoto').count())) await page.click('[data-act="next"]');
  await page.setInputFiles('#hphoto', file(name));
  await page.waitForFunction(() => H.photo);
  if (size) await page.click(`[data-act="psz:${size}"]`);
  for (let i = 0; i < 5; i++) {
    const create = page.locator('[data-act="create"]');
    if (await create.count()) {
      await create.click();
      break;
    }
    await page.click('[data-act="next"]');
  }
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
}

test.describe('GIF y video desde el inicio', () => {
  for (const [name, kind, label] of [
    ['anim.gif', 'gif', 'GIF animado'],
    ['clip-10s.webm', 'video', 'Video'],
  ])
    test(`Editar una foto mía con ${name} crea un elemento media:${kind}`, async ({page}) => {
      const problems = await open(page);
      await inicioCon(page, name);
      const e = await page.evaluate(() => {
        const e = pg().els[0];
        return {n: pg().els.length, type: e.type, kind: e.kind, x: e.x, y: e.y, full: e.w === S.w && e.h === S.h};
      });
      expect(e).toEqual({n: 1, type: 'media', kind, x: 0, y: 0, full: true});
      await page.click('#rail [data-tab="export"]');
      await expect(page.locator(`[data-cvset="fmt:${kind}"]`)).toHaveText(label);
      expect(problems).toEqual([]);
    });

  test('con el tamaño Cuadrado, el GIF cubre el lienzo sin deformarse y centrado', async ({page}) => {
    await open(page);
    await inicioCon(page, 'anim.gif', 'sq');
    const e = await page.evaluate(() => {
      const {type, x, y, w, h} = pg().els[0];
      return {type, x, y, w, h, W: S.w, H: S.h};
    });
    expect(e).toEqual({type: 'media', x: -180, y: 0, w: 1440, h: 1080, W: 1080, H: 1080});
  });

  test('un GIF de un solo cuadro sigue entrando como foto', async ({page}) => {
    await open(page);
    await inicioCon(page, 'transparente.gif');
    expect(await page.evaluate(() => pg().els.map(e => e.type))).toEqual(['image']);
  });
});

test('una celda de collage con un GIF animado avisa que usa el primer cuadro', async ({page}) => {
  await open(page);
  await createProject(page);
  await page.evaluate(() => addGrid(0));
  await page.setInputFiles('#cellfile', file('anim.gif'));
  await expect(page.locator('#toast')).toHaveText(
    'Aquí se usa el primer cuadro. Para que se mueva, agrégalo desde Imágenes',
  );
  expect(await page.evaluate(() => !!prim().src)).toBe(true);
});
