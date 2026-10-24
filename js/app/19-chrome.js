// Refresh / chrome
function refresh(o) {
  if (o.fit || S.fit) fitZoom();
  renderStage();
  if (o.panel) renderPanel();
  if (o.props) renderProps();
  else {
    syncProps();
    updLayers();
  }
  updHist();
  scheduleSave();
}
function updLayers() {
  $$('#props .layer').forEach(l => l.classList.toggle('on', S.sel.includes(l.dataset.layer)));
}
$('#undo').onclick = undo;
$('#redo').onclick = redo;
$('#name').addEventListener('input', e => {
  S.name = e.target.value;
  scheduleSave();
});
$('#save-btn').onclick = () => save(true);
$('#export-btn').onclick = () => {
  S.tab = 'export';
  renderRail();
  renderPanel();
};
$('#present-btn').onclick = openPresent;
$('#pprev').onclick = () => goPage(S.cur - 1);
$('#pnext').onclick = () => goPage(S.cur + 1);
$('#padd').onclick = () => addPage();
$('#zin').onclick = () => setZoom(S.zoom * 1.2);
$('#zout').onclick = () => setZoom(S.zoom / 1.2);
$('#zfit').onclick = () => {
  S.fit = true;
  fitZoom();
  renderStage();
};
$('#tgrid').onclick = () => {
  S.grid = !S.grid;
  refresh({props: !S.sel.length});
};
$('#tsnap').onclick = () => {
  S.snap = !S.snap;
  refresh({props: !S.sel.length});
};
addEventListener('resize', () => {
  if (S.fit) {
    fitZoom();
    renderStage();
  }
});
addEventListener('keydown', ev => {
  const tg = ev.target,
    typing = /input|textarea|select/i.test(tg.tagName) || tg.isContentEditable;
  if (ev.key === 'Escape' && S.pickCb) {
    S.pickCb = null;
    pageEl.classList.remove('picking');
    toast('Cuentagotas cancelado');
    return;
  }
  if (ev.key === 'Escape' && S.draw.mode) {
    setDrawMode(null);
    return;
  }
  if (ev.key === 'Escape') {
    if ($('#present').classList.contains('on')) {
      $('#present').classList.remove('on');
      return;
    }
    if ($('#modal').classList.contains('on')) {
      $('#modal').classList.remove('on');
      return;
    }
    if (editing) {
      endEdit();
      return;
    }
    if (!typing) {
      S.sel = [];
      refresh({props: true});
    }
    return;
  }
  if ($('#present').classList.contains('on')) {
    if (ev.key === 'ArrowRight') {
      presIdx = (presIdx + 1) % S.pages.length;
      showPres();
    }
    if (ev.key === 'ArrowLeft') {
      presIdx = (presIdx - 1 + S.pages.length) % S.pages.length;
      showPres();
    }
    return;
  }
  if (typing) return;
  const m = ev.ctrlKey || ev.metaKey,
    k = ev.key.toLowerCase();
  if (m && k === 'z') {
    ev.preventDefault();
    ev.shiftKey ? redo() : undo();
  } else if (m && k === 'y') {
    ev.preventDefault();
    redo();
  } else if (m && k === 'd') {
    ev.preventDefault();
    dup();
  } else if (m && k === 'c') copy();
  else if (m && k === 'v' && clip.length) {
    ev.preventDefault();
    paste();
  } else if (m && k === 'a') {
    ev.preventDefault();
    S.sel = els()
      .filter(e => !e.hidden)
      .map(e => e.id);
    refresh({props: true});
  } else if (m && k === 's') {
    ev.preventDefault();
    save(true);
  } else if (m && ev.key === ']') {
    ev.preventDefault();
    order(ev.shiftKey ? 'front' : 'up');
  } else if (m && ev.key === '[') {
    ev.preventDefault();
    order(ev.shiftKey ? 'back' : 'down');
  } else if (k === 'delete' || k === 'backspace') {
    ev.preventDefault();
    del();
  } else if (k.startsWith('arrow') && S.sel.length) {
    ev.preventDefault();
    const d = ev.shiftKey ? 10 : 1;
    touch();
    selEls().forEach(e => {
      if (e.locked) return;
      if (k === 'arrowleft') e.x -= d;
      if (k === 'arrowright') e.x += d;
      if (k === 'arrowup') e.y -= d;
      if (k === 'arrowdown') e.y += d;
    });
    refresh({});
    syncProps();
  }
});
const FOCUSABLE =
  'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const DIALOGS = [$('#present'), $('#modal'), $('#home')];
const focusables = d => $$(FOCUSABLE, d).filter(e => e.offsetParent !== null);
const topDialog = () => DIALOGS.find(d => d.classList.contains('on'));
const dialogObserver = new MutationObserver(list =>
  list.forEach(({target: d}) => {
    const on = d.classList.contains('on');
    if (on === !!d.opener) return;
    if (!on) {
      const back = d.opener;
      d.opener = null;
      if (back.isConnected) back.focus();
      return;
    }
    d.opener = document.activeElement;
    const box = d.id === 'modal' ? $('#mbox') : d,
      h = $('h2,h3', box);
    if (h && !box.hasAttribute('aria-labelledby')) box.setAttribute('aria-label', h.textContent);
    (focusables(d)[0] || d).focus();
  }),
);
DIALOGS.forEach(d => {
  d.opener = null;
  d.tabIndex = -1;
  dialogObserver.observe(d, {attributes: true, attributeFilter: ['class']});
});
addEventListener(
  'keydown',
  ev => {
    const d = topDialog();
    if (!d) return;
    if (ev.key === 'Escape' && d.id === 'home' && S.active) {
      ev.stopPropagation();
      closeHome();
    } else if (ev.key === 'Tab') {
      const f = focusables(d);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (i < 0 || (ev.shiftKey ? i === 0 : i === f.length - 1)) {
        ev.preventDefault();
        f[i < 0 || ev.shiftKey ? f.length - 1 : 0].focus();
      }
    }
  },
  true,
);
const topBar = $('#top'),
  moreBtn = $('#more-btn');
function setTopMenu(open) {
  topBar.classList.toggle('open', open);
  moreBtn.setAttribute('aria-expanded', open);
}
moreBtn.addEventListener('click', () => {
  const open = !topBar.classList.contains('open');
  setTopMenu(open);
  if (open) $('#home-btn').focus();
});
topBar.addEventListener('click', ev => {
  if (ev.target.closest('.menu-item button')) setTopMenu(false);
});
document.addEventListener('click', ev => {
  if (!ev.target.closest('#top')) setTopMenu(false);
});
addEventListener(
  'keydown',
  ev => {
    if (ev.key !== 'Escape' || !topBar.classList.contains('open')) return;
    ev.stopPropagation();
    setTopMenu(false);
    moreBtn.focus();
  },
  true,
);
