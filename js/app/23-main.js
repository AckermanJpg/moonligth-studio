// Print studio bridge
(() => {
  Object.assign(window, {openStudio, openSearch});
  const hasWork = () => S.active && (S.pages.length > 1 || S.pages.some(p => p.els.length));
  const imagePage = (src, w, h, bg) => {
    const p = newPage(bg ? {pat: 'solid', c1: bg, c2: bg} : {pat: 'none', c1: '#ffffff', c2: '#ffffff'});
    p.els.push(mk('image', {src, x: 0, y: 0, w, h, px: 1}));
    return p;
  };
  function openProject(o, opt = {}) {
    const why = validateProject(o);
    if (why) {
      toast(`Proyecto inválido: ${why}`);
      return false;
    }
    savedInfo = null;
    S.name = o.name || 'Sin título';
    $('#name').value = S.name;
    S.w = clamp(o.w, 16, 5000);
    S.h = clamp(o.h, 16, 5000);
    S.pages = o.pages;
    S.cur = 0;
    S.sel = [];
    S.fit = true;
    S.active = true;
    S.tab = opt.tab || 'images';
    S.conv.fmt = opt.fmt || 'png';
    S.conv.pages = opt.all ? 'all' : 'cur';
    resetHistory();
    afterOpen();
    toast(`Proyecto abierto: ${S.name}`);
    return true;
  }
  function loadProjectJSON(js) {
    try {
      return openProject(JSON.parse(js), {tab: 'images'});
    } catch {
      return false;
    }
  }
  const loadScript = src =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error(src));
      document.head.append(s);
    });
  function mountStudios() {
    MoonGif.mount({
      esc,
      slug,
      hasWork,
      imagePage,
      openProject,
      cv,
      toast,
      saveFile,
      projectName: () => S.name,
      pageCanvases: async () => {
        await loadFonts();
        return S.pages.map(p => renderPageCanvas(p, Math.min(1, 1000 / Math.max(S.w, S.h))));
      },
    });
    MoonStudio.mount({
      esc,
      slug,
      cv,
      toast,
      toBlob,
      loadImg,
      readImage,
      saveFile,
      buildPDF,
      buildZip,
      imagePage,
      openProject,
      loadProjectJSON,
      hasWork,
      projectName: () => S.name,
      pageCanvas: async () => {
        await loadFonts();
        return renderPageCanvas(pg(), 1);
      },
    });
  }
  let studios;
  function openStudio(open) {
    studios ||= Promise.all([
      loadScript('js/print-tools.js').then(() => loadScript('js/print-studio.js')),
      loadScript('js/gif-encoder.js').then(() => loadScript('js/gif-studio.js')),
    ]).then(mountStudios);
    return studios.then(open).catch(() => {
      studios = null;
      toast('No se pudo cargar la herramienta');
    });
  }
  let search;
  function openSearch(go) {
    search ||= loadScript('js/openverse.js').then(() => MoonSearch.mount({readImage, addImage, toast}));
    return search.then(go).catch(() => {
      search = null;
      toast('No se pudo cargar el buscador');
    });
  }

  // Boot
  async function boot() {
    const js = store.get(KEY),
      saved = js && parseJSON(js);
    if (saved && saved.pages && saved.pages.length)
      savedInfo = {name: saved.name || 'Sin título', w: saved.w, h: saved.h, js};
    loadBrand();
    S.style = store.get(STYLE_KEY) === 'pixel' ? 'pixel' : 'normal';
    S.pages = [newPage()];
    openHome();
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    renderRail();
    renderPanel();
    renderProps();
    fitZoom();
    renderStage();
    updHist();
    await loadFonts();
  }
  boot();
})();
