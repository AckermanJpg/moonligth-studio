const {test, expect} = require('@playwright/test');
const {open, createProject} = require('./helpers');

test.use({timezoneId: 'America/Mexico_City'});

function medir() {
  const parse = s => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const stops = s => (s.match(/rgba?\([^)]+\)/g) || []).map(parse);
  const sobre = (a, b) => {
    const k = a[3];
    return [a[0] * k + b[0] * (1 - k), a[1] * k + b[1] * (1 - k), a[2] * k + b[2] * (1 - k), 1];
  };
  const lum = c =>
    c
      .slice(0, 3)
      .map(v => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const razon = (a, b) => {
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const ESTRELLAS = [
    [255, 255, 255],
    [214, 248, 255],
    [159, 216, 255],
    [111, 180, 255],
  ];
  const estrella = (r, g, b) =>
    ESTRELLAS.some(e => Math.abs(e[0] - r) + Math.abs(e[1] - g) + Math.abs(e[2] - b) <= 6);
  const deco = [];
  if (window.MoonStars && document.getElementById('home').classList.contains('on')) {
    const c = MoonStars.canvas,
      d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
      vistos = new Set();
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const rgb = `${d[i]},${d[i + 1]},${d[i + 2]}`;
      if (estrella(d[i], d[i + 1], d[i + 2]) || vistos.has(rgb + ',' + d[i + 3])) continue;
      vistos.add(rgb + ',' + d[i + 3]);
      deco.push([d[i], d[i + 1], d[i + 2], d[i + 3] / 255]);
    }
  }
  const capas = el => {
    const L = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const capa = {img: cs.backgroundImage.includes('url('), colores: []};
      const bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0) capa.colores.push(bg);
      const g = cs.backgroundImage.includes('gradient') ? stops(cs.backgroundImage) : [];
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(n, pseudo);
        if (ps.content !== 'none' && ps.backgroundImage.includes('gradient') && ps.zIndex !== '-1')
          g.push(...stops(ps.backgroundImage).filter(c => c[3] > 0));
      }
      capa.grad = g;
      capa.home = n.id === 'home';
      L.push(capa);
      if (bg && bg[3] === 1 && !g.length) break;
    }
    return L;
  };
  const fondos = el => {
    const L = capas(el).reverse();
    let fs = [[255, 255, 255, 1]];
    for (const c of L) {
      if (c.img) return null;
      let base = fs;
      if (c.colores.length)
        base = [...new Set(fs.map(f => sobre(c.colores[0], f).join()))].map(s => s.split(',').map(Number));
      if (c.grad.length) {
        const mix = [];
        for (const f of base) {
          mix.push(f);
          for (const g of c.grad) mix.push(sobre(g, f));
        }
        base = mix;
      }
      if (c.home) base = [...base, ...base.flatMap(f => deco.map(d => sobre(d, f)))];
      fs = [...new Set(base.map(f => f.map(v => Math.round(v)).join()))].map(s => s.split(',').map(Number));
      if (fs.length > 64) fs = fs.slice(0, 64);
    }
    return fs;
  };
  const opacidad = el => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
    return o;
  };
  const visible = el => {
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) return !el.closest('#home:not(.on)');
    const arriba = document.elementFromPoint(cx, cy);
    return !!arriba && (el.contains(arriba) || arriba.contains(el));
  };
  const fallas = [],
    vistos = new Set();
  const textos = [...document.querySelectorAll('body *')].filter(
    el =>
      !el.closest('#stage, svg, canvas, [inert]') &&
      !el.closest(':disabled, [aria-disabled="true"]') &&
      (([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && el.tagName !== 'OPTION') ||
        (el.tagName === 'INPUT' &&
          !['color', 'range', 'checkbox', 'radio', 'file', 'hidden'].includes(el.type)) ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA') &&
      visible(el),
  );
  for (const el of textos) {
    const cs = getComputedStyle(el),
      fs = fondos(el);
    if (!fs) continue;
    const c = parse(cs.color);
    c[3] *= opacidad(el);
    const px = parseFloat(cs.fontSize),
      grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700),
      min = grande ? 3 : 4.5;
    const peor = Math.min(...fs.map(f => razon(sobre(c, f), f)));
    if (peor < min) {
      const clave = `${el.tagName}#${el.id}.${el.className}|${cs.color}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      fallas.push(
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''} «${(el.textContent || el.value || '').trim().slice(0, 30)}» ${peor.toFixed(2)} < ${min}`,
      );
    }
  }
  return {fallas, revisados: textos.length, deco: deco.length};
}

