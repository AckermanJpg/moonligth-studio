(() => {
  const d = new Date(),
    m = d.getMonth(),
    n = d.getDate();
  if ((m === 9 && n >= 15) || (m === 10 && n <= 2)) document.documentElement.dataset.temporada = 'halloween';
})();
