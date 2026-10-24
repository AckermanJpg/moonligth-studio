if (/^https?:$/.test(location.protocol))
  ['pixelify-sans-latin-wght-normal', 'jersey-25-latin-400-normal'].forEach(f => {
    const l = document.createElement('link');
    l.rel = 'preload';
    l.as = 'font';
    l.type = 'font/woff2';
    l.crossOrigin = 'anonymous';
    l.href = `fonts/${f}.woff2`;
    document.head.append(l);
  });
