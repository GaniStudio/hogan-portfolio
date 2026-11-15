// Keep the compact step bar clear until it is pinned directly below the header.
export function isStepBarStuck(markerTop, panelBottom, headerHeight, barHeight) {
  return markerTop <= headerHeight && panelBottom >= headerHeight + barHeight;
}

if (typeof document !== 'undefined') {
  const header = document.querySelector('.site-header');
  const compact = matchMedia('(max-width:1099px)');
  for (const panel of document.querySelectorAll('.v186-db-inline,.v194-inline')) {
    const bar = panel.querySelector('.v186-steps');
    if (!header || !bar) continue;
    const marker = document.createElement('span');
    marker.className = 'v197-step-marker';
    marker.setAttribute('aria-hidden', 'true');
    bar.before(marker);
    let startObserver, endObserver, headerHeight = -1, barHeight = -1;
    function sync() {
      bar.classList.toggle('is-stuck', compact.matches && barHeight > 0 && isStepBarStuck(
        marker.getBoundingClientRect().top, panel.getBoundingClientRect().bottom,
        headerHeight, barHeight
      ));
    }
    function configure() {
      const h = header.getBoundingClientRect().height;
      const b = bar.getBoundingClientRect().height;
      const style = getComputedStyle(header);
      bar.style.setProperty('--v197-header-background', style.background);
      bar.style.setProperty('--v197-header-blur', style.backdropFilter || 'none');
      bar.style.setProperty('--v197-header-webkit-blur', style.getPropertyValue('-webkit-backdrop-filter') || style.backdropFilter || 'none');
      panel.style.setProperty('--v186-header', `${h}px`);
      if (!compact.matches || !b) {
        startObserver?.disconnect(); endObserver?.disconnect();
        headerHeight = barHeight = -1; bar.classList.remove('is-stuck');
        return;
      }
      if (h !== headerHeight || b !== barHeight) {
        startObserver?.disconnect(); endObserver?.disconnect();
        headerHeight = h; barHeight = b;
        // The 1px marker consumes no layout space. Its bottom crosses at bar top=h.
        startObserver = new IntersectionObserver(sync, {rootMargin:`-${h + 1}px 0px 0px 0px`,threshold:0});
        endObserver = new IntersectionObserver(sync, {rootMargin:`-${h + b}px 0px 0px 0px`,threshold:0});
        startObserver.observe(marker); endObserver.observe(panel);
      }
      sync();
    }
    const dimensions = new ResizeObserver(configure);
    dimensions.observe(header); dimensions.observe(bar);
    const panelSize = new ResizeObserver(sync); panelSize.observe(panel);
    compact.addEventListener('change', configure);
    addEventListener('resize', configure, {passive:true});
    configure();
  }
}
