// Media
(() => {
  Object.assign(window, {
    isMediaFile,
    loadMedia,
    adoptBlob,
    hasMedia,
    keepMedia,
    unsavedMedia,
    takeSaveNote,
    mediaNode,
    mediaFrame,
    mediaSync,
    mediaGC,
    mediaPaused,
    toggleMedia,
    pauseAll,
    hasInlineMedia,
    importMedia,
    exportJSON,
    mediaTrack,
    mediaLongest,
  });
  const REF = '@db:',
    MB = 1048576,
    MAX_PIXELS = 90e6,
    MEDIA_MIMES = ['image/gif', 'video/mp4', 'video/webm'],
    blobs = new Map(),
    players = new Map(),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  Object.assign(window, {MEDIA_MIMES});
  let allPaused = false,
    raf = 0,
    last = 0,
    asked = false,
    note = '';

  const MP4_BRANDS = ['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash'],
    NOT_VIDEO = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'avif', 'avis', 'mif1', 'msf1', 'qt  '];
  async function sniff(blob) {
    const b = new Uint8Array(await blob.slice(0, 256).arrayBuffer()),
      s = String.fromCharCode(...b);
    if (/^GIF8[79]a/.test(s)) return 'image/gif';
    if (s.slice(4, 8) === 'ftyp') {
      const major = s.slice(8, 12),
        compat =
          s
            .slice(16, Math.min(s.length, (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]))
            .match(/[^]{4}/g) || [];
      return !NOT_VIDEO.includes(major) && [major, ...compat].some(x => MP4_BRANDS.includes(x))
        ? 'video/mp4'
        : '';
    }
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm';
    return '';
  }
  function isMediaFile(f) {
    return f.type === 'image/gif' || f.type.startsWith('video/') || /\.(gif|mp4|webm)$/i.test(f.name);
  }
  const tooBig = (mime, size) =>
    mime === 'image/gif'
      ? size > 8 * MB && 'El GIF pesa más de 8 MB'
      : size > 30 * MB && 'El video pesa más de 30 MB';
  const REASONS = {
    pixels: 'El GIF es demasiado grande para animarlo aquí',
    frames: 'El GIF tiene más de 300 cuadros',
    secs: 'El video dura más de 15 s',
  };
  const reason = (e, gif) =>
    REASONS[e.message] ||
    (gif ? 'El GIF está dañado y no se puede leer' : 'No se pudo reproducir este video');

  async function decode(blob) {
    await loadScript('js/gif-decoder.js');
    if (blob.type === 'image/gif') {
      const g = MoonGif.decodeGif(await blob.arrayBuffer(), {reject: 300, maxPixels: MAX_PIXELS}),
        first = cv(g.w, g.h);
      first.getContext('2d').drawImage(MoonGif.gifView(g).show(0), 0, 0);
      return {
        blob,
        kind: 'gif',
        w: g.w,
        h: g.h,
        dur: g.duration,
        gif: g,
        frames: g.frames,
        times: g.times,
        first,
      };
    }
    const url = URL.createObjectURL(blob);
    try {
      const v = await MoonGif.openVideo(url),
        m = {
          blob,
          kind: 'video',
          url,
          w: v.videoWidth,
          h: v.videoHeight,
          dur: v.duration,
          poster: cv(v.videoWidth, v.videoHeight),
        };
      await MoonGif.seekTo(v, 0);
      m.poster.getContext('2d').drawImage(v, 0, 0);
      v.removeAttribute('src');
      v.load();
      if (m.dur > 15.05) throw new Error('secs');
      return m;
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  function element(id, m) {
    return mk('media', {
      src: REF + id,
      mime: m.blob.type,
      kind: m.kind,
      dur: Math.round(m.dur * 1000) / 1000,
      nw: m.w,
      nh: m.h,
      frames: m.kind === 'gif' ? m.frames.length : 0,
      w: m.w,
      h: m.h,
      px: 1,
    });
  }
  async function loadMedia(f) {
    const mime = await sniff(f);
    if (!mime) return toast('El archivo no es un GIF, MP4 ni WebM válido');
    const big = tooBig(mime, f.size);
    if (big) return toast(big);
    let m;
    try {
      m = await decode(new Blob([f], {type: mime}));
    } catch (e) {
      return toast(reason(e, mime === 'image/gif'));
    }
    if (m.kind === 'gif' && m.frames.length === 1)
      return readImage(f, 1600)
        .then(o => addImage(o.src, o.w, o.h))
        .catch(() => toast('Solo se aceptan imágenes'));
    const id = newId();
    blobs.set(id, m);
    keep([[id, m]]).catch(() => {});
    add(element(id, m));
  }
  async function adoptBlob(id, blob) {
    blobs.set(id, Object.assign(await decode(blob), {saved: true}));
  }
  function hasMedia(id) {
    return blobs.has(id);
  }

  function keep(list) {
    return vault.putAll(list.map(([id, m]) => [id, m.blob])).then(() => {
      list.forEach(([, m]) => (m.saved = true));
      if (asked || !navigator.storage || !navigator.storage.persist) return;
      asked = true;
      navigator.storage.persist().then(
        ok => ok || (note = ' · el navegador podría borrar los GIF y videos si le falta espacio'),
        () => {},
      );
    });
  }
  const used = () =>
    new Set(S.pages.flatMap(p => p.els.filter(e => e.type === 'media').map(e => e.src.slice(REF.length))));
  const pending = () => [...blobs].filter(([id, m]) => !m.saved && used().has(id));
  function keepMedia() {
    const list = pending();
    return list.length ? keep(list) : undefined;
  }
  function unsavedMedia() {
    return pending().length > 0;
  }
  function takeSaveNote() {
    const n = note;
    note = '';
    return n;
  }

  function mediaNode(e) {
    const m = blobs.get(e.src.slice(REF.length));
    if (!m) return null;
    let pl = players.get(e.id);
    if (!pl || pl.src !== e.src) {
      drop(e.id);
      pl = {src: e.src, kind: m.kind, m, paused: allPaused || reduced.matches, pos: 0, idx: -1};
      if (m.kind === 'video') {
        const v = document.createElement('video');
        v.muted = true;
        v.defaultMuted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.src = m.url;
        v.addEventListener('error', () => players.get(e.id) === pl && broken(e.id));
        pl.el = v;
      } else {
        pl.view = MoonGif.gifView(m.gif);
        pl.el = pl.view.canvas;
        paintGif(pl);
      }
      players.set(e.id, pl);
    }
    return pl.el;
  }
  function mediaFrame(e) {
    const pl = players.get(e.id),
      m = blobs.get(e.src.slice(REF.length));
    if (pl && (pl.kind === 'gif' || pl.el.readyState >= 2)) return pl.el;
    return m ? (m.kind === 'gif' ? m.first : m.poster) : null;
  }
  function broken(id) {
    if (!findEl(id)) return;
    touch(true);
    pg().els.splice(pg().els.indexOf(findEl(id)), 1);
    S.sel = S.sel.filter(x => x !== id);
    refresh({props: true});
    toast('No se pudo reproducir este video');
  }
  function drop(id) {
    const pl = players.get(id);
    if (!pl) return;
    if (pl.kind === 'video') {
      pl.el.pause();
      pl.el.removeAttribute('src');
      pl.el.load();
    }
    players.delete(id);
  }
  function frameIndex(m, at, from = 0) {
    const t = m.times;
    let i = from < 0 || t[from] > at ? 0 : from;
    while (i + 1 < t.length && t[i + 1] <= at) i++;
    return i;
  }
  function paintGif(pl) {
    const i = frameIndex(pl.m, pl.pos, pl.idx);
    if (i === pl.idx) return;
    pl.idx = i;
    pl.view.show(i);
  }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.25, (now - last) / 1000) : 0;
    let any = false;
    last = now;
    players.forEach(pl => {
      if (pl.kind !== 'gif' || pl.paused) return;
      any = true;
      pl.pos = (pl.pos + dt) % pl.m.dur;
      paintGif(pl);
    });
    if (any && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function mediaSync() {
    const live = new Set(
      S.active
        ? pg()
            .els.filter(e => e.type === 'media' && !e.hidden)
            .map(e => e.id)
        : [],
    );
    players.forEach((pl, id) => (live.has(id) && pl.el.isConnected) || drop(id));
    players.forEach(pl => {
      if (pl.kind !== 'video') return;
      if (pl.paused || document.hidden) pl.el.pause();
      else pl.el.play().catch(() => {});
    });
    if (document.hidden || ![...players.values()].some(pl => pl.kind === 'gif' && !pl.paused)) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    const b = $('#pauseall'),
      any = S.active && S.pages.some(p => p.els.some(e => e.type === 'media'));
    b.parentElement.hidden = !any;
    $('#top').classList.toggle('media', any);
    b.setAttribute('aria-pressed', String(allPaused));
  }
  function mediaGC() {
    const u = used();
    players.forEach(
      (pl, id) => S.pages.some(p => p.els.some(e => e.id === id && e.src === pl.src)) || drop(id),
    );
    blobs.forEach((m, id) => {
      if (u.has(id) || inHistory(REF + id)) return;
      if (m.url) URL.revokeObjectURL(m.url);
      blobs.delete(id);
    });
  }
  function mediaPaused(id) {
    return players.has(id) ? players.get(id).paused : allPaused || reduced.matches;
  }
  function toggleMedia(id) {
    const pl = players.get(id);
    if (!pl) return;
    pl.paused = !pl.paused;
    mediaSync();
  }
  function pauseAll() {
    allPaused = !allPaused;
    players.forEach(pl => (pl.paused = allPaused));
    mediaSync();
    if (S.sel.length) renderProps();
  }
  $('#pauseall').addEventListener('click', pauseAll);
  document.addEventListener('visibilitychange', mediaSync);

  function mediaLongest(p) {
    return Math.max(0, ...p.els.filter(e => e.type === 'media' && !e.hidden).map(e => e.dur));
  }
  async function mediaTrack(p) {
    const vids = new Map(),
      gifs = new Map();
    for (const e of p.els) {
      const m = e.type === 'media' && blobs.get(e.src.slice(REF.length));
      if (m && m.kind === 'gif' && !gifs.has(e.src)) gifs.set(e.src, MoonGif.gifView(m.gif));
      if (m && m.kind === 'video' && !vids.has(e.src)) {
        const v = await MoonGif.openVideo(m.url);
        v.loop = true;
        vids.set(e.src, {v, m});
      }
    }
    const pick = t => e => {
      const m = e.type === 'media' && blobs.get(e.src.slice(REF.length));
      if (!m) return null;
      return m.kind === 'gif' ? gifs.get(e.src).show(frameIndex(m, t % m.dur)) : vids.get(e.src).v;
    };
    return {
      pick,
      seek: t => Promise.all([...vids.values()].map(({v, m}) => MoonGif.seekTo(v, t % m.dur))),
      play: () => Promise.all([...vids.values()].map(({v}) => v.play().catch(() => {}))),
      close: () =>
        vids.forEach(({v}) => {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }),
    };
  }
  const inlineOf = e => e.type === 'media' && typeof e.src === 'string' && e.src.startsWith('data:');
  function hasInlineMedia(o) {
    return o.pages.some(p => p.els.some(inlineOf));
  }
  async function importMedia(o) {
    let missing = 0;
    for (const p of o.pages)
      for (const e of p.els.filter(inlineOf)) {
        try {
          const blob = dataBlob(e.src);
          if ((await sniff(blob)) !== e.mime || tooBig(e.mime, blob.size)) throw new Error('media');
          const m = await decode(blob),
            id = newId();
          blobs.set(id, m);
          await keep([[id, m]]).catch(() => {});
          e.src = REF + id;
        } catch {
          missing++;
          Object.assign(e, {type: 'image', src: null, missing: true, px: 1});
        }
      }
    return missing;
  }
  async function exportJSON(noVideo) {
    const o = JSON.parse(snapshot()),
      data = new Map();
    if (noVideo)
      o.pages.forEach(p => (p.els = p.els.filter(e => !(e.type === 'media' && e.kind === 'video'))));
    for (const p of o.pages)
      for (const e of p.els)
        if (e.type === 'media' && !data.has(e.src) && blobs.has(e.src.slice(REF.length)))
          data.set(e.src, await blobData(blobs.get(e.src.slice(REF.length)).blob));
    return JSON.stringify(o, (k, v) => (k === 'src' && data.has(v) ? data.get(v) : v));
  }
})();
