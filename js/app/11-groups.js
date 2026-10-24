// Groups and style painter
(() => {
  Object.assign(window, {groupSel, ungroupSel, copyStyle, pasteStyle});
  const expandGroup = ids => {
    const g = new Set(
      ids
        .map(findEl)
        .filter(x => x && x.gid)
        .map(x => x.gid),
    );
    return els()
      .filter(x => ids.includes(x.id) || (x.gid && g.has(x.gid)))
      .map(x => x.id);
  };
  Object.assign(window, {expandGroup});
  function groupSel() {
    const L = selEls();
    if (L.length < 2) {
      toast('Selecciona 2 o más objetos para agrupar');
      return;
    }
    touch(true);
    const g = 'g' + uid++;
    L.forEach(e => (e.gid = g));
    refresh({props: true});
    toast('Objetos agrupados');
  }
  function ungroupSel() {
    const gs = new Set(
      selEls()
        .map(e => e.gid)
        .filter(Boolean),
    );
    if (!gs.size) return;
    touch(true);
    els().forEach(e => {
      if (gs.has(e.gid)) delete e.gid;
    });
    refresh({props: true});
    toast('Grupo deshecho');
  }
  const STYLE_KEYS = [
    'fill',
    'stroke',
    'sw',
    'op',
    'shadow',
    'sc',
    'sd',
    'blend',
    'ol',
    'olc',
    'grad',
    'gop',
    'fill2',
    'gang',
    'font',
    'bold',
    'italic',
    'lh',
    'ls',
    'align',
    'tsw',
    'tsc',
    'tbg',
    'tbc',
    'upper',
    'flt',
    'fp',
    'mask',
    'px',
    'th',
  ];
  function copyStyle() {
    const e = prim();
    if (!e) return;
    S.styleClip = {};
    STYLE_KEYS.forEach(k => {
      if (e[k] !== undefined) S.styleClip[k] = JSON.parse(JSON.stringify(e[k]));
    });
    toast('Estilo copiado');
    renderProps();
  }
  function pasteStyle() {
    if (!S.styleClip) return;
    touch(true);
    selEls().forEach(e => {
      Object.keys(S.styleClip).forEach(k => {
        if ((k === 'flt' || k === 'fp' || k === 'mask') && e.type !== 'image') return;
        if (
          ['font', 'bold', 'italic', 'lh', 'ls', 'align', 'upper', 'tsw', 'tsc', 'tbg', 'tbc'].includes(k) &&
          e.type !== 'text'
        )
          return;
        e[k] = JSON.parse(JSON.stringify(S.styleClip[k]));
      });
    });
    refresh({props: true});
    toast('Estilo pegado');
  }
})();
