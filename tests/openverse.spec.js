const {test, expect} = require('@playwright/test');
const {FILE_URL, open, createProject, cspViolations} = require('./helpers');

const item = (id, o = {}) => ({
  id,
  title: `Foto ${id}`,
  creator: `Autora ${id}`,
  license: 'by',
  license_version: '4.0',
  license_url: 'https://creativecommons.org/licenses/by/4.0/',
  foreign_landing_url: `https://example.org/obra/${id}`,
  mature: false,
  ...o,
});

const RESPUESTAS = {
  gato: [
    [
      ...Array.from({length: 17}, (_, i) => item(`g${i + 1}`)),
      item('sa', {license: 'by-sa'}),
      item('adulto', {mature: true}),
      item('roto'),
    ],
    [item('h1'), item('h2'), item('h3', {license: 'cc0', license_version: '1.0'})],
  ],
  xss: [
    [
      item('x1', {
        title: '<img src=x onerror="window.__xss=1">',
        creator: '<b onmouseover="window.__xss=2">yo</b>',
        foreign_landing_url: 'javascript:window.__xss=3',
      }),
    ],
  ],
  nada: [[]],
};

async function jpeg(browser) {
  const p = await browser.newPage();
  const b64 = await p.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = '#ff3d8e';
    x.fillRect(0, 0, 2400, 1200);
    x.fillStyle = '#3fe0ff';
    x.fillRect(0, 0, 1200, 1200);
    return c.toDataURL('image/jpeg', 0.8).split(',')[1];
  });
  await p.close();
  return Buffer.from(b64, 'base64');
}

async function simular(page, foto) {
  const pedidas = [];
  await page.route('https://api.openverse.org/**', route => {
    const u = new URL(route.request().url());
    pedidas.push(u);
    const cors = {'access-control-allow-origin': '*'};
    if (u.pathname.endsWith('/thumb/')) {
      if (u.pathname.includes('/roto/')) return route.abort('failed');
      return route.fulfill({status: 200, headers: cors, contentType: 'image/jpeg', body: foto});
    }
    const q = u.searchParams.get('q');
    if (q === 'caida') return route.abort('internetdisconnected');
    if (q === 'limite') return route.fulfill({status: 429, headers: cors, body: '{}'});
    const pags = RESPUESTAS[q] || [[]],
      n = +u.searchParams.get('page');
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: 'application/json',
      body: JSON.stringify({
        result_count: pags.flat().length,
        page_count: pags.flat().length ? pags.length : 0,
        page: n,
        results: pags[n - 1] || [],
      }),
    });
  });
  return pedidas;
}

async function buscar(page, q) {
  await page.fill('#ovq', q);
  await page.press('#ovq', 'Enter');
}

async function preparar(page, foto, url) {
  const pedidas = await simular(page, foto);
  const problems = await open(page, url);
  await createProject(page);
  await page.click('#rail [data-tab="images"]');
  return {pedidas, problems};
}

const credito = page => page.evaluate(() => S.pages[S.cur].els.find(e => e.credit));

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

test.describe('buscador de Openverse', () => {
  let foto;
  test.beforeAll(async ({browser}) => {
    foto = await jpeg(browser);
  });

  test('no carga el módulo hasta la primera búsqueda', async ({page}) => {
    const scripts = [];
    page.on('request', r => scripts.push(r.url()));
    await preparar(page, foto);
    expect(scripts.some(u => u.endsWith('openverse.js'))).toBe(false);
    await buscar(page, 'gato');
    await expect(page.locator('#ovres .ovit').first()).toBeVisible();
    expect(scripts.some(u => u.endsWith('openverse.js'))).toBe(true);
  });

  test('busca con los filtros, descarta lo que no sirve y pide más resultados', async ({page}) => {
    const {pedidas, problems} = await preparar(page, foto);
    await buscar(page, 'gato');
    await page.locator('#ovres [data-ov="roto"]').scrollIntoViewIfNeeded();
    await expect(page.locator('#ovres .ovit')).toHaveCount(17);
    const p = pedidas.find(u => u.pathname === '/v1/images/').searchParams;
    expect(Object.fromEntries(p)).toEqual({
      q: 'gato',
      page: '1',
      page_size: '20',
      license: 'by,cc0,pdm',
      mature: 'false',
    });
    expect(await page.locator('#ovres [data-ov="sa"], #ovres [data-ov="adulto"]').count()).toBe(0);
    await expect(page.locator('#ovres img[src^="blob:"]').first()).toBeAttached();
    await page.click('[data-ovmore]');
    await expect(page.locator('#ovres .ovit')).toHaveCount(20);
    await expect(page.locator('#ovres [data-ov="h1"]')).toBeFocused();
    await expect(page.locator('[data-ovmore]')).toHaveCount(0);
    expect(problems).toEqual(['error: Failed to load resource: net::ERR_FAILED']);
    expect(await cspViolations(page)).toEqual([]);
  });

  for (const [q, texto] of [
    ['nada', 'No encontré imágenes libres'],
    ['caida', 'No se pudo conectar con Openverse'],
    ['limite', 'Llegaste al límite de búsquedas de Openverse; intenta en un minuto'],
  ]) {
    test(`muestra el estado de la búsqueda «${q}»`, async ({page}) => {
      await preparar(page, foto);
      await buscar(page, q);
      await expect(page.locator('#ovst')).toContainText(texto);
      await expect(page.locator('#ovst')).toHaveAttribute('role', 'status');
      await expect(page.locator('#ovres .ovit')).toHaveCount(0);
    });
  }

  test.describe('móvil 360px', () => {
    test.use({viewport: {width: 360, height: 800}, hasTouch: true, isMobile: true});

    test('los resultados caben sin desborde horizontal', async ({page}) => {
      await preparar(page, foto);
      await buscar(page, 'gato');
      await page.locator('#ovres [data-ov="roto"]').scrollIntoViewIfNeeded();
      await expect(page.locator('#ovres .ovit')).toHaveCount(17);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(0);
      const caja = await page.locator('#ovres .ovit').first().boundingBox();
      expect(caja.width).toBeGreaterThanOrEqual(44);
      expect(caja.x + caja.width).toBeLessThanOrEqual(360);
    });
  });
});
