// Runs before first paint so a saved theme never flashes the wrong colours.
try {
  var saved = JSON.parse(localStorage.getItem('virtual-reality-check') || '{}').theme;
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch (e) { /* storage blocked: follow the system */ }
