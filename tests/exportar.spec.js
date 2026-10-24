const fs = require('fs');
const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test('exportar PNG descarga un archivo con contenido', async ({page}, info) => {
  await open(page);
  await createProject(page);
  await page.click('#rail [data-tab="templates"]');
  await page.locator('#tpls [data-tpl]').first().click();
  await page.click('#rail [data-tab="export"]');
  await page.click('[data-cvset="fmt:png"]');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#cvgo')]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const file = info.outputPath('exportado.png');
  await download.saveAs(file);
  const bytes = fs.readFileSync(file);
  expect(bytes.length).toBeGreaterThan(1000);
  expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
});
