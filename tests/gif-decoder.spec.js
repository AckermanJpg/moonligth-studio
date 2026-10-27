const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open} = require('./helpers');

const fixture = name => [...fs.readFileSync(path.join(__dirname, 'fixtures', name))];

async function compare(page, bytes) {
  return page.evaluate(async bytes => {
    await loadScript('js/gif-decoder.js');
    const buf = bytes ? new Uint8Array(bytes).buffer : window.bigGif,
      own = MoonGif.decodeGif(buf),
      view = MoonGif.gifView(own),
      dec = new ImageDecoder({data: buf, type: 'image/gif'});
    await dec.tracks.ready;
    const n = dec.tracks.selectedTrack.frameCount,
      diffs = [],
      times = [];
    let at = 0;
    for (let i = 0; i < n; i++) {
      const {image} = await dec.decode({frameIndex: i}),
        c = cv(image.displayWidth, image.displayHeight),
        x = c.getContext('2d');
      x.drawImage(image, 0, 0);
      times.push(Math.round(at * 1000));
      at += Math.max(0.02, (image.duration || 100000) / 1e6);
      image.close();
      const a = x.getImageData(0, 0, own.w, own.h).data,
        b = view.show(i).getContext('2d').getImageData(0, 0, own.w, own.h).data;
      let d = 0;
      for (let k = 0; k < a.length; k += 4)
        if (
          a[k + 3] !== b[k + 3] ||
          (a[k + 3] && (a[k] !== b[k] || a[k + 1] !== b[k + 1] || a[k + 2] !== b[k + 2]))
        )
          d++;
      diffs.push(d);
    }
    dec.close();
    return {
      n,
      count: own.count,
      frames: own.frames.length,
      size: [own.w, own.h],
      diffs,
      times,
      own: own.times.map(t => Math.round(t * 1000)),
      duration: Math.round(own.duration * 1000),
      total: Math.round(at * 1000),
    };
  }, bytes);
}

test('el decodificador propio da los mismos cuadros que ImageDecoder con transparencia, disposal y entrelazado', async ({
  page,
}) => {
  await open(page);
  const r = await compare(page, fixture('transparencia.gif'));
  expect(r.n).toBe(8);
  expect(r).toMatchObject({count: 8, frames: 8, size: [80, 60]});
  expect(r.diffs).toEqual(Array(8).fill(0));
  expect(r.own).toEqual(r.times);
  expect(r.duration).toBe(r.total);
});

test('el decodificador propio da los mismos cuadros que ImageDecoder en un GIF con paletas locales', async ({
  page,
}) => {
  await open(page);
  const r = await compare(page, fixture('anim.gif'));
  expect(r).toMatchObject({n: 12, count: 12, frames: 12, size: [64, 48]});
  expect(r.diffs).toEqual(Array(12).fill(0));
});

test('el decodificador propio da los mismos cuadros que ImageDecoder en un GIF de 130 cuadros con disposal, paletas locales y entrelazado', async ({
  page,
}) => {
  await open(page);
  const r = await compare(page, fixture('largo.gif'));
  expect(r).toMatchObject({n: 130, count: 130, frames: 130, size: [96, 72]});
  expect(r.diffs).toEqual(Array(130).fill(0));
  expect(r.own).toEqual(r.times);
});

const referencia = require('./fixtures/gif-referencia.json');
for (const [name, hashes] of Object.entries(referencia))
  test(`${name}: el formato indexado muestra los mismos cuadros que el formato anterior, en orden y saltando`, async ({
    page,
  }) => {
    await open(page);
    const r = await page.evaluate(
      async ([bytes, n]) => {
        await loadScript('js/gif-decoder.js');
        const g = MoonGif.decodeGif(new Uint8Array(bytes).buffer),
          view = MoonGif.gifView(g),
          hash = async c => {
            const d = c.getContext('2d').getImageData(0, 0, g.w, g.h).data,
              h = new Uint8Array(await crypto.subtle.digest('SHA-256', d));
            return [...h.subarray(0, 8)].map(x => x.toString(16).padStart(2, '0')).join('');
          },
          orden = [...Array(n).keys()];
        let seed = 3;
        for (let i = 0; i < n * 2; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          orden.push(seed % n);
        }
        orden.push(n - 1, 0, n - 1);
        const vistos = [];
        for (const i of orden) vistos.push([i, await hash(view.show(i))]);
        return {
          vistos,
          lienzos: g.frames.filter(f => f instanceof HTMLCanvasElement).length,
          claves: g.keys.length,
        };
      },
      [fixture(name), hashes.length],
    );
    expect(r.lienzos).toBe(0);
    expect(r.claves).toBe(Math.ceil(hashes.length / 50));
    for (const [i, h] of r.vistos) expect(h, `cuadro ${i}`).toBe(hashes[i]);
  });

