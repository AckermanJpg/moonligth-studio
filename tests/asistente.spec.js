const {test, expect} = require('@playwright/test');
const {open, createProject, cspViolations} = require('./helpers');

for (const style of ['normal', 'pixel']) {
  test(`asistente en estilo ${style}: crea el proyecto y aplica una plantilla`, async ({page}) => {
    const problems = await open(page);
    await createProject(page, {style, cat: 'social'});
    expect(await page.evaluate(() => [S.active, S.w, S.h])).toEqual([true, 1080, 1080]);

    await page.click('#rail [data-tab="templates"]');
    await page.click(`#panel [data-style="${style}"]`);
    const cards = page.locator('#tpls [data-tpl]');
    expect(await cards.count()).toBeGreaterThan(0);
    await cards.first().click();
    await expect.poll(() => page.evaluate(() => S.pages[S.cur].els.length)).toBeGreaterThan(0);

    expect(problems).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });
}
