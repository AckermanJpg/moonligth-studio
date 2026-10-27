const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {open, createProject} = require('./helpers');

const file = name => ({
  name,
  mimeType: name.endsWith('.gif') ? 'image/gif' : name.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
  buffer: fs.readFileSync(path.join(__dirname, 'fixtures', name)),
});

async function abrirEstudio(page) {
  await open(page);
  await createProject(page);
  await page.evaluate(() => openStudio(() => MoonGif.open()));
  await page.waitForSelector('#gif-file', {state: 'attached'});
}

const pistas = page => page.locator('#gif-clips .pinfo .hint').allTextContents();

test('el estudio de GIF lee un GIF animado y un video como clips', async ({page}) => {
  await abrirEstudio(page);
  await page.setInputFiles('#gif-file', [file('anim.gif'), file('transparencia.gif'), file('clip-10s.webm')]);
  await expect(page.locator('#gif-clips .piece')).toHaveCount(3);
  expect(await pistas(page)).toEqual([
    'GIF animado · 64 × 48 px · 1.2 s · 12 cuadros',
    'GIF animado · 80 × 60 px · 0.8 s · 8 cuadros',
    'Video · 160 × 90 px · 10 s',
  ]);
  expect(await page.locator('#gif-clips [data-gc="end"]').evaluateAll(l => l.map(i => i.value))).toEqual([
    '1.2',
    '0.8',
    '5',
  ]);
});

test('el estudio de GIF corta en 300 cuadros un GIF más largo, sin rechazarlo', async ({page}) => {
  await abrirEstudio(page);
  const bytes = await page.evaluate(async () => {
    const frames = [];
    for (let f = 0; f < 310; f++) {
      const data = new Uint8ClampedArray(8 * 8 * 4).fill(255);
      data[(f % 64) * 4] = 0;
      frames.push({data, delay: 0.05});
    }
    return [...new Uint8Array(await MoonGif.encode(frames, 8, 8, {dither: false}).arrayBuffer())];
  });
  await page.setInputFiles('#gif-file', {
    name: 'largo.gif',
    mimeType: 'image/gif',
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator('#gif-clips .piece')).toHaveCount(1);
  expect(await pistas(page)).toEqual(['GIF animado · 8 × 8 px · 15 s · 300 cuadros']);
});
