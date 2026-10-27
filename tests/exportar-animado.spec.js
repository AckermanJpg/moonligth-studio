const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open, createProject} = require('./helpers');

const fixture = name => ({
  name,
  mimeType: name.endsWith('.gif') ? 'image/gif' : 'video/webm',
  buffer: fs.readFileSync(path.join(__dirname, 'fixtures', name)),
});

async function agregar(page, name) {
  await page.click('#rail [data-tab="images"]');
  const n = await page.evaluate(() => els().length);
  await page.setInputFiles('#file', fixture(name));
  await page.waitForFunction(n => els().length > n, n);
  return page.evaluate(() => prim().id);
}

async function fotoDeFondo(page) {
  await page.evaluate(() => {
    const c = cv(S.w, S.h),
      x = c.getContext('2d');
    x.fillStyle = '#c03030';
    x.fillRect(0, 0, S.w, S.h);
    addImage(c.toDataURL('image/png'), S.w, S.h);
    Object.assign(prim(), {x: 0, y: 0, w: S.w, h: S.h});
    refresh({});
  });
}

async function arriba(page, id) {
  await page.evaluate(id => {
    Object.assign(findEl(id), {x: 40, y: 40, w: 320, h: 240});
    refresh({});
  }, id);
}

const diferencia = (page, id) =>
  page.evaluate(id => {
    const e = findEl(id),
      out = renderPageCanvas(pg(), 1),
      a = out.getContext('2d').getImageData(e.x, e.y, e.w, e.h).data,
      ref = cv(S.w, S.h),
      x = ref.getContext('2d');
    x.drawImage(out, 0, 0);
    x.imageSmoothingEnabled = smoothImage(e);
    x.imageSmoothingQuality = 'high';
    x.drawImage(document.querySelector(`#page .el[data-id="${id}"]`).firstChild, e.x, e.y, e.w, e.h);
    const b = x.getImageData(e.x, e.y, e.w, e.h).data;
    let d = 0;
    for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]);
    return d / a.length;
  }, id);

async function exportar(page, fmt, opts = {}) {
  await page.click('#rail [data-tab="export"]');
  await page.click(`[data-cvset="fmt:${fmt}"]`);
  for (const [k, v] of Object.entries(opts)) await page.fill(`[data-cv="${k}"]`, String(v));
  const [download] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}),
    page.click('#cvgo'),
  ]);
  const file = await download.path();
  return {name: download.suggestedFilename(), file, bytes: fs.readFileSync(file)};
}

