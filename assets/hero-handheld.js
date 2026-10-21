(() => {
  // Layer 51 lets the phone cross the masthead at the top; sticky navigation
  // returns to layer 52 after scrolling so it remains readable and reachable.
  const syncMasthead = () => document.documentElement.classList.toggle('hero-past-top', scrollY > 8);
  syncMasthead();
  window.addEventListener('scroll', syncMasthead, { passive: true });
  window.addEventListener('pageshow', syncMasthead);
  const video = document.querySelector('#hero-desktop');
  if (!video) return;
  const screen = video.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let failed = false;
  let playRequest = 0;
  const sync = () => {
    const request = ++playRequest;
    if (reduced.matches || !inView || document.visibilityState === 'hidden' || failed) {
      video.pause();
      screen.classList.remove('is-playing');
      return;
    }
    setTimeout(() => {
      if (request === playRequest && video.readyState === 0 && video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) showFallback();
    }, 500);
    video.play().catch(() => {
      if (request !== playRequest || failed) return;
      screen.classList.remove('is-playing');
      if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        showFallback();
        return;
      }
    });
  };
  video.addEventListener('playing', () => {
    if (reduced.matches || !inView || document.visibilityState === 'hidden') {
      video.pause();
      return;
    }
    screen.classList.add('is-playing');
  });
  // Keep the last decoded frame visible while a loop seeks/buffers. Switching
  // back to the JPEG on `waiting` produces a visible flash at the loop seam.
  ['pause', 'emptied'].forEach(type => video.addEventListener(type, () => screen.classList.remove('is-playing')));
  const showFallback = () => {
    failed = true;
    screen.classList.remove('is-playing');
  };
  video.addEventListener('error', showFallback);
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', showFallback));
  video.addEventListener('loadeddata', () => { failed = false; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', () => video.pause());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.01 }).observe(document.querySelector('.hero-device'));
  }
  if (video.error) showFallback();
  sync();
})();
