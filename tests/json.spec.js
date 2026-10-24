const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const valido = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'proyecto-valido.json'), 'utf8'));
const clon = () => JSON.parse(JSON.stringify(valido));

const casos = [
  [
    'un sprite inexistente',
    o => (o.pages[0].els[0] = {...o.pages[0].els[0], type: 'sprite', spr: 'no-existe'}),
  ],
  ['w = 999999', o => (o.w = 999999)],
  ['pages vacío', o => (o.pages = [])],
];

async function cargar(page, o) {
  await page.click('#rail [data-tab="export"]');
  await page.click('#cvprev');
  await page.fill('#xjson', JSON.stringify(o));
  await page.click('#xload');
}

for (const [nombre, rompe] of casos) {
  test(`Cargar JSON rechaza ${nombre}`, async ({page}) => {
    await open(page);
    await createProject(page);
    const antes = await page.evaluate(() => S.pages[0].els.length);
    const o = clon();
    rompe(o);
    await cargar(page, o);
    await expect(page.locator('#toast')).toContainText('JSON inválido');
    expect(await page.evaluate(() => S.pages[0].els.length)).toBe(antes);
    await expect(page.locator('#modal')).toHaveClass(/on/);
  });
}

test('Cargar JSON acepta un proyecto válido', async ({page}) => {
  await open(page);
  await createProject(page);
  await cargar(page, valido);
  await expect(page.locator('#toast')).toContainText('Proyecto cargado');
  expect(await page.evaluate(() => [S.name, S.pages[0].els.length])).toEqual([
    valido.name,
    valido.pages[0].els.length,
  ]);
});
