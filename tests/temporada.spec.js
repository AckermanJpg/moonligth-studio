const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test.use({timezoneId: 'America/Mexico_City'});

const FECHAS = [
  ['2026-10-14T23:59:00-06:00', false],
  ['2026-10-15T00:00:00-06:00', true],
  ['2026-10-31T12:00:00-06:00', true],
  ['2026-11-02T23:59:00-06:00', true],
  ['2026-11-03T00:00:00-06:00', false],
];

const tema = page =>
  page.evaluate(() => ({
    temporada: document.documentElement.dataset.temporada || null,
    acento: getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim(),
    murcielagos: MoonStars.bats.length,
    luna: !!MoonStars.moon,
  }));

for (const [fecha, activo] of FECHAS) {
  test(`el tema de Halloween ${activo ? 'aparece' : 'no aparece'} el ${fecha.slice(0, 16)} (hora local)`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date(fecha));
    const problemas = await open(page);
    const t = await tema(page);
    if (activo) {
      expect(t.temporada).toBe('halloween');
      expect(t.acento).not.toBe('#3fe0ff');
      expect(t.murcielagos).toBeGreaterThan(0);
      expect(t.luna).toBe(true);
    } else {
      expect(t).toEqual({temporada: null, acento: '#3fe0ff', murcielagos: 0, luna: false});
    }
    expect(problemas).toEqual([]);
  });
}

async function controles(page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        'button, a[href], input, select, textarea, [role="switch"], [role="checkbox"], [role="menuitem"], [tabindex]',
      ),
    ]
      .filter(e => e.getClientRects().length)
      .map(e =>
        [
          e.tagName,
          e.id,
          e.getAttribute('type') || '',
          e.getAttribute('aria-label') || '',
          e.getAttribute('title') || '',
          e.textContent.trim().slice(0, 40),
        ].join('|'),
      )
      .sort(),
  );
}

test('el tema no agrega ningún control para apagarlo, ni en el inicio ni en el editor', async ({page}) => {
  const vistas = {};
  for (const fecha of ['2026-10-14T12:00:00-06:00', '2026-10-28T12:00:00-06:00']) {
    await page.clock.setFixedTime(new Date(fecha));
    await open(page);
    const inicio = await controles(page);
    await createProject(page, {style: 'pixel'});
    const editor = await controles(page);
    await page.click('#news-bar');
    const novedades = await controles(page);
    vistas[fecha.slice(0, 10)] = {inicio, editor, novedades};
    await page.evaluate(() => localStorage.clear());
  }
  expect(vistas['2026-10-28'].inicio).toEqual(vistas['2026-10-14'].inicio);
  expect(vistas['2026-10-28'].editor).toEqual(vistas['2026-10-14'].editor);
  expect(vistas['2026-10-28'].novedades).toEqual(vistas['2026-10-14'].novedades);
});

test('solo js/temporada.js escribe el tema y nada lo guarda ni lo quita', async () => {
  const raiz = path.join(__dirname, '..', 'js');
  const archivos = fs
    .readdirSync(raiz, {recursive: true})
    .filter(f => f.endsWith('.js'))
    .map(f => [f.split(path.sep).join('/'), fs.readFileSync(path.join(raiz, f), 'utf8')]);
  const escriben = archivos.filter(([, t]) =>
    /dataset\.temporada\s*=(?!=)|setAttribute\(\s*'data-temporada'/.test(t),
  );
  expect(escriben.map(([f]) => f)).toEqual(['temporada.js']);
  const quitan = archivos.filter(([, t]) =>
    /delete [^;]*\.temporada|removeAttribute\(\s*'data-temporada'/.test(t),
  );
  expect(quitan).toEqual([]);
  const guardan = archivos.filter(([, t]) =>
    /localStorage[^;\n]*temporada|temporada[^;\n]*localStorage/.test(t),
  );
  expect(guardan).toEqual([]);
});

test.describe('murciélagos y movimiento reducido', () => {
  test('con prefers-reduced-motion los murciélagos no se mueven y el fondo no se vuelve a dibujar', async ({
    page,
  }) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.clock.setFixedTime(new Date('2026-10-31T20:00:00-06:00'));
    await open(page);
    const antes = await page.evaluate(() => ({
      bats: MoonStars.bats.map(b => [b.x, b.y]),
      img: MoonStars.canvas.toDataURL(),
    }));
    expect(antes.bats.length).toBeGreaterThan(0);
    await page.waitForTimeout(900);
    const despues = await page.evaluate(() => ({
      bats: MoonStars.bats.map(b => [b.x, b.y]),
      img: MoonStars.canvas.toDataURL(),
    }));
    expect(despues).toEqual(antes);
  });

  test('sin movimiento reducido los murciélagos sí vuelan', async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-10-31T20:00:00-06:00'));
    await open(page);
    const pos = () => page.evaluate(() => MoonStars.bats.map(b => [b.x, b.y]));
    await page.waitForTimeout(200);
    const antes = await pos();
    await page.waitForTimeout(700);
    expect(await pos()).not.toEqual(antes);
  });
});
