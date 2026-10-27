const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');

function novedades() {
  const sandbox = {window: {}};
  vm.runInNewContext(leer('js/novedades.js'), sandbox);
  return sandbox.window.MoonNews;
}

function changelog() {
  return leer('CHANGELOG.md')
    .split(/^## /m)
    .slice(1)
    .map(bloque => {
      const [, v, date] = bloque.match(/^\[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/),
        sencillas = bloque.split(/^### /m).find(s => s.startsWith('Para quien usa Moonlight'));
      return {
        v,
        date,
        notes: (sencillas || '')
          .split('\n')
          .filter(l => l.startsWith('- '))
          .map(l => l.slice(2)),
      };
    });
}

test('js/novedades.js y CHANGELOG.md tienen las mismas versiones, fechas y notas sencillas, en el mismo orden', () => {
  const pagina = novedades(),
    registro = changelog();
  expect(pagina.length).toBeGreaterThan(0);
  expect(pagina.map(n => n.v)).toEqual(registro.map(n => n.v));
  pagina.forEach((n, i) => {
    expect(n.date, n.v).toBe(registro[i].date);
    expect(n.notes, n.v).toEqual(registro[i].notes);
  });
});

test('las versiones van de la más nueva a la más vieja y cada una tiene notas', () => {
  const vs = novedades().map(n => n.v.split('.').map(Number));
  for (let i = 1; i < vs.length; i++) {
    const [a, b] = [vs[i - 1], vs[i]],
      k = a.findIndex((x, j) => x !== b[j]);
    expect(k, `${a.join('.')} antes que ${b.join('.')}`).toBeGreaterThanOrEqual(0);
    expect(a[k]).toBeGreaterThan(b[k]);
  }
  novedades().forEach(n => expect(n.notes.length, n.v).toBeGreaterThan(0));
});

test('el README dice cuál es la versión actual y enlaza el registro de cambios', () => {
  const readme = leer('README.md'),
    [actual] = novedades();
  expect(readme).toContain('## Versiones');
  expect(readme).toContain(`Versión actual: **${actual.v}** (${actual.date})`);
  expect(readme).toContain('(CHANGELOG.md)');
});