test.describe('exportar con GIF y video', () => {
  for (const [name, kind] of [
    ['anim.gif', 'GIF'],
    ['clip-10s.webm', 'video'],
  ])
    test(`PNG usa el cuadro del ${kind} visible en ese momento, también tras avanzar`, async ({page}) => {
      await open(page);
      await createProject(page);
      await fotoDeFondo(page);
      const id = await agregar(page, name);
      await arriba(page, id);
      await page.waitForTimeout(700);
      await page.click('#pauseall');
      expect(await diferencia(page, id)).toBeLessThan(2);
      const antes = await page.evaluate(() => renderPageCanvas(pg(), 1).toDataURL());
      await page.click('#pauseall');
      await page.waitForTimeout(450);
      await page.click('#pauseall');
      expect(await diferencia(page, id)).toBeLessThan(2);
      expect(await page.evaluate(() => renderPageCanvas(pg(), 1).toDataURL())).not.toBe(antes);
    });

  test('un video en otra página se exporta con su primer cuadro, no en blanco', async ({page}) => {
    await open(page);
    await createProject(page);
    const v = await agregar(page, 'clip-10s.webm');
    await arriba(page, v);
    await page.click('#padd');
    await page.waitForFunction(() => S.cur === 1);
    const colores = await page.evaluate(() => {
      const d = renderPageCanvas(S.pages[0], 1).getContext('2d').getImageData(40, 40, 320, 240).data,
        set = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) set.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
      return set.size;
    });
    expect(colores).toBeGreaterThan(10);
  });

  for (const [name, n] of [
    ['clip-10s.webm', 100],
    ['anim.gif', 12],
  ])
    test(`al exportar a 10 fps no se pierde ningún cuadro de ${name}`, async ({page}) => {
      test.setTimeout(60000);
      await open(page);
      await createProject(page);
      await agregar(page, name);
      const r = await page.evaluate(async n => {
        const tr = await mediaTrack(pg()),
          e = prim(),
          c = cv(e.nw, e.nh),
          x = c.getContext('2d', {willReadFrequently: true}),
          vistos = [];
        for (let k = 0; k < n; k++) {
          await tr.seek(k / 10);
          x.clearRect(0, 0, c.width, c.height);
          x.drawImage(tr.pick(k / 10)(e), 0, 0);
          vistos.push(c.toDataURL());
        }
        tr.close();
        const dup = vistos.flatMap((v, i) => (i && v === vistos[i - 1] ? [i] : []));
        return {distintos: new Set(vistos).size, dup};
      }, n);
      expect(r.dup).toEqual([]);
      expect(r.distintos).toBe(n);
    });

  test('PDF con un GIF se descarga', async ({page}) => {
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    const r = await exportar(page, 'pdf');
    expect(r.name).toMatch(/\.pdf$/);
    expect(r.bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('GIF animado: más de un cuadro y la foto de fondo visible en todos', async ({page}) => {
    test.setTimeout(90000);
    await open(page);
    await createProject(page);
    await fotoDeFondo(page);
    const g = await agregar(page, 'anim.gif');
    await arriba(page, g);
    await page.click('#rail [data-tab="export"]');
    await page.click('[data-cvset="fmt:gif"]');
    await expect(page.locator('[data-cv="dur"]')).toHaveValue('1.2');
    const r = await exportar(page, 'gif', {fps: 10});
    expect(r.name).toMatch(/\.gif$/);
    const info = await page.evaluate(
      async bytes => {
        const dec = new ImageDecoder({data: new Uint8Array(bytes).buffer, type: 'image/gif'});
        await dec.tracks.ready;
        const n = dec.tracks.selectedTrack.frameCount,
          fotos = [],
          gifs = [];
        let dur = 0;
        for (let i = 0; i < n; i++) {
          const {image} = await dec.decode({frameIndex: i}),
            c = cv(image.displayWidth, image.displayHeight),
            x = c.getContext('2d');
          x.drawImage(image, 0, 0);
          dur += image.duration / 1e6;
          image.close();
          const k = c.width / S.w,
            at = (X, Y) => [...x.getImageData(Math.round(X * k), Math.round(Y * k), 1, 1).data].slice(0, 3);
          fotos.push(at(S.w - 20, S.h - 20), at(20, S.h / 2));
          gifs.push(c.toDataURL());
        }
        return {n, dur, fotos, distintos: new Set(gifs).size};
      },
      [...r.bytes],
    );
    console.log(`GIF animado: ${r.bytes.length} bytes, ${info.n} cuadros, ${info.dur.toFixed(2)} s`);
    expect(info.n).toBeGreaterThan(1);
    expect(info.distintos).toBeGreaterThan(1);
    for (const [R, G, B] of info.fotos) {
      expect(Math.abs(R - 0xc0)).toBeLessThan(24);
      expect(Math.abs(G - 0x30)).toBeLessThan(24);
      expect(Math.abs(B - 0x30)).toBeLessThan(24);
    }
    expect(Math.abs(info.dur - 1.2)).toBeLessThan(0.15);
  });

  test('GIF animado con un video: la duración por defecto es la del medio más largo y el video cambia', async ({
    page,
  }) => {
    test.setTimeout(90000);
    await open(page);
    await createProject(page);
    await agregar(page, 'anim.gif');
    const v = await agregar(page, 'clip-10s.webm');
    await arriba(page, v);
    await page.click('#rail [data-tab="export"]');
    await page.click('[data-cvset="fmt:gif"]');
    await expect(page.locator('[data-cv="dur"]')).toHaveValue('10');
    const r = await exportar(page, 'gif', {fps: 5, dur: 2});
    const n = await page.evaluate(
      async bytes => {
        const dec = new ImageDecoder({data: new Uint8Array(bytes).buffer, type: 'image/gif'});
        await dec.tracks.ready;
        const seen = new Set();
        for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
          const {image} = await dec.decode({frameIndex: i}),
            c = cv(image.displayWidth, image.displayHeight),
            x = c.getContext('2d');
          x.drawImage(image, 0, 0);
          image.close();
          const k = c.width / S.w;
          seen.add(
            c.toDataURL().length +
              ':' +
              x.getImageData(Math.round(200 * k), Math.round(160 * k), 1, 1).data.join(),
          );
        }
        return seen.size;
      },
      [...r.bytes],
    );
    expect(n).toBeGreaterThan(5);
  });

  test('Video: dura lo esperado y no está vacío', async ({page}) => {
    test.setTimeout(90000);
    await open(page);
    await createProject(page);
    await fotoDeFondo(page);
    const g = await agregar(page, 'anim.gif');
    await arriba(page, g);
    const r = await exportar(page, 'video', {dur: 3});
    expect(r.name).toMatch(/\.(mp4|webm)$/);
    expect(r.bytes.length).toBeGreaterThan(1000);
    const meta = await page.evaluate(
      async ([bytes, type]) => {
        const v = document.createElement('video');
        v.muted = true;
        v.src = URL.createObjectURL(new Blob([new Uint8Array(bytes)], {type}));
        await new Promise((res, rej) => {
          v.onloadedmetadata = res;
          v.onerror = rej;
        });
        if (!isFinite(v.duration)) {
          v.currentTime = 1e9;
          await new Promise(r => (v.ondurationchange = r));
        }
        return {dur: v.duration, w: v.videoWidth, h: v.videoHeight};
      },
      [[...r.bytes], r.name.endsWith('mp4') ? 'video/mp4' : 'video/webm'],
    );
    console.log(`Video: ${r.name}, ${r.bytes.length} bytes, ${meta.dur.toFixed(2)} s, ${meta.w}×${meta.h}`);
    expect(Math.abs(meta.dur - 3)).toBeLessThanOrEqual(0.5);
    expect(meta.w).toBeGreaterThan(0);
  });
});
