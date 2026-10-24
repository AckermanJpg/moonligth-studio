const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');
const globals = require('globals');
const espree = require('espree');

const raiz = path.join(__dirname, 'js');
const archivos = [
  ...fs.readdirSync(raiz).map(f => path.join(raiz, f)),
  ...fs.readdirSync(path.join(raiz, 'app')).map(f => path.join(raiz, 'app', f)),
].filter(f => f.endsWith('.js'));

function nombresDe(patron) {
  const out = [];
  const ids = id => {
    if (id.type === 'Identifier') out.push(id.name);
    else if (id.type === 'ObjectPattern') id.properties.forEach(p => ids(p.value || p.argument));
    else if (id.type === 'ArrayPattern') id.elements.filter(Boolean).forEach(ids);
    else if (id.type === 'AssignmentPattern') ids(id.left);
    else if (id.type === 'RestElement') ids(id.argument);
  };
  ids(patron);
  return out;
}

function declaradas(stmts, nombres) {
  for (const s of stmts) {
    if (s.type === 'VariableDeclaration') s.declarations.forEach(d => nombres.push(...nombresDe(d.id)));
    else if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') nombres.push(s.id.name);
    else if (s.type === 'ExpressionStatement') exportadas(s.expression, nombres);
  }
}

function exportadas(e, nombres) {
  if (
    e.type === 'AssignmentExpression' &&
    e.left.type === 'MemberExpression' &&
    e.left.object.name === 'window'
  )
    nombres.push(e.left.property.name);
  const asigna =
    e.type === 'CallExpression' &&
    e.callee.type === 'MemberExpression' &&
    e.callee.object.name === 'Object' &&
    e.callee.property.name === 'assign' &&
    e.arguments[0] &&
    e.arguments[0].name === 'window' &&
    e.arguments[1] &&
    e.arguments[1].type === 'ObjectExpression';
  if (asigna) e.arguments[1].properties.forEach(p => nombres.push(p.key.name));
}

const compartidas = [];
for (const f of archivos) {
  const ast = espree.parse(fs.readFileSync(f, 'utf8'), {ecmaVersion: 2022, sourceType: 'script'});
  declaradas(ast.body, compartidas);
  for (const s of ast.body) {
    const llamada =
      s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' ? s.expression.callee : null;
    if (llamada && /FunctionExpression/.test(llamada.type) && llamada.body.type === 'BlockStatement') {
      for (const t of llamada.body.body)
        if (t.type === 'ExpressionStatement') exportadas(t.expression, compartidas);
    }
  }
}

module.exports = [
  {
    files: ['js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {...globals.browser, ...Object.fromEntries(compartidas.map(n => [n, 'writable']))},
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-redeclare': ['error', {builtinGlobals: false}],
    },
  },
];
