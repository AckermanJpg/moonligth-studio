(() => {
  const PATHS = {
    home: '<path d="M12 2.5 22 11.5h-3V21h-5.5v-6h-3v6H5v-9.5H2z"/>',
    doc: '<path fill-rule="evenodd" d="M5 2h10l5 5v15H5zM8 7h5v2H8zm0 4h9v2H8zm0 4h9v2H8z"/>',
    star: '<path d="M12.00 2.40L14.59 9.04L21.70 9.45L16.18 13.96L18.00 20.85L12.00 17.00L6.00 20.85L7.82 13.96L2.30 9.45L9.41 9.04z"/>',
    text: '<path d="M3 3h18v5h-2.5V5.5H13.2V18.5H16V21H8v-2.5h2.8V5.5H5.5V8H3z"/>',
    camera:
      '<path fill-rule="evenodd" d="M8 4h8l2 3h4v13H2V7h4zM12 8.8a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zM12 11.4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
    pencil: '<path d="M16.5 2.5 21.5 7.5 19 10 14 5zM12.6 6.4l5 5L8 21l-5.5 1.5L4 17z"/>',
    moon: '<path d="M11.57 2.40A9.6 9.6 0 1 0 20.46 15.46A7.9 7.9 0 1 1 11.57 2.40z"/>',
    palette: '<path d="M2.5 21 7 4h4.2L6.8 21zM9.6 21 14.6 2.5h4.2L13.8 21zM16.6 21 21 9h2.6l-4.4 12z"/>',
    pages: '<path d="M3 6h2.2v13.8H17V22H3zM7 2h11l3.5 3.5V18H7z"/>',
    resize:
      '<path d="M2 2h7v2.5H4.5V9H2zM22 2v7h-2.5V4.5H15V2zM2 22v-7h2.5v4.5H9V22zM22 22h-7v-2.5h4.5V15H22zM12 8l4 4-4 4-4-4z"/>',
    printer:
      '<path fill-rule="evenodd" d="M6 2h12v5h4v11h-4v4H6v-4H2V7h4zM8 4v3h8V4zm0 11v5h8v-5zM18 10v2h2v-2z"/>',
    gem: '<path fill-rule="evenodd" d="M7 3h10l5 6-10 13L2 9zM9 9.5 12 17l3-7.5zM12 4.8 14 8h-4z"/>',
    film: '<path fill-rule="evenodd" d="M2 4h20v16H2zM4 6v2h2V6zm0 5v2h2v-2zm0 5v2h2v-2zM18 6v2h2V6zm0 5v2h2v-2zm0 5v2h2v-2zM9.5 7.5v9L16.5 12z"/>',
    download: '<path d="M10 2h4v8h4.5L12 17.5 5.5 10H10zM3 19h18v3H3z"/>',
    phone: '<path fill-rule="evenodd" d="M6 2h12v20H6zM8.5 4.5v13h7v-13zM10.5 19h3v1.5h-3z"/>',
    gamepad:
      '<path fill-rule="evenodd" d="M7 6h10l5 3 1 9-3 2-4-3H8l-4 3-3-2 1-9zM7 9.5v2H5v2h2v2h2v-2h2v-2H9v-2zM16 9.6a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zM19 12.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/>',
    chart: '<path d="M3 21V3h2.5v15.5H21V21zM8 12h3v4.5H8zM12.5 8h3v8.5h-3zM17 4h3v12.5h-3z"/>',
    globe:
      '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2.4a7.6 7.6 0 1 1 0 15.2 7.6 7.6 0 0 1 0-15.2z"/><path d="M11 4h2v16h-2zM4 11h16v2H4z"/><ellipse cx="12" cy="12" rx="4.2" ry="8.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  };

  const svg = (name, cls = 'ic') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  const el = name => {
    const t = document.createElement('template');
    t.innerHTML = svg(name);
    return t.content.firstChild;
  };

  window.MoonIcons = {svg, el};
})();
