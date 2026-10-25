(() => {
  const API = 'https://api.openverse.org/v1/images/';
  const LICENSES = ['by', 'cc0', 'pdm'];
  const MAX_PAGES = 12;
  const MSG = {
    busy: 'Buscando…',
    empty: 'No encontré imágenes libres para esa búsqueda. Prueba con otras palabras.',
    error: 'No se pudo conectar con Openverse. Revisa tu conexión e intenta de nuevo.',
    limit: 'Llegaste al límite de búsquedas de Openverse; intenta en un minuto',
  };

  let core, io;
  const st = {q: '', page: 0, pages: 0, items: [], state: '', busy: false};
  const thumbs = new Map();
  const $ = id => document.getElementById(id);
  const usable = x =>
    x && typeof x.id === 'string' && /^[\w-]+$/.test(x.id) && LICENSES.includes(x.license) && x.mature !== true;
  const label = x => `${x.title || 'Sin título'} de ${x.creator || 'autor desconocido'}`;

  function thumb(id) {
    if (!thumbs.has(id))
      thumbs.set(
        id,
        fetch(`${API}${id}/thumb/`, {mode: 'cors'})
          .then(r => (r.ok ? r.blob() : Promise.reject(new Error(r.status))))
          .then(b => URL.createObjectURL(b)),
      );
    return thumbs.get(id);
  }

  function discard(id) {
    st.items = st.items.filter(x => x.id !== id);
    thumbs.delete(id);
    document.querySelector(`#ovres [data-ov="${id}"]`)?.remove();
    if (!st.items.length && !st.busy) {
      st.state = 'empty';
      status();
    }
  }

  function status() {
    const s = $('ovst');
    if (s) s.textContent = st.busy ? MSG.busy : MSG[st.state] || '';
  }

  function card(x) {
    const b = document.createElement('button'),
      im = document.createElement('img');
    b.type = 'button';
    b.className = 'ovit';
    b.dataset.ov = x.id;
    b.title = label(x);
    im.alt = label(x);
    b.append(im);
    io.observe(b);
    return b;
  }

  function render() {
    const R = $('ovres');
    if (!R) return;
    const q = $('ovq');
    if (q && !q.value) q.value = st.q;
    io?.disconnect();
    io = new IntersectionObserver(list =>
      list
        .filter(en => en.isIntersecting)
        .forEach(en => {
          io.unobserve(en.target);
          const id = en.target.dataset.ov;
          thumb(id).then(
            u => (en.target.firstChild.src = u),
            () => discard(id),
          );
        }),
    );
    const g = document.createElement('div');
    g.className = 'ovgrid';
    g.append(...st.items.map(card));
    R.replaceChildren(g);
    if (st.page < st.pages && !st.busy) {
      const m = document.createElement('button');
      m.type = 'button';
      m.className = 'btn sm';
      m.dataset.ovmore = '1';
      m.textContent = 'Más resultados';
      R.append(m);
    }
    status();
  }

  async function search(q, more) {
    q = String(q).trim().slice(0, 200);
    if (!q || st.busy) return;
    if (!more) {
      thumbs.forEach(p => p.then(u => URL.revokeObjectURL(u), () => {}));
      thumbs.clear();
      Object.assign(st, {q, page: 0, pages: 0, items: []});
    }
    const before = st.items.length;
    st.busy = true;
    st.state = '';
    render();
    try {
      const u = new URL(API);
      u.search = new URLSearchParams({
        q: st.q,
        page: st.page + 1,
        page_size: 20,
        license: LICENSES.join(','),
        mature: 'false',
      });
      const r = await fetch(u, {mode: 'cors'});
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      st.items.push(...(Array.isArray(d.results) ? d.results : []).filter(usable));
      st.page++;
      st.pages = Math.min(Number(d.page_count) || 0, MAX_PAGES);
      st.state = st.items.length ? '' : 'empty';
    } catch (e) {
      st.state = e.message === '429' ? 'limit' : 'error';
    }
    st.busy = false;
    render();
    if (more) document.querySelectorAll('#ovres .ovit')[before]?.focus();
  }

  function mount(api) {
    core = api;
    $('panel').addEventListener('click', ev => {
      if (ev.target.closest('[data-ovmore]')) search(st.q, true);
    });
  }

  const MoonSearch = {mount, render, search};
  Object.assign(window, {MoonSearch});
})();
