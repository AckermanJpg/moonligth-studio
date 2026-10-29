const path = require('path');
const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const SPRITES = ['pumpkin', 'bat', 'web', 'witchhat', 'candy', 'candle'];
const PLANTILLAS = [
  ['Post de Halloween', 'normal'],
  ['Fiesta de Halloween', 'normal'],
  ['Cartel de Halloween', 'pixel'],
  ['Insignia de Halloween (PNG)', 'pixel'],
];

test.use({timezoneId: 'America/Mexico_City'});

for (const fecha of ['2026-06-10T12:00:00-06:00', '2026-10-31T12:00:00-06:00']) {
  test.describe(`contenido de Halloween el ${fecha.slice(0, 10)}`, () => {
    test.beforeEach(async ({page}) => {
      await page.clock.setFixedTime(new Date(fecha));
    });

    test('los 6 sprites existen, tienen nombre para buscar y se agregan al lienzo', async ({page}) => {
      const problemas = await open(page);
      await createProject(page, {style: 'pixel'});
      await page.click('#rail [data-tab="elements"]');
      for (const k of SPRITES) {
        const info = await page.evaluate(k => {
          const r = SPR[k];
          return {
            filas: r && r.length,
            ancho: r && Math.max(...r.map(f => f.length)),
            llenos: r ? r.join('').split('X').length - 1 : 0,
            nombre: SPRN[k] || '',
          };
        }, k);
        expect(info.filas, k).toBeGreaterThanOrEqual(7);
        expect(info.ancho, k).toBeGreaterThanOrEqual(7);
        expect(info.llenos, k).toBeGreaterThan(10);
        expect(info.nombre, k).not.toBe('');
        const antes = await page.evaluate(() => els().length);
        await page.click(`#panel [data-sprite="${k}"]`);
        expect(await page.evaluate(() => els().at(-1).spr)).toBe(k);
        expect(await page.evaluate(() => els().length)).toBe(antes + 1);
      }
      expect(problemas).toEqual([]);
    });

    test('las 4 plantillas existen en su estilo y se aplican al lienzo', async ({page}) => {
      const problemas = await open(page);
      for (const estilo of ['normal', 'pixel']) {
        await createProject(page, {style: estilo});
        await page.click('#rail [data-tab="templates"]');
        for (const [nombre, est] of PLANTILLAS.filter(([, e]) => e === estilo)) {
          const i = await page.evaluate(n => TPL.findIndex(t => t.name === n), nombre);
          expect(i, nombre).toBeGreaterThanOrEqual(0);
          expect(await page.evaluate(i => tplStyle(TPL[i]), i)).toBe(est);
          await page.click(`#tpls [data-tpl="${i}"]`);
          const r = await page.evaluate(() => ({
            n: els().length,
            textos: els().filter(e => e.type === 'text').length,
          }));
          expect(r.n, nombre).toBeGreaterThanOrEqual(3);
          expect(r.textos, nombre).toBeGreaterThanOrEqual(1);
        }
        await page.evaluate(() => localStorage.clear());
        await page.goto('/index.html');
        await page.waitForSelector('#home.on');
      }
      expect(problemas).toEqual([]);
    });

    test('hay 2 combos de fondo de Halloween por estilo y se aplican', async ({page}) => {
      const COMBOS = {
        pixel: ['#140a2e,#ff8c1a', '#020821,#6a2c91'],
        normal: ['#ff7518,#5b21b6', '#111827,#f97316'],
      };
      const problemas = await open(page);
      for (const estilo of ['pixel', 'normal']) {
        await createProject(page, {style: estilo});
        await page.click('#rail [data-tab="bg"]');
        await page.evaluate(() => {
          pg().bg.pat = 'gradient';
          refresh({});
        });
        await page.click('#rail [data-tab="templates"]');
        await page.click('#rail [data-tab="bg"]');
        for (const combo of COMBOS[estilo]) {
          await page.click(`#panel [data-combo="${combo}"]`);
          expect(await page.evaluate(() => [pg().bg.c1, pg().bg.c2].join())).toBe(combo);
        }
        await page.evaluate(() => localStorage.clear());
        await page.goto('/index.html');
        await page.waitForSelector('#home.on');
      }
      expect(problemas).toEqual([]);
    });

    test('la paleta Halloween está en PALS y PALN y se aplica a una imagen', async ({page}) => {
      const problemas = await open(page);
      expect(await page.evaluate(() => [PALN.halloween, PALS.halloween && PALS.halloween.length])).toEqual([
        'Halloween',
        4,
      ]);
      await createProject(page, {style: 'pixel'});
      await page.click('#rail [data-tab="images"]');
      const antes = await page.evaluate(() => els().length);
      await page.setInputFiles('#file', path.join(__dirname, 'fixtures', 'opaca.png'));
      await page.waitForFunction(n => els().length > n, antes);
      await page.click('#props summary:has-text("Paleta y duotono")');
      await page.selectOption('#props select[data-f="pal"]', 'halloween');
      expect(await page.evaluate(() => els().at(-1).flt.pal)).toBe('halloween');
      expect(problemas).toEqual([]);
    });
  });
}
