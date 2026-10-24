const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function stubFonts(page) {
  await page.route('https://fonts.googleapis.com/**', route =>
    route.fulfill({status: 200, contentType: 'text/css', body: ''}),
  );
  await page.route('https://fonts.gstatic.com/**', route => route.fulfill({status: 200, body: ''}));
}

async function watch(page) {
  const problems = [];
  page.on('console', m => {
    if (['error', 'warning'].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return problems;
}

async function open(page, url = '/index.html') {
  await stubFonts(page);
  const problems = await watch(page);
  await page.goto(url);
  await page.waitForSelector('#home.on');
  return problems;
}

async function createProject(page, {style = 'normal', cat = 'social'} = {}) {
  await page.click(`[data-act="style:${style}"]`);
  await page.click(`[data-act="cat:${cat}"]`);
  for (let i = 0; i < 5; i++) {
    const create = page.locator('[data-act="create"]');
    if (await create.count()) {
      await create.click();
      const again = page.locator('#home.on [data-act="create"]');
      if (await again.count()) await again.click();
      break;
    }
    await page.click('[data-act="next"]');
  }
  await page.waitForFunction(() => !document.getElementById('home').classList.contains('on'));
}

async function cspViolations(page) {
  return page.evaluate(() => window.__csp);
}

module.exports = {FILE_URL, open, createProject, cspViolations, stubFonts, watch};
