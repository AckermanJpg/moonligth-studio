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

const tono = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255),
    mx = Math.max(r, g, b),
    d = mx - Math.min(r, g, b);
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

test('en temporada no hay un segundo acento cálido: --gold pasa a la familia morada', async ({page}) => {
  for (const [fecha, activo] of [
    ['2026-10-31T12:00:00-06:00', true],
    ['2026-06-10T12:00:00-06:00', false],
  ]) {
    await page.clock.setFixedTime(new Date(fecha));
    await open(page);
    const gold = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
    if (activo) {
      expect(tono(gold)).toBeGreaterThanOrEqual(240);
      expect(tono(gold)).toBeLessThanOrEqual(300);
    } else expect(gold).toBe('#ffd84a');
  }
});

test('la vista previa «?» del inicio usa los colores del tema y fuera de temporada no cambia', async ({page}) => {
  for (const [fecha, activo] of [
    ['2026-10-31T12:00:00-06:00', true],
    ['2026-06-10T12:00:00-06:00', false],
  ]) {
    await page.clock.setFixedTime(new Date(fecha));
    await open(page);
    await page.click('[data-act="style:pixel"]');
    await page.click('[data-act="cat:pdf"]');
    const r = await page.evaluate(() => {
      const c = document.getElementById('sprev'),
        d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
        colores = new Set();
      for (let i = 0; i < d.length; i += 4) colores.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
      return {fondo: [...d.slice(0, 3)].join(), colores: [...colores]};
    });
    if (activo) {
      expect(r.fondo).toBe('59,29,122');
      expect(r.colores).toContain('255,140,26');
      expect(r.colores).not.toContain('63,224,255');
    } else {
      expect(r.fondo).toBe('11,42,138');
      expect(r.colores).toContain('63,224,255');
    }
    await page.evaluate(() => localStorage.clear());
  }
});
