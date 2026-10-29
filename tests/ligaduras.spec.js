const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test('el inicio no une «fi» en un glifo: «filtros» se dibuja letra por letra', async ({page}) => {
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#home .hfacts small')].find(s =>
        s.textContent.includes('filtros'),
      ),
      nodo = [...el.childNodes].find(n => n.nodeType === 3 && n.data.includes('filtros')),
      i = nodo.data.indexOf('filtros'),
      rango = document.createRange();
    rango.setStart(nodo, i);
    rango.setEnd(nodo, i + 2);
    const real = rango.getBoundingClientRect().width,
      sonda = modo => {
        const s = document.createElement('span');
        s.textContent = 'fi';
        s.style.setProperty('font-variant-ligatures', modo, 'important');
        el.append(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
    return {
      fuente: getComputedStyle(el).fontFamily,
      estilo: getComputedStyle(el).fontVariantLigatures,
      real,
      unidas: sonda('common-ligatures'),
      separadas: sonda('none'),
    };
  });
  expect(r.fuente).toContain('Pixelify Sans');
  expect(r.unidas).not.toBeCloseTo(r.separadas, 1);
  expect(r.real).toBeCloseTo(r.separadas, 1);
  expect(r.estilo).toBe('none');
});

test('el atajo font: no vuelve a activar las ligaduras en la interfaz', async ({page}) => {
  await open(page);
  const r = await page.evaluate(() => {
    const p = document.createElement('p');
    p.style.font = '700 20px "Pixelify Sans"';
    p.textContent = 'filtros';
    document.body.append(p);
    const v = [p, ...document.querySelectorAll('#home *, .btn, h4')].map(
      n => getComputedStyle(n).fontVariantLigatures,
    );
    p.remove();
    return [...new Set(v)];
  });
  expect(r).toEqual(['none']);
});

test('el texto de los diseños en el lienzo conserva las ligaduras, igual que la descarga', async ({page}) => {
  await open(page);
  await createProject(page);
  const r = await page.evaluate(async () => {
    await document.fonts.load('400 40px "Pixelify Sans"');
    const e = mk('text', {text: 'fi', x: 0, y: 0, w: 400, h: 60, size: 40, font: 'Pixelify Sans', ls: 0});
    pg().els.push(e);
    refresh({});
    const t = $(`#page .el[data-id="${e.id}"] .txt`),
      rango = document.createRange();
    rango.selectNodeContents(t);
    const x = cv(1, 1).getContext('2d');
    x.font = '400 40px "Pixelify Sans"';
    return {
      estilo: getComputedStyle(t).fontVariantLigatures,
      lienzo: rango.getBoundingClientRect().width / S.zoom,
      descarga: x.measureText('fi').width,
      separadas: x.measureText('f').width + x.measureText('i').width,
    };
  });
  expect(r.estilo).toBe('normal');
  expect(r.descarga).not.toBeCloseTo(r.separadas, 0);
  expect(r.lienzo).toBeCloseTo(r.descarga, 0);
});
