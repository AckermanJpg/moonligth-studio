// News
(() => {
  Object.assign(window, {openNews, markNews});
  const NEWS_KEY = 'moonlight-news-v1',
    cur = MoonNews[0].v,
    day = new Intl.DateTimeFormat('es', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
  const state = () => {
    try {
      return JSON.parse(store.get(NEWS_KEY)) || {};
    } catch {
      return {};
    }
  };
  const save = o => store.set(NEWS_KEY, JSON.stringify({...state(), ...o})),
    unread = () => store.get(NEWS_KEY) !== null && state().leido !== cur,
    note = $('#news-note');
  let timer = 0;
  function markNews() {
    const u = unread(),
      more = $('#more-btn');
    $$('[data-act="news"], [data-news]').forEach(b => {
      b.classList.toggle('unread', u);
      b.setAttribute('aria-label', u ? 'Novedades: hay una versión nueva sin leer' : 'Novedades');
    });
    more.classList.toggle('unread', u);
    more.setAttribute('aria-label', u ? 'Más opciones: hay novedades sin leer' : 'Más opciones');
  }
  function openNews() {
    $('#mbox').innerHTML = `<h3>Novedades</h3>${MoonNews.map(
      n =>
        `<h4>Versión ${esc(n.v)} · ${day.format(new Date(n.date))}</h4><ul class="news">${n.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`,
    ).join('')}<div class="row"><button class="btn sm warn" id="xclose">Cerrar</button></div>`;
    $('#modal').classList.add('on');
    save({leido: cur});
    hideNote();
    markNews();
  }
  function hideNote() {
    clearTimeout(timer);
    note.classList.remove('on');
    note.replaceChildren();
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(hideNote, 10000);
  };
  function showNote() {
    save({aviso: cur});
    note.innerHTML = `<p>Moonlight se actualizó a la versión ${esc(cur)}.</p><button type="button" class="btn sm on" data-open>Ver novedades</button><button type="button" class="btn sm" data-close>Cerrar</button>`;
    note.classList.add('on');
    later();
  }
  async function checkNews() {
    if (store.get(NEWS_KEY) !== null) {
      if (state().aviso !== cur) showNote();
    } else if (store.get(KEY) !== null || (await vault.count().catch(() => 0)) > 0) showNote();
    else save({aviso: cur, leido: cur});
    markNews();
  }
  note.addEventListener('click', ev => {
    if (ev.target.closest('[data-open]')) openNews();
    else if (ev.target.closest('[data-close]')) hideNote();
  });
  note.addEventListener('mouseenter', () => clearTimeout(timer));
  note.addEventListener('focusin', () => clearTimeout(timer));
  note.addEventListener('mouseleave', () => note.contains(document.activeElement) || later());
  note.addEventListener('focusout', ev => note.contains(ev.relatedTarget) || later());
  addEventListener(
    'keydown',
    ev => {
      if (ev.key !== 'Escape' || !note.classList.contains('on') || $('#modal.on, #present.on')) return;
      ev.stopPropagation();
      hideNote();
    },
    true,
  );
  $$('[data-news]').forEach(b => (b.onclick = openNews));
  markNews();
  checkNews();
})();
