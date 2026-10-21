(() => {
  const hero = document.querySelector('.hero');
  if (!hero || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  // Distances are visible screen pixels, including the approved75% hero scale.
  // The pen and note share their original writing group and never drift apart.
  const specs = [
    ['.wordmark-large', 0, 3, 0, 9200, .25],
    ['.hero-bird', 2, 6, 1, 6200, .12],
    ['.hero-candlesticks', -2, 6, 1.2, 5700, .58],
    ['.hero-seven', 2, 7, 1.6, 6800, .31],
    ['.hero-writing', -2, 8, 0, 7000, .76],
    ['.hero-cuckoo', 2, 9, 1.2, 8000, .46],
    ['.micro-spring-lavender', 2, 3, 1.5, 4600, .64],
    ['.micro-flap-lavender', -1.5, 3.5, 1.2, 5400, .23],
    ['.micro-sound-cream', 1.5, 3, 1, 5900, .83],
    ['.micro-flap-teal', -2, 3.5, 1.4, 5100, .39],
    ['.micro-sound-yellow', 1, 3, 1, 5600, .07],
    ['.micro-spring-blue', -2, 3, 1.4, 4400, .91],
    ['.micro-spring-coral', 1.5, 3.5, 1.5, 4900, .52],
  ];
  const units = specs.flatMap(([selector, x, y, angle, duration, phase]) => {
    const element = hero.querySelector(selector);
    return element ? [{ element, x, y, angle, duration, phase, animation: null, hovered: false, pressed: false }] : [];
  });
  let inView = false;
  let leaving = false;
  let resizeFrame = 0;
  const syncUnit = unit => {
    if (!unit.animation) return;
    const paused = !inView || leaving || document.hidden || unit.hovered || unit.pressed || unit.element.matches(':focus-within');
    if (paused) unit.animation.pause();
    else unit.animation.play();
  };
  const sync = () => units.forEach(syncUnit);
  const rebuild = () => {
    units.forEach(unit => {
      const time = unit.animation?.currentTime ?? unit.phase * unit.duration;
      unit.animation?.cancel();
      unit.animation = null;
      unit.element.removeAttribute('data-hero-float');
      if (reduced.matches || getComputedStyle(unit.element).display === 'none') return;
      const base = getComputedStyle(unit.element).transform;
      let scale = 1;
      for (let node = unit.element; node && node !== hero.parentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
        scale *= (parseFloat(style.zoom) || 1) * Math.hypot(matrix.a, matrix.b);
      }
      const strength = mobile.matches ? .5 : 1;
      const x = unit.x * strength / scale;
      const y = unit.y * strength / scale;
      const angle = unit.angle * strength;
      const rest = base === 'none' ? '' : base;
      const pose = direction => ({
        transform: `${rest} translate3d(${x * direction}px,${y * direction}px,0) rotate(${angle * direction}deg)`,
        easing: 'ease-in-out',
      });
      unit.element.setAttribute('data-hero-float', '');
      unit.animation = unit.element.animate([pose(1), pose(-1), pose(1)], {
        duration: unit.duration, iterations: Infinity,
      });
      unit.animation.pause();
      unit.animation.currentTime = time;
      syncUnit(unit);
    });
  };
  units.forEach(unit => {
    unit.element.addEventListener('pointerenter', () => { unit.hovered = fine.matches; syncUnit(unit); });
    unit.element.addEventListener('pointerleave', () => { unit.hovered = false; syncUnit(unit); });
    unit.element.addEventListener('pointerdown', () => { unit.pressed = true; syncUnit(unit); });
    unit.element.addEventListener('focusin', () => syncUnit(unit));
    unit.element.addEventListener('focusout', () => queueMicrotask(() => syncUnit(unit)));
  });
  const release = () => units.forEach(unit => { unit.pressed = false; syncUnit(unit); });
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { leaving = true; sync(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  reduced.addEventListener('change', rebuild);
  fine.addEventListener('change', () => {
    units.forEach(unit => { unit.hovered = false; });
    sync();
  });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuild);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0 }).observe(hero);
  } else inView = true;
  rebuild();
})();
