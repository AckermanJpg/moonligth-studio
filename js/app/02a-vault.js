// Vault
(() => {
  Object.assign(window, {packProject, unpackProject, dataBlob});
  const REF = '@db:',
    DAY = 864e5,
    ids = new Map();
  let dbp;
  const db = () =>
    (dbp ||= new Promise((res, rej) => {
      const q = indexedDB.open('moonlight-studio', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('blobs');
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    }).catch(e => {
      dbp = null;
      throw e;
    }));
  const tx = (mode, fn) =>
    db().then(
      d =>
        new Promise((res, rej) => {
          const t = d.transaction('blobs', mode),
            out = fn(t.objectStore('blobs'));
          t.oncomplete = () => res(out);
          t.onerror = t.onabort = () => rej(t.error);
        }),
    );
  const vault = {
    putAll: list => tx('readwrite', s => list.forEach(([id, blob]) => s.put({blob, t: Date.now()}, id))),
    getAll: list =>
      tx('readonly', s => {
        const out = new Map();
        list.forEach(
          id => (s.get(id).onsuccess = ev => ev.target.result && out.set(id, ev.target.result.blob)),
        );
        return out;
      }),
    sweep: keep =>
      tx('readwrite', s => {
        const gone = [];
        s.openCursor().onsuccess = ev => {
          const c = ev.target.result;
          if (!c) return;
          if (!keep.has(c.key) && !(c.value.t > Date.now() - DAY)) {
            gone.push(c.key);
            c.delete();
          }
          c.continue();
        };
        return gone;
      }),
  };
  Object.assign(window, {vault});
  const isData = v =>
    typeof v === 'string' && v.length > 1024 && /^data:image\/[\w.+-]+;base64,/.test(v.slice(0, 40));
  const refsOf = js => new Set((js.match(/"@db:[^"]*"/g) || []).map(s => s.slice(REF.length + 1, -1)));
  const newId = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  Object.assign(window, {newId});
  function dataBlob(s) {
    const i = s.indexOf(','),
      bin = atob(s.slice(i + 1)),
      a = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
    return new Blob([a], {type: s.slice(5, s.indexOf(';'))});
  }
  const blobData = b =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(b);
    });
  Object.assign(window, {blobData});
  async function packProject() {
    const fresh = new Map(),
      js = snapshot(false, (k, v) => {
        if (!isData(v)) return v;
        let id = ids.get(v) || fresh.get(v);
        if (!id) fresh.set(v, (id = newId()));
        return REF + id;
      });
    try {
      if (fresh.size) await vault.putAll([...fresh].map(([v, id]) => [id, dataBlob(v)]));
      await keepMedia();
    } catch {
      return {js: snapshot(), lost: unsavedMedia()};
    }
    fresh.forEach((id, v) => ids.set(v, id));
    return {
      js,
      sweep: () =>
        vault
          .sweep(refsOf(js))
          .then(gone => ids.forEach((id, v) => gone.includes(id) && ids.delete(v)))
          .catch(() => {}),
    };
  }
  async function unpackProject(js) {
    const want = [...refsOf(js)];
    if (!want.length) return {js, missing: 0};
    const got = await vault.getAll(want),
      urls = new Map(),
      kept = new Set();
    for (const [id, b] of got) {
      if (MEDIA_MIMES.includes(b.type)) {
        if (
          await adoptBlob(id, b).then(
            () => true,
            () => false,
          )
        )
          kept.add(id);
        continue;
      }
      const v = await blobData(b);
      urls.set(id, v);
      ids.set(v, id);
    }
    let missing = 0;
    const out = JSON.parse(js, (k, v) => {
      if (typeof v === 'string' && v.startsWith(REF) && urls.has(v.slice(REF.length)))
        return urls.get(v.slice(REF.length));
      if (
        v &&
        typeof v === 'object' &&
        typeof v.src === 'string' &&
        v.src.startsWith(REF) &&
        !kept.has(v.src.slice(REF.length))
      ) {
        missing++;
        if (v.type) Object.assign(v, {type: 'image', src: null, missing: true, px: 1});
        else v.src = null;
      }
      return v;
    });
    return {js: JSON.stringify(out), missing};
  }
})();
