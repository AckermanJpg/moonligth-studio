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
  const unread = () => state().leido !== cur;
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
    store.set(NEWS_KEY, JSON.stringify({...state(), leido: cur}));
    markNews();
  }
  $$('[data-news]').forEach(b => (b.onclick = openNews));
  markNews();
})();
