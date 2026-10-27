const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open, createProject} = require('./helpers');

const MIME = {gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', png: 'image/png'};
const file = (name, as = name) => ({
  name: as,
  mimeType: MIME[as.split('.').pop()],
  buffer: fs.readFileSync(path.join(__dirname, 'fixtures', name)),
});

async function subir(page, files) {
  await page.click('#rail [data-tab="images"]');
  const before = await page.evaluate(() => els().length);
  await page.setInputFiles('#file', files);
  return before;
}

async function agregar(page, name) {
  const before = await subir(page, file(name));
  await page.waitForFunction(n => els().length > n, before);
  return page.evaluate(() => prim().id);
}

async function conFoto(page) {
  await page.evaluate(() => {
    const c = cv(600, 400),
      x = c.getContext('2d');
    x.fillStyle = '#c03030';
    x.fillRect(0, 0, 600, 400);
    addImage(c.toDataURL('image/png'), 600, 400);
  });
}

const cuadro = (page, id) =>
  page.evaluate(id => document.querySelector(`#page .el[data-id="${id}"] canvas`).toDataURL(), id);
const video = (page, id) =>
  page.evaluate(id => {
    const v = document.querySelector(`#page .el[data-id="${id}"] video`);
    return v && {muted: v.muted, loop: v.loop, inline: v.playsInline, paused: v.paused, t: v.currentTime};
  }, id);

async function avanza(page, id, kind) {
  if (kind === 'gif') {
    const a = await cuadro(page, id);
    await page.waitForTimeout(450);
    return a !== (await cuadro(page, id));
  }
  const a = (await video(page, id)).t;
  await page.waitForTimeout(450);
  return (await video(page, id)).t !== a;
}

test.describe('GIF y video como elementos', () => {
  test('un GIF encima de una foto se anima, y deshacer y redimensionar funcionan', async ({page}) => {
    const problems = await open(page);
    await createProject(page);
    await conFoto(page);
    const id = await agregar(page, 'anim.gif');
    const e = await page.evaluate(() => {
      const {type, kind, mime, frames, nw, nh} = prim();
      return {type, kind, mime, frames, nw, nh, top: els().indexOf(prim()) === els().length - 1};
    });
    expect(e).toEqual({type: 'media', kind: 'gif', mime: 'image/gif', frames: 12, nw: 64, nh: 48, top: true});
    expect(await avanza(page, id, 'gif')).toBe(true);
    const box = await page.locator('#ovl .ov i[data-h="se"]').boundingBox();
    const w0 = await page.evaluate(() => prim().w);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 60, {steps: 5});
    await page.mouse.up();
    const after = await page.evaluate(() => ({w: prim().w, h: prim().h}));
    expect(after.w).toBeGreaterThan(w0);
    expect(after.w / after.h).toBeCloseTo(64 / 48, 1);
    expect(await avanza(page, id, 'gif')).toBe(true);
    await page.click('#undo');
    expect(await page.evaluate(() => prim().w)).toBe(w0);
    await page.click('#undo');
    expect(await page.evaluate(id => !!findEl(id), id)).toBe(false);
    await page.click('#redo');
    expect(await page.evaluate(id => !!findEl(id), id)).toBe(true);
    expect(await avanza(page, id, 'gif')).toBe(true);
    expect(problems).toEqual([]);
  });

  for (const name of ['clip-10s.webm', 'clip-10s.mp4'])
    test(`un video de 10 s (${name.split('.').pop()}) se reproduce sin sonido y en bucle`, async ({page}) => {
      const problems = await open(page);
      await createProject(page);
      const id = await agregar(page, name);
      expect(await page.evaluate(() => ({kind: prim().kind, dur: prim().dur}))).toEqual({
        kind: 'video',
        dur: 10,
      });
      await expect.poll(() => video(page, id).then(v => v && !v.paused)).toBe(true);
      expect(await video(page, id)).toMatchObject({muted: true, loop: true, inline: true});
      expect(await avanza(page, id, 'video')).toBe(true);
      await page.evaluate(id => {
        document.querySelector(`#page .el[data-id="${id}"] video`).currentTime = 9.9;
      }, id);
      await expect.poll(() => video(page, id).then(v => v.t < 5 && !v.paused), {timeout: 5000}).toBe(true);
      expect(problems).toEqual([]);
    });

  test('un .gif que en realidad es texto se rechaza con un mensaje claro', async ({page}) => {
    await open(page);
    await createProject(page);
    await subir(page, file('falso.gif'));
    await expect(page.locator('#toast')).toHaveText('El archivo no es un GIF, MP4 ni WebM válido');
    expect(await page.evaluate(() => els().length)).toBe(0);
  });

  test('un video renombrado a .gif se acepta como video porque cuenta lo que dicen sus bytes', async ({
    page,
  }) => {
    await open(page);
    await createProject(page);
    await subir(page, file('clip-10s.webm', 'clip.gif'));
    await page.waitForFunction(() => els().length === 1);
    expect(await page.evaluate(() => [prim().kind, prim().mime])).toEqual(['video', 'video/webm']);
  });

  test('rechaza medios fuera de los límites', async ({page}) => {
    await open(page);
    await createProject(page);
    await subir(page, file('clip-20s.webm'));
    await expect(page.locator('#toast')).toHaveText('El video dura más de 15 s');
    const largo = await page.evaluate(async () => {
      await loadScript('js/gif-encoder.js');
      const frames = [];
      for (let f = 0; f < 301; f++) {
        const data = new Uint8ClampedArray(8 * 8 * 4).fill(255);
        data[(f % 64) * 4] = 0;
        frames.push({data, delay: 0.05});
      }
      return [...new Uint8Array(await MoonGif.encode(frames, 8, 8, {dither: false}).arrayBuffer())];
    });
    await subir(page, {name: 'largo.gif', mimeType: 'image/gif', buffer: Buffer.from(largo)});
    await expect(page.locator('#toast')).toHaveText('El GIF tiene más de 300 cuadros');
    const gif = fs.readFileSync(path.join(__dirname, 'fixtures', 'anim.gif'));
    await subir(page, {
      name: 'pesado.gif',
      mimeType: 'image/gif',
      buffer: Buffer.concat([gif, Buffer.alloc(8 * 1024 * 1024)]),
    });
    await expect(page.locator('#toast')).toHaveText('El GIF pesa más de 8 MB');
    await subir(page, {
      name: 'pesado.webm',
      mimeType: 'video/webm',
      buffer: Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(30 * 1024 * 1024)]),
    });
    await expect(page.locator('#toast')).toHaveText('El video pesa más de 30 MB');
    expect(await page.evaluate(() => els().length)).toBe(0);
  });

  test('un GIF de un solo cuadro se agrega como imagen normal', async ({page}) => {
    await open(page);
    await createProject(page);
    const one = await page.evaluate(async () => {
      await loadScript('js/gif-encoder.js');
      const data = new Uint8ClampedArray(16 * 16 * 4).fill(200);
      return [...new Uint8Array(await MoonGif.encode([{data, delay: 0.1}], 16, 16).arrayBuffer())];
    });
    await subir(page, {name: 'uno.gif', mimeType: 'image/gif', buffer: Buffer.from(one)});
    await page.waitForFunction(() => els().length === 1);
    expect(await page.evaluate(() => prim().type)).toBe('image');
  });

  test('con prefers-reduced-motion los medios arrancan en pausa', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await open(page);
    await createProject(page);
    const g = await agregar(page, 'anim.gif');
    const v = await agregar(page, 'clip-10s.webm');
    await page.waitForTimeout(300);
    expect(await avanza(page, g, 'gif')).toBe(false);
    expect((await video(page, v)).paused).toBe(true);
    await expect(page.locator('#props [data-mplay]')).toHaveText('Reproducir');
    await page.click('#props [data-mplay]');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(false);
    expect(await avanza(page, g, 'gif')).toBe(false);
  });

  test('Pausar todo detiene todos y el botón de cada elemento pausa solo ese', async ({page}) => {
    await open(page);
    await createProject(page);
    await expect(page.locator('#pauseall')).toBeHidden();
    const g = await agregar(page, 'anim.gif');
    const v = await agregar(page, 'clip-10s.webm');
    await expect(page.locator('#pauseall')).toBeVisible();
    await expect(page.locator('#pauseall')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(false);
    await page.click('#props [data-mplay]');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(true);
    expect(await avanza(page, g, 'gif')).toBe(true);
    await page.click('#props [data-mplay]');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(false);
    await page.click('#pauseall');
    await expect(page.locator('#pauseall')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(true);
    expect(await avanza(page, g, 'gif')).toBe(false);
    await page.click('#pauseall');
    await expect.poll(() => video(page, v).then(x => x.paused)).toBe(false);
    expect(await avanza(page, g, 'gif')).toBe(true);
  });

  test('el ciclo de animación se detiene sin medios visibles o con la pestaña oculta', async ({page}) => {
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.rafCount = 0;
      window.requestAnimationFrame = cb => {
        window.rafCount++;
        return raf(cb);
      };
    });
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    const contar = () =>
      page.evaluate(async () => {
        const a = window.rafCount;
        await new Promise(r => setTimeout(r, 500));
        return window.rafCount - a;
      });
    expect(await contar()).toBeGreaterThan(10);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {value: true, configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await contar()).toBeLessThan(3);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {value: false, configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await contar()).toBeGreaterThan(10);
    await page.click('#padd');
    await page.waitForFunction(() => S.cur === 1);
    expect(await contar()).toBeLessThan(3);
  });

  test('tras recargar, el proyecto con GIF y video se recupera desde IndexedDB', async ({page}) => {
    const problems = await open(page);
    await createProject(page);
    const g = await agregar(page, 'anim.gif');
    const v = await agregar(page, 'clip-10s.webm');
    await page.evaluate(() => save());
    const saved = await page.evaluate(() => localStorage.getItem(KEY));
    expect(saved.length).toBeLessThan(5000);
    expect(saved).not.toContain('data:');
    await page.reload();
    await page.waitForSelector('#home.on');
    await page.click('[data-act="continue"]');
    await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
    expect(await page.evaluate(() => els().map(e => [e.type, e.kind]))).toEqual([
      ['media', 'gif'],
      ['media', 'video'],
    ]);
    expect(await avanza(page, g, 'gif')).toBe(true);
    await expect.poll(() => video(page, v).then(x => x && !x.paused)).toBe(true);
    expect(problems).toEqual([]);
  });

  test('si al continuar falta un medio, queda un aviso en su lugar', async ({page}) => {
    await open(page);
    await createProject(page);
    const v = await agregar(page, 'clip-10s.webm');
    await page.evaluate(() => save());
    await page.evaluate(async () => {
      const db = await new Promise(
        r => (indexedDB.open('moonlight-studio', 1).onsuccess = ev => r(ev.target.result)),
      );
      await new Promise(r => {
        const t = db.transaction('blobs', 'readwrite');
        t.objectStore('blobs').clear();
        t.oncomplete = r;
      });
    });
    await page.reload();
    await page.waitForSelector('#home.on');
    await page.click('[data-act="continue"]');
    await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
    await expect(page.locator('#toast')).toHaveText(
      'Falta 1 imagen o video guardado; quedó marcado en el lienzo',
    );
    await expect(page.locator(`#page .el[data-id="${v}"]`)).toContainText('Falta esta imagen');
  });

  test('pide almacenamiento persistente al guardar el primer medio y avisa una vez si se niega', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.persistCalls = 0;
      navigator.storage.persist = () => {
        window.persistCalls++;
        return Promise.resolve(false);
      };
    });
    await open(page);
    await createProject(page);
    await conFoto(page);
    await page.evaluate(() => save());
    expect(await page.evaluate(() => window.persistCalls)).toBe(0);
    await agregar(page, 'anim.gif');
    await page.waitForFunction(() => window.persistCalls === 1);
    await page.evaluate(() => save());
    await expect(page.locator('#savest')).toHaveText(/^Guardado \d\d:\d\d · el navegador podría borrar/);
    await agregar(page, 'clip-10s.webm');
    await page.evaluate(() => save());
    await expect(page.locator('#savest')).toHaveText(/^Guardado \d\d:\d\d$/);
    expect(await page.evaluate(() => window.persistCalls)).toBe(1);
  });

  test('libera las object URL al abrir otro proyecto, pero no al borrar mientras se puede deshacer', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const revoke = URL.revokeObjectURL;
      window.revoked = [];
      URL.revokeObjectURL = u => {
        window.revoked.push(u);
        revoke.call(URL, u);
      };
    });
    await open(page);
    await createProject(page);
    const v = await agregar(page, 'clip-10s.webm');
    const url = await page.evaluate(id => document.querySelector(`#page .el[data-id="${id}"] video`).src, v);
    expect(url).toMatch(/^blob:/);
    await page.keyboard.press('Delete');
    await page.evaluate(() => save());
    expect(await page.evaluate(u => window.revoked.includes(u), url)).toBe(false);
    await page.click('#undo');
    await expect.poll(() => video(page, v).then(x => x && !x.paused)).toBe(true);
    await page.evaluate(() => openHome());
    await createProject(page);
    expect(await page.evaluate(u => window.revoked.includes(u), url)).toBe(true);
  });

  test('validateProject acepta medios válidos y rechaza tipos, rangos y referencias desconocidas', async ({
    page,
  }) => {
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    const r = await page.evaluate(() => {
      const base = JSON.parse(snapshot()),
        el = base.pages[0].els[0],
        check = patch => {
          const o = JSON.parse(JSON.stringify(base));
          Object.assign(o.pages[0].els[0], patch);
          return validateProject(o);
        };
      return {
        ok: check({}),
        inline: check({src: 'data:image/gif;base64,R0lGODlh'}),
        mime: check({mime: 'video/avi'}),
        kind: check({kind: 'video'}),
        frames: check({frames: 301}),
        dur: check({dur: -1}),
        video: check({mime: 'video/mp4', kind: 'video', dur: 20, frames: 0}),
        unknown: check({src: '@db:otro'}),
        badsrc: check({src: 'https://ejemplo.com/a.gif'}),
        el: el.src.slice(0, 4),
      };
    });
    expect(r).toEqual({
      ok: '',
      inline: '',
      mime: 'tipo de medio no permitido',
      kind: 'tipo de medio no permitido',
      frames: 'medio fuera de rango',
      dur: 'medio fuera de rango',
      video: 'medio fuera de rango',
      unknown: 'falta una imagen guardada',
      badsrc: 'medio sin archivo',
      el: '@db:',
    });
  });

  test('el JSON de Exportar lleva los medios dentro y se vuelve a cargar en otro navegador', async ({
    page,
    browser,
  }) => {
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    await agregar(page, 'clip-10s.webm');
    await page.evaluate(() => openExport());
    await expect(page.locator('#xjson')).not.toHaveValue('');
    const js = await page.locator('#xjson').inputValue();
    expect(js).toContain('"src":"data:image/gif;base64,');
    expect(js).toContain('"src":"data:video/webm;base64,');
    expect(js).not.toContain('@db:');
    const otra = await browser.newPage();
    await open(otra);
    await createProject(otra);
    await otra.evaluate(() => openExport());
    await otra.locator('#xjson').fill(js);
    await otra.click('#xload');
    await expect(otra.locator('#toast')).toHaveText('Proyecto cargado');
    const loaded = await otra.evaluate(() => els().map(e => [e.type, e.kind, e.src.slice(0, 4)]));
    expect(loaded).toEqual([
      ['media', 'gif', '@db:'],
      ['media', 'video', '@db:'],
    ]);
    const v = await otra.evaluate(() => els()[1].id);
    await expect.poll(() => video(otra, v).then(x => x && !x.paused)).toBe(true);
    await otra.close();
  });

  test('si el JSON pasa de 20 MB avisa y ofrece exportarlo sin los videos', async ({page}) => {
    test.setTimeout(60000);
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    const clip = fs.readFileSync(path.join(__dirname, 'fixtures', 'clip-10s.webm'));
    const pad = Buffer.alloc(16 * 1024 * 1024);
    const relleno = Buffer.concat([
      clip,
      Buffer.from([0xec, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]),
      pad.subarray(0, 16 * 1024 * 1024 - 9),
    ]);
    await subir(page, {name: 'grande.webm', mimeType: 'video/webm', buffer: relleno});
    await page.waitForFunction(() => els().length === 2);
    await page.evaluate(() => openExport());
    await expect(page.locator('#xbig')).toContainText('MB');
    await expect(page.locator('#xjson')).toHaveValue('');
    await page.click('#xnovid');
    await expect(page.locator('#xjson')).not.toHaveValue('');
    const js = await page.locator('#xjson').inputValue();
    expect(js.length).toBeLessThan(1e6);
    expect(js).toContain('data:image/gif;base64,');
    expect(js).not.toContain('video/webm');
    expect(js).not.toContain('@db:');
  });
});