async function revisar(page, nombre, todas) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(a => a.effect && a.effect.getComputedTiming().endTime !== Infinity)
        .map(a => a.finished.catch(() => {})),
    ),
  );
  const r = await page.evaluate(medir);
  expect(r.revisados, nombre).toBeGreaterThan(0);
  if (nombre.startsWith('inicio')) expect(r.deco, nombre).toBeGreaterThan(0);
  todas.push(...r.fallas.map(f => `${nombre}: ${f}`));
}

const PESTANAS = [
  'templates',
  'elements',
  'text',
  'images',
  'bg',
  'draw',
  'brand',
  'size',
  'export',
  'pages',
];

for (const [ancho, alto] of [
  [1440, 900],
  [375, 812],
]) {
  test(`el tema de Halloween cumple AA en toda la interfaz a ${ancho} px`, async ({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: ancho, height: alto});
    await page.clock.setFixedTime(new Date('2026-10-31T20:00:00-06:00'));
    await open(page);
    expect(await page.evaluate(() => document.documentElement.dataset.temporada)).toBe('halloween');
    const fallas = [];
    await revisar(page, 'inicio', fallas);
    await page.click('[data-act="style:pixel"]');
    await revisar(page, 'inicio con estilo', fallas);
    await page.click('[data-act="cat:social"]');
    await revisar(page, 'inicio con categoría', fallas);
    await page.click('[data-act="next"]');
    await revisar(page, 'inicio, paso 2', fallas);
    await page.click('#home [data-act="news"]');
    await revisar(page, 'novedades', fallas);
    await page.keyboard.press('Escape');
    await page.click('#home [data-act="help"]');
    await revisar(page, 'ayuda', fallas);
    await page.keyboard.press('Escape');
    await page.goto('/index.html');
    await page.waitForSelector('#home.on');
    for (const estilo of ['pixel', 'normal']) {
      await createProject(page, {style: estilo});
      await revisar(page, `editor ${estilo}`, fallas);
      for (const t of PESTANAS) {
        const tab = page.locator(`#rail [data-tab="${t}"]`);
        if (!(await tab.isVisible())) continue;
        await tab.click();
        await revisar(page, `editor ${estilo}, ${t}`, fallas);
      }
      await page.click('#rail [data-tab="templates"]');
      await page.locator('#tpls [data-tpl]').first().click();
      await page.evaluate(() => {
        S.sel = [els()[0].id];
        refresh({props: true});
      });
      await revisar(page, `editor ${estilo}, elemento elegido`, fallas);
      if (ancho <= 720) {
        await page.click('#more-btn');
        await revisar(page, `editor ${estilo}, Más`, fallas);
        await page.click('#more-btn');
      }
      await page.evaluate(() => localStorage.clear());
      await page.goto('/index.html');
      await page.waitForSelector('#home.on');
    }
    expect(fallas).toEqual([]);
  });
}

test('el medidor de contraste detecta un texto que no cumple', async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-10-31T20:00:00-06:00'));
  await open(page);
  const bien = await page.evaluate(medir);
  await page.addStyleTag({
    content: ':root[data-temporada="halloween"] { --ice: #3b1d7a; --white: #3b1d7a; }',
  });
  const mal = await page.evaluate(medir);
  expect(bien.fallas).toEqual([]);
  expect(mal.fallas.length).toBeGreaterThan(5);
});
