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
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const stars = Array.from({length: POOL}, () => ({
    x: Math.random(),
    y: Math.random(),
    s: pick(SIZES),
    c: pick(COLORS),
    p: Math.random() * Math.PI * 2,
    v: 0.6 + Math.random() * 2.2,
  }));
  let raf = 0,
    last = 0,
    shoot = null,
    nextShoot = 0;
  const active = () => home.classList.contains('on') && !document.hidden;
  const gap = () => SHOOT_GAP[0] + Math.random() * (SHOOT_GAP[1] - SHOOT_GAP[0]);
  const count = () =>
    Math.min(POOL, Math.max(MIN_STARS, Math.round((STARS_FULL_HD * innerWidth * innerHeight) / (1920 * 1080))));
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
  function draw(now) {
    const k = devicePixelRatio || 1,
      w = canvas.width,
      h = canvas.height,
      n = count();
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const s = stars[i],
        lv = Math.min(LEVELS.length - 1, Math.floor((0.5 + 0.5 * Math.sin((now / 1000) * s.v + s.p)) * LEVELS.length)),
        z = Math.max(1, Math.round(s.s * k));
      x.globalAlpha = LEVELS[lv];
      x.fillStyle = s.c;
      x.fillRect(Math.round(s.x * w), Math.round(s.y * h), z, z);
    }
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
  window.MoonStars = {canvas};
})();
