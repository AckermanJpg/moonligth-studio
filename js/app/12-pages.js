// Pages
function goPage(i) {
  if (i < 0 || i >= S.pages.length) return;
  if (editing) endEdit();
  S.cur = i;
  S.sel = [];
  refresh({props: true, panel: S.tab === 'pages'});
}
function addPage(dupe) {
  touch(true);
  const p = dupe ? JSON.parse(JSON.stringify(pg())) : newPage(JSON.parse(JSON.stringify(pg().bg)));
  if (dupe) p.els.forEach(e => (e.id = 'e' + uid++));
  S.pages.splice(S.cur + 1, 0, p);
  S.cur++;
  S.sel = [];
  refresh({props: true, panel: true});
}
function delPage() {
  if (S.pages.length < 2) {
    toast('Debe quedar al menos una página');
    return;
  }
  touch(true);
  S.pages.splice(S.cur, 1);
  S.cur = Math.min(S.cur, S.pages.length - 1);
  S.sel = [];
  refresh({props: true, panel: true});
}
function movePage(d) {
  const j = S.cur + d;
  if (j < 0 || j >= S.pages.length) return;
  touch(true);
  [S.pages[S.cur], S.pages[j]] = [S.pages[j], S.pages[S.cur]];
  S.cur = j;
  refresh({panel: true});
}
