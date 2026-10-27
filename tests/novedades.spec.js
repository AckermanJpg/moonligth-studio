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
