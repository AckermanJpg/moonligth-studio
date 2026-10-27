const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const addPhotos = (page, n) =>
  page.evaluate(async n => {
    for (let k = 0; k < n; k++) {
      const c = cv(1600, 1200),
        x = c.getContext('2d'),
        d = x.createImageData(1600, 1200);
      for (let i = 0; i < d.data.length; i++)
        d.data[i] = (i & 3) === 3 ? 255 : (Math.random() * 60 + ((i >> 9) & 127)) | 0;
      x.putImageData(d, 0, 0);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
      const o = await readImage(new File([blob], 'f.jpg', {type: 'image/jpeg'}), 1600);
      addImage(o.src, o.w, o.h);
    }
    await save();
  }, n);

const photoSrcs = page =>
  page.evaluate(() => S.pages[0].els.filter(e => e.type === 'image' && e.src).map(e => e.src.slice(0, 15)));

const oldProject = () => {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 300;
  const x = c.getContext('2d'),
    d = x.createImageData(400, 300);
  for (let i = 0; i < d.data.length; i++) d.data[i] = (i & 3) === 3 ? 255 : (i * 7919) % 251;
  x.putImageData(d, 0, 0);
  const src = c.toDataURL('image/jpeg', 0.92);
  return {
    src,
    js: JSON.stringify({
      name: 'Antiguo',
      w: 1080,
      h: 1080,
      cur: 0,
      pages: [
        {
          bg: {pat: 'solid', c1: '#ffffff', c2: '#ffffff'},
          els: [{id: 'e1', type: 'image', src, x: 0, y: 0, w: 400, h: 300, rot: 0, op: 1, px: 1}],
        },
      ],
    }),
  };
};

test('con 4 fotos el autoguardado funciona y se recupera tras recargar', async ({page}) => {
  test.setTimeout(60000);
  const problems = await open(page);
  await createProject(page);
  await addPhotos(page, 4);
  await expect(page.locator('#savest')).toHaveText(/^Guardado/);
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.click('[data-act="continue"]');
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
  expect(await photoSrcs(page)).toEqual(Array(4).fill('data:image/jpeg'));
  expect(problems).toEqual([]);
});

test('un proyecto guardado con el formato anterior abre y pasa sus imágenes a IndexedDB', async ({page}) => {
  await open(page);
  const src = await page.evaluate(oldProject => {
    const o = eval(`(${oldProject})`)();
    localStorage.setItem(KEY, o.js);
    return o.src;
  }, oldProject.toString());
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.click('[data-act="continue"]');
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
  expect(await page.evaluate(() => S.pages[0].els[0].src)).toBe(src);
  await page.evaluate(() => save());
  const saved = await page.evaluate(() => localStorage.getItem(KEY));
  expect(saved).toContain('"@db:');
  expect(saved).not.toContain('data:image');
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.click('[data-act="continue"]');
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
  expect(await page.evaluate(() => S.pages[0].els[0].src)).toBe(src);
});

test('una referencia a una imagen que no está en IndexedDB no abre el proyecto ni lo borra', async ({
  page,
}) => {
  await open(page);
  const js = await page.evaluate(() => {
    const js = JSON.stringify({
      name: 'Roto',
      w: 1080,
      h: 1080,
      pages: [
        {
          bg: {pat: 'solid', c1: '#fff', c2: '#fff'},
          els: [{id: 'e1', type: 'image', src: '@db:nada', x: 0, y: 0, w: 9, h: 9}],
        },
      ],
    });
    localStorage.setItem(KEY, js);
    return js;
  });
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.click('[data-act="continue"]');
  await expect(page.locator('#toast')).toHaveText('No se pudo abrir el proyecto guardado');
  await expect(page.locator('#home')).toHaveClass(/on/);
  expect(await page.evaluate(() => localStorage.getItem(KEY))).toBe(js);
});

test('un JSON importado con una referencia @db: desconocida se rechaza', async ({page}) => {
  await open(page);
  await createProject(page);
  const why = await page.evaluate(() =>
    validateProject({
      w: 1080,
      h: 1080,
      pages: [{bg: {pat: 'image', src: '@db:otro', c1: '#fff', c2: '#fff'}, els: []}],
    }),
  );
  expect(why).toBe('falta una imagen guardada');
});

test('sin IndexedDB se sigue guardando como antes, con las imágenes en el proyecto', async ({page}) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new DOMException('bloqueado', 'SecurityError');
    };
  });
  const problems = await open(page);
  await createProject(page);
  await addPhotos(page, 1);
  await expect(page.locator('#savest')).toHaveText(/^Guardado/);
  const saved = await page.evaluate(() => localStorage.getItem(KEY));
  expect(saved).toContain('data:image/jpeg');
  expect(saved).not.toContain('@db:');
  expect(problems).toEqual([]);
});

test('el JSON de Exportar lleva las imágenes dentro, no referencias', async ({page}) => {
  await open(page);
  await createProject(page);
  await addPhotos(page, 1);
  await page.evaluate(() => openExport());
  const js = await page.locator('#xjson').inputValue();
  expect(js).toContain('data:image/jpeg');
  expect(js).not.toContain('@db:');
});

test('al guardar se borran las imágenes huérfanas de más de 24 h y se conservan las recientes', async ({
  page,
}) => {
  await open(page);
  await createProject(page);
  await addPhotos(page, 1);
  const keys = await page.evaluate(async () => {
    const db = await new Promise(
      r => (indexedDB.open('moonlight-studio', 1).onsuccess = ev => r(ev.target.result)),
    );
    const run = (mode, fn) =>
      new Promise(r => {
        const t = db.transaction('blobs', mode),
          q = fn(t.objectStore('blobs'));
        t.oncomplete = () => r(q && q.result);
      });
    await run('readwrite', s => {
      s.put({blob: new Blob(['x']), t: 0}, 'viejo');
      s.put({blob: new Blob(['x']), t: Date.now()}, 'nuevo');
    });
    await save();
    await new Promise(r => setTimeout(r, 200));
    return (await run('readonly', s => s.getAllKeys())).sort();
  });
  expect(keys).toHaveLength(2);
  expect(keys).toContain('nuevo');
  expect(keys).not.toContain('viejo');
});
