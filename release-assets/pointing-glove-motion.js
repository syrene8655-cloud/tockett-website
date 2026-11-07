(() => {
  const glove = document.querySelector('.hero .release-pointing-glove');
  if (!glove || !Element.prototype.animate) return;
  const hero = glove.closest('.hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px)');
  const duration = 7200;
  let animation;
  let inView = false;
  let leaving = false;
  let resizeFrame;
  const sync = () => {
    if (!animation) return;
    if (!inView || document.hidden || leaving) animation.pause();
    else animation.play();
  };
  const rebuild = () => {
    const time = animation?.currentTime ?? 0;
    animation?.cancel();
    animation = null;
    glove.style.removeProperty('will-change');
    if (reduced.matches) return;
    // Match the existing stickers' visible-pixel compensation for hero zoom.
    let scale = 1;
    for (let node = glove.parentElement; node && node !== hero.parentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
      scale *= (parseFloat(style.zoom) || 1) * Math.hypot(matrix.a, matrix.b);
    }
    const strength = (mobile.matches ? .5 : 1) / scale;
    // Drift in a soft loop; the fingertip briefly crosses the upper-right edge.
    const poses = [
      [0, 8, -5, -2], [.24, 3, -8, -1], [.51, -12, 7, 2],
      [.57, -14, 9, 3], [.64, -10, 5, 1], [.82, 5, 0, -1], [1, 8, -5, -2],
    ];
    animation = glove.animate(poses.map(([offset, x, y, angle]) => ({
      offset, easing: 'ease-in-out',
      transform: `translate3d(${x * strength}px,calc(-48% + ${y * strength}px),0) rotate(${-20 + angle * (mobile.matches ? .5 : 1)}deg)`,
    })), { duration, iterations: Infinity });
    glove.style.willChange = 'transform';
    animation.pause();
    animation.currentTime = time;
    sync();
  };
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { leaving = true; sync(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  reduced.addEventListener('change', rebuild);
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuild);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      sync();
    }).observe(hero);
  } else inView = true;
  rebuild();
})();
