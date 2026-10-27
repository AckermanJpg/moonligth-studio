const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

const NEWS_KEY = 'moonlight-news-v1';

async function conEstado(page, estado) {
  await page.addInitScript(
    ([k, v]) => {
      if (!sessionStorage.getItem('sembrado')) {
        localStorage.setItem(k, JSON.stringify(v));
        sessionStorage.setItem('sembrado', '1');
      }
    },
    [NEWS_KEY, estado],
  );
}

const notasDeLaVentana = page =>
  page.evaluate(() => ({
    titulos: [...document.querySelectorAll('#mbox h4')].map(h => h.textContent),
    notas: [...document.querySelectorAll('#mbox ul')].map(ul => [...ul.children].map(li => li.textContent)),
    texto: document.querySelector('#mbox').textContent,
  }));

test('el botón Novedades del inicio abre solo las notas sencillas de todas las versiones', async ({page}) => {
  const problemas = await open(page);
  const boton = page.locator('#home [data-act="news"]');
  await expect(boton).toBeVisible();
  await boton.click();
  await expect(page.locator('#modal')).toHaveClass(/\bon\b/);
  await expect(page.locator('#mbox h3')).toHaveText('Novedades');
  const r = await notasDeLaVentana(page),
    datos = await page.evaluate(() => MoonNews);
  expect(r.titulos.length).toBe(datos.length);
  datos.forEach((d, i) => expect(r.titulos[i]).toContain(d.v));
  expect(r.notas).toEqual(datos.map(d => d.notes));
  expect(r.texto).not.toMatch(/\b[0-9a-f]{7}\b|CHANGELOG|IndexedDB|`/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).not.toHaveClass(/\bon\b/);
  await expect(boton).toBeFocused();
  expect(problemas).toEqual([]);
});

test('con una versión sin leer, Novedades lleva punto y lo dice en su aria-label hasta que se abren las notas', async ({
  page,
}) => {
  await conEstado(page, {aviso: '1.1.0', leido: '1.1.0'});
  await open(page);
  const boton = page.locator('#home [data-act="news"]');
  await expect(boton).toHaveClass(/\bunread\b/);
  await expect(boton).toHaveAttribute('aria-label', 'Novedades: hay una versión nueva sin leer');
  await boton.click();
  await page.click('#xclose');
  await expect(boton).not.toHaveClass(/\bunread\b/);
  await expect(boton).toHaveAccessibleName('Novedades');
  await page.reload();
  await page.waitForSelector('#home.on');
  await expect(page.locator('#home [data-act="news"]')).not.toHaveClass(/\bunread\b/);
});

test('en el editor, Novedades está en la barra inferior, lleva el punto y abre las notas, sin tocar la barra superior', async ({
  page,
}) => {
  await conEstado(page, {aviso: '1.1.0', leido: '1.1.0'});
  await open(page);
  await createProject(page);
  const boton = page.locator('#bar #news-bar');
  await expect(boton).toBeVisible();
  await expect(page.locator('#news-btn')).toBeHidden();
  await expect(boton).toHaveClass(/\bunread\b/);
  await expect(boton).toHaveAttribute('aria-label', 'Novedades: hay una versión nueva sin leer');
  await boton.click();
  await expect(page.locator('#mbox h3')).toHaveText('Novedades');
  await page.click('#xclose');
  await expect(boton).not.toHaveClass(/\bunread\b/);
  await expect(boton).toHaveAccessibleName('Novedades');
});

const aviso = page => page.locator('#news-note');
const recargar = async page => {
  await page.reload();
  await page.waitForSelector('#home.on');
  await page.waitForTimeout(800);
};

test.describe('aviso al abrir después de una actualización', () => {
  test('en la primera visita no sale el aviso ni el punto, y se guarda la versión actual', async ({page}) => {
    await open(page);
    await page.waitForTimeout(800);
    await expect(aviso(page)).toBeHidden();
    await expect(page.locator('#home [data-act="news"]')).not.toHaveClass(/\bunread\b/);
    const actual = await page.evaluate(() => MoonNews[0].v);
    expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), NEWS_KEY)).toEqual({
      aviso: actual,
      leido: actual,
    });
    await recargar(page);
    await expect(aviso(page)).toBeHidden();
  });

  test('con un autoguardado de antes sale una vez, sin robar el foco, y el punto sigue hasta leer', async ({
    page,
  }) => {
    await open(page);
    await createProject(page);
    await page.waitForFunction(k => localStorage.getItem(k), 'moonlight-studio-v1');
    await page.evaluate(k => localStorage.removeItem(k), NEWS_KEY);
    await page.reload();
    await page.waitForSelector('#home.on');
    await expect(aviso(page)).toBeVisible();
    await expect(aviso(page)).toHaveAttribute('role', 'status');
    await expect(aviso(page)).toContainText(await page.evaluate(() => MoonNews[0].v));
    expect(
      await page.evaluate(() => document.getElementById('news-note').contains(document.activeElement)),
    ).toBe(false);
    await expect(page.locator('#home [data-act="news"]')).toHaveClass(/\bunread\b/);
    await recargar(page);
    await expect(aviso(page)).toBeHidden();
    await expect(page.locator('#home [data-act="news"]')).toHaveClass(/\bunread\b/);
  });

  test('con solo imágenes en IndexedDB también cuenta como visita previa', async ({page}) => {
    await open(page);
    await page.evaluate(async k => {
      await vault.putAll([['iprueba', new Blob(['x'], {type: 'image/png'})]]);
      localStorage.removeItem(k);
    }, NEWS_KEY);
    await page.reload();
    await page.waitForSelector('#home.on');
    await expect(aviso(page)).toBeVisible();
  });

  test('con una versión anterior guardada sale el aviso y Escape lo cierra sin mover el foco', async ({
    page,
  }) => {
    await conEstado(page, {aviso: '1.1.0', leido: '1.1.0'});
    await open(page);
    await expect(aviso(page)).toBeVisible();
    const antes = await page.evaluate(() => document.activeElement.outerHTML.slice(0, 80));
    await page.keyboard.press('Escape');
    await expect(aviso(page)).toBeHidden();
    expect(await page.evaluate(() => document.activeElement.outerHTML.slice(0, 80))).toBe(antes);
    await recargar(page);
    await expect(aviso(page)).toBeHidden();
  });

  test('se cierra solo', async ({page}) => {
    test.setTimeout(30000);
    await conEstado(page, {aviso: '1.1.0', leido: '1.1.0'});
    await open(page);
    await expect(aviso(page)).toBeVisible();
    await expect(aviso(page)).toBeHidden({timeout: 13000});
  });

  test('«Ver novedades» abre las notas, quita el punto y cierra el aviso', async ({page}) => {
    await conEstado(page, {aviso: '1.1.0', leido: '1.1.0'});
    await open(page);
    await aviso(page).getByRole('button', {name: 'Ver novedades'}).click();
    await expect(page.locator('#mbox h3')).toHaveText('Novedades');
    await expect(aviso(page)).toBeHidden();
    await page.click('#xclose');
    await expect(page.locator('#home [data-act="news"]')).not.toHaveClass(/\bunread\b/);
  });
});
