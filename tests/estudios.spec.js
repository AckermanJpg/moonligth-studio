const {test, expect} = require('@playwright/test');
const {FILE_URL, open, createProject} = require('./helpers');

const PESADOS = ['print-tools.js', 'print-studio.js', 'gif-encoder.js', 'gif-decoder.js', 'gif-studio.js'];

test('al cargar no se piden los módulos de póster, separar piezas y GIF', async ({page}) => {
  const pedidas = [];
  page.on('request', r => pedidas.push(r.url()));
  await open(page);
  await createProject(page);
  for (const f of PESADOS)
    expect(
      pedidas.some(u => u.endsWith(f)),
      f,
    ).toBe(false);
});

for (const [nombre, url] of [
  ['http', '/index.html'],
  ['file://', FILE_URL],
]) {
  test.describe(`bajo demanda por ${nombre}`, () => {
    test('Póster en hojas, Separar piezas y Crear GIF abren su estudio', async ({page}) => {
      const problems = await open(page, url);
      await createProject(page);
      for (const [pestana, estudio, selector] of [
        ['poster', 'poster', '#st-file'],
        ['split', 'split', '#st-file'],
        ['gif', 'gif', '#gif-file'],
      ]) {
        await page.click(`#rail [data-tab="${pestana}"]`);
        await page.click(`[data-studio="${estudio}"]`);
        await expect(page.locator('#modal')).toHaveClass(/on/);
        await expect(page.locator(selector)).toBeAttached();
        await page.keyboard.press('Escape');
        await expect(page.locator('#modal')).not.toHaveClass(/on/);
      }
      expect(problems).toEqual([]);
    });

    test('Trabajar con un video desde el inicio abre el estudio de GIF', async ({page}) => {
      const problems = await open(page, url);
      await page.click('[data-act="style:normal"]');
      await page.click('[data-act="cat:clip"]');
      await expect(page.locator('#gif-file')).toBeAttached();
      await expect(page.locator('#modal')).toHaveClass(/on/);
      expect(problems).toEqual([]);
    });
  });
}
