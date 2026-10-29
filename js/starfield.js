(() => {
  const home = document.getElementById('home');
  const canvas = document.createElement('canvas');
  canvas.id = 'stars';
  canvas.setAttribute('aria-hidden', 'true');
  const x = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const COLORS = ['#ffffff', '#ffffff', '#d6f8ff', '#9fd8ff', '#6fb4ff'];
  const SIZES = [1, 1, 1, 2, 2, 3];
  const LEVELS = [0.25, 0.5, 0.75, 1];
  const POOL = 420;
  const STARS_FULL_HD = 300;
  const MIN_STARS = 60;
  const SHOOT_GAP = [45000, 75000];
  const SHOOT_TRAVEL = 1.1;
  const SHOOT_TRAIL = 0.6;
  const FRAME_MS = 33;
  const SEASON = document.documentElement.dataset.temporada === 'halloween';
  const MOON = ['#443857', '#3a3050', '#2f2745'];
  const BAT_COLOR = '#452c78';
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const stars = Array.from({length: POOL}, () => ({
    x: Math.random(),
    y: Math.random(),
    s: pick(SIZES),
    c: pick(COLORS),
    p: Math.random() * Math.PI * 2,
    v: 0.6 + Math.random() * 2.2,
  }));
  const bats = SEASON
    ? Array.from({length: 5}, () => ({
        x0: Math.random(),
        y0: 0.08 + Math.random() * 0.34,
        v: 0.025 + Math.random() * 0.035,
        a: 0.01 + Math.random() * 0.02,
        p: Math.random() * Math.PI * 2,
        z: 2 + Math.floor(Math.random() * 2),
        x: 0,
        y: 0,
      }))
    : [];
  const moon = SEASON ? {x: 0.86, y: 0.2} : null;
  let raf = 0,
    last = 0,
    shoot = null,
    nextShoot = 0;
  const active = () => home.classList.contains('on') && !document.hidden;
  const gap = () => SHOOT_GAP[0] + Math.random() * (SHOOT_GAP[1] - SHOOT_GAP[0]);
  const count = () =>
    Math.min(
      POOL,
      Math.max(MIN_STARS, Math.round((STARS_FULL_HD * innerWidth * innerHeight) / (1920 * 1080))),
    );
  function fit() {
    const k = devicePixelRatio || 1,
      w = Math.round(innerWidth * k),
      h = Math.round(innerHeight * k);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  function spawn(now) {
    const w = canvas.width,
      h = canvas.height,
      edge = Math.floor(Math.random() * 3),
      sx = edge === 0 ? Math.random() * w : edge === 1 ? 0 : w,
      sy = edge === 0 ? 0 : Math.random() * h * 0.5,
      dir = edge === 2 || (edge === 0 && sx > w / 2) ? -1 : 1,
      ang = ((25 + Math.random() * 20) * Math.PI) / 180,
      speed = Math.max(w, h) * 0.55;
    shoot = {t0: now, sx, sy, vx: dir * speed * Math.cos(ang), vy: speed * Math.sin(ang)};
  }
  function drawShoot(now) {
    const k = devicePixelRatio || 1,
      e = (now - shoot.t0) / 1000;
    if (e > SHOOT_TRAVEL + SHOOT_TRAIL) {
      shoot = null;
      nextShoot = now + gap();
      return;
    }
    x.fillStyle = '#ffffff';
    for (let t = Math.max(0, e - SHOOT_TRAIL); t <= Math.min(e, SHOOT_TRAVEL); t += 0.02) {
      const head = e <= SHOOT_TRAVEL && e - t < 0.02,
        s = Math.round((head ? 3 : 2) * k);
      x.globalAlpha = 1 - (e - t) / SHOOT_TRAIL;
      x.fillRect(Math.round(shoot.sx + shoot.vx * t), Math.round(shoot.sy + shoot.vy * t), s, s);
    }
  }
  function drawMoon(w, h) {
    const r = Math.round(Math.min(w, h) * 0.07),
      c = Math.max(2, Math.round(r / 7)),
      cx = Math.round(moon.x * w),
      cy = Math.round((innerWidth > 900 ? 0.78 : moon.y) * h);
    x.globalAlpha = 1;
    for (let j = -r; j < r; j += c)
      for (let i = -r; i < r; i += c) {
        const d = Math.hypot(i + c / 2, j + c / 2);
        if (d > r) continue;
        const crater =
          Math.hypot(i + r * 0.3, j + r * 0.2) < r * 0.22 || Math.hypot(i - r * 0.35, j - r * 0.3) < r * 0.14;
        x.fillStyle = crater ? MOON[2] : d > r - c * 1.5 ? MOON[1] : MOON[0];
        x.fillRect(cx + i, cy + j, c, c);
      }
  }
  function drawBats(now, k, w, h) {
    const r = SPR.bat;
    x.globalAlpha = 1;
    x.fillStyle = BAT_COLOR;
    for (const b of bats) {
      const t = now / 1000;
      b.x = ((((b.x0 + t * b.v) % 1.2) + 1.2) % 1.2) - 0.1;
      b.y = b.y0 + Math.sin(t * 2 + b.p) * b.a;
      const z = Math.round(b.z * k),
        ox = Math.round(b.x * w),
        oy = Math.round(b.y * h);
      r.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          if (ch === 'X') x.fillRect(ox + i * z, oy + j * z, z, z);
        }),
      );
    }
  }
  function draw(now) {
    const k = devicePixelRatio || 1,
      w = canvas.width,
      h = canvas.height,
      n = count();
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const s = stars[i],
        lv = Math.min(
          LEVELS.length - 1,
          Math.floor((0.5 + 0.5 * Math.sin((now / 1000) * s.v + s.p)) * LEVELS.length),
        ),
        z = Math.max(1, Math.round(s.s * k));
      x.globalAlpha = LEVELS[lv];
      x.fillStyle = s.c;
      x.fillRect(Math.round(s.x * w), Math.round(s.y * h), z, z);
    }
    if (moon) drawMoon(w, h);
    if (bats.length) drawBats(now, k, w, h);
    if (shoot) drawShoot(now);
    x.globalAlpha = 1;
  }
  function frame(now) {
    raf = 0;
    if (!active() || reduced.matches) return;
    if (now - last >= FRAME_MS) {
      last = now;
      if (!shoot && now >= nextShoot) spawn(now);
      draw(now);
    }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (!active()) {
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    fit();
    if (reduced.matches) {
      cancelAnimationFrame(raf);
      raf = 0;
      shoot = null;
      draw(0);
    } else if (!raf) {
      nextShoot = performance.now() + gap();
      raf = requestAnimationFrame(frame);
    }
  }
  new MutationObserver(sync).observe(home, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  addEventListener('resize', () => {
    if (!active()) return;
    fit();
    if (reduced.matches) draw(0);
  });
  home.prepend(canvas);
  window.MoonStars = {canvas, bats, moon};
})();