test('decodifica un GIF de 8 MB en menos de 1 s y con los mismos cuadros que ImageDecoder', async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  const bytes = await page.evaluate(async () => {
    await loadScript('js/gif-encoder.js');
    const W = 400,
      H = 400,
      frames = [];
    let seed = 1;
    for (let f = 0; f < 38; f++) {
      const data = new Uint8ClampedArray(W * H * 4);
      for (let i = 0; i < data.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        data[i] = seed >>> 24;
        data[i + 1] = (seed >>> 16) & 255;
        data[i + 2] = (seed >>> 8) & 255;
        data[i + 3] = 255;
      }
      frames.push({data, delay: 0.1});
    }
    window.bigGif = await MoonGif.encode(frames, W, H, {dither: false}).arrayBuffer();
    return window.bigGif.byteLength;
  });
  expect(bytes).toBeGreaterThan(7.5e6);
  expect(bytes).toBeLessThanOrEqual(8 * 1024 * 1024);
  const ms = await page.evaluate(async () => {
    await loadScript('js/gif-decoder.js');
    const t = performance.now();
    MoonGif.decodeGif(window.bigGif);
    return performance.now() - t;
  });
  console.log(`GIF de ${(bytes / 1048576).toFixed(2)} MB decodificado en ${Math.round(ms)} ms`);
  expect(ms).toBeLessThan(1000);
  const r = await compare(page, null);
  expect(r.count).toBe(38);
  expect(r.diffs).toEqual(Array(38).fill(0));
});

test('con un máximo de cuadros, cuenta todos pero solo decodifica los primeros', async ({page}) => {
  await open(page);
  const r = await page.evaluate(async bytes => {
    await loadScript('js/gif-decoder.js');
    const o = MoonGif.decodeGif(new Uint8Array(bytes).buffer, {max: 5});
    return {count: o.count, frames: o.frames.length, duration: Math.round(o.duration * 1000)};
  }, fixture('anim.gif'));
  expect(r).toEqual({count: 12, frames: 5, duration: 500});
});

test('un archivo que no es GIF lanza un error', async ({page}) => {
  await open(page);
  const msg = await page.evaluate(async () => {
    await loadScript('js/gif-decoder.js');
    try {
      MoonGif.decodeGif(new TextEncoder().encode('esto no es un gif').buffer);
      return 'sin error';
    } catch (e) {
      return e.message;
    }
  });
  expect(msg).toBe('gif');
});

test.describe('archivos dañados o maliciosos', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      window.maxAlloc = 0;
      for (const k of ['Uint8Array', 'Uint16Array', 'Uint32Array', 'Uint8ClampedArray']) {
        const T = window[k];
        window[k] = new Proxy(T, {
          construct(t, args) {
            if (typeof args[0] === 'number') window.maxAlloc = Math.max(window.maxAlloc, args[0]);
            return Reflect.construct(t, args);
          },
        });
      }
    });
  });
  const casos = [
    ['cortado.gif', {}, 'gif'],
    ['gigante.gif', {maxPixels: 90e6}, 'pixels'],
    ['gigante.gif', {}, 'pixels'],
    ['rect-gigante.gif', {}, 'gif'],
    ['lzw-invalido.gif', {}, 'gif'],
    ['miles.gif', {reject: 300, maxPixels: 90e6}, 'frames'],
    ['miles.gif', {maxPixels: 90e6}, 'pixels'],
  ];
  for (const [name, opts, err] of casos)
    test(`${name} ${JSON.stringify(opts)} falla con «${err}» sin reservar memoria de más`, async ({page}) => {
      await open(page);
      const r = await page.evaluate(
        async ([bytes, opts]) => {
          await loadScript('js/gif-decoder.js');
          window.maxAlloc = 0;
          const t = performance.now();
          let msg = 'sin error';
          try {
            MoonGif.decodeGif(new Uint8Array(bytes).buffer, opts);
          } catch (e) {
            msg = e.message;
          }
          return {msg, ms: performance.now() - t, alloc: window.maxAlloc};
        },
        [fixture(name), opts],
      );
      expect(r.msg).toBe(err);
      expect(r.ms).toBeLessThan(500);
      expect(r.alloc).toBeLessThanOrEqual(5e6);
    });

  test('un cuadro que sale de la pantalla lógica se recorta igual que con ImageDecoder', async ({page}) => {
    await open(page);
    const r = await compare(page, fixture('fuera.gif'));
    expect(r).toMatchObject({n: 12, count: 12, frames: 12, size: [64, 48]});
    expect(r.diffs).toEqual(Array(12).fill(0));
  });
});
