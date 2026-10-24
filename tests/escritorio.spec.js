const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test.use({viewport: {width: 1440, height: 900}});

test('en escritorio la barra superior muestra todo y no aparece el menú Más', async ({page}) => {
  await open(page);
  await createProject(page);
  await expect(page.locator('#more-btn')).toBeHidden();
  for (const id of [
    '#home-btn',
    '#name',
    '#sizechip',
    '#undo',
    '#redo',
    '#help-btn',
    '#present-btn',
    '#save-btn',
    '#export-btn',
  ]) {
    await expect(page.locator(id), id).toBeVisible();
  }
  await expect(page.locator('#undo')).toContainText('Deshacer');
  await expect(page.locator('#redo')).toContainText('Rehacer');
});
