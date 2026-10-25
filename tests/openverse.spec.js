const {test, expect} = require('@playwright/test');
const {open} = require('./helpers');

const leer = (page, alfa) =>
  page.evaluate(async alfa => {
    const c = document.createElement('canvas');
    c.width = 2000;
    c.height = 1000;
    const x = c.getContext('2d');
    x.fillStyle = '#3fe0ff';
    x.fillRect(0, 0, alfa ? 1000 : 2000, 1000);
    const b = await new Promise(r => c.toBlob(r, 'image/png'));
    const o = await readImage(b, 1600, 'image/webp');
    return [o.src.split(';')[0], o.w, o.h];
  }, alfa);

test.describe('readImage con formato de salida', () => {
  test('reduce a 1600 px y entrega WebP', async ({page}) => {
    await open(page);
    expect(await leer(page, false)).toEqual(['data:image/webp', 1600, 800]);
  });

  test.describe('en un navegador sin WebP', () => {
    test.beforeEach(async ({page}) => {
      await page.addInitScript(() => {
        const orig = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (t, q) {
          return orig.call(this, t === 'image/webp' ? 'image/png' : t, q);
        };
      });
      await open(page);
    });

    test('usa JPEG si la imagen es opaca', async ({page}) => {
      expect(await leer(page, false)).toEqual(['data:image/jpeg', 1600, 800]);
    });

    test('usa PNG si tiene píxeles transparentes', async ({page}) => {
      expect(await leer(page, true)).toEqual(['data:image/png', 1600, 800]);
    });
  });
});
