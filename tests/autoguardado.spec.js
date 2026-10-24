const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test('tras recargar aparece Continuar con el proyecto guardado', async ({page}) => {
  await open(page);
  await createProject(page);
  await page.click('#rail [data-tab="text"]');
  await page.locator('#panel [data-text]').first().click();
  await expect(page.locator('#savest')).toHaveText(/Guardado/);
  await page.reload();
  await page.waitForSelector('#home.on');
  await expect(page.locator('[data-act="continue"]')).toBeVisible();
});
