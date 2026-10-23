/* Load the original media when its surface is needed, after first-screen art. */
(() => {
  'use strict';
  const desktop = matchMedia('(min-width: 768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('img[data-fallback-src]').forEach(image => {
    const fallback = () => {
      if (!image.dataset.fallbackSrc) return;
      image.src = image.dataset.fallbackSrc;
      delete image.dataset.fallbackSrc;
    };
    image.addEventListener('error', fallback, { once: true });
    if (image.complete && !image.naturalWidth && !image.src.startsWith('data:')) fallback();
  });
  const desktopQueue = [];
  const queued = new Set();
  let desktopRequests = 0;
  const drainDesktopArt = () => {
    while (desktop.matches && desktopRequests < 2 && desktopQueue.length) {
      const image = desktopQueue.shift();
      desktopRequests++;
      const complete = () => {
        image.removeEventListener('load', complete);
        image.removeEventListener('error', complete);
        desktopRequests--;
        drainDesktopArt();
      };
      image.addEventListener('load', complete, { once: true });
      image.addEventListener('error', complete, { once: true });
      image.src = image.dataset.desktopSrc;
      delete image.dataset.desktopSrc;
    }
  };
  const loadDesktopArt = () => {
    if (!desktop.matches) return;
    document.querySelectorAll('img[data-desktop-src]').forEach(image => {
      if (!queued.has(image)) { queued.add(image); desktopQueue.push(image); }
    });
    drainDesktopArt();
  };
  loadDesktopArt();
  desktop.addEventListener('change', loadDesktopArt);

  const images = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    image.src = image.dataset.lazySrc;
    delete image.dataset.lazySrc;
    images.unobserve(image);
  }), { rootMargin: '200px' });
  document.querySelectorAll('img[data-lazy-src]').forEach(image => images.observe(image));

  let heroMayLoad = false;
  const inView = new Map();
  const activate = video => {
    let changed = false;
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
      delete source.dataset.src;
      changed = true;
    });
    if (changed) video.load();
  };
  const visibleMedia = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target;
    const visible = entry.isIntersecting && entry.intersectionRatio >= (video.id === 'hero-desktop' ? .01 : .6);
    inView.set(video, visible);
    if (visible && !reduced.matches && (video.id !== 'hero-desktop' || heroMayLoad)) activate(video);
  }), { threshold: [0, .01, .6] });
  document.querySelectorAll('video').forEach(video => visibleMedia.observe(video));
  const afterFirstScreen = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    heroMayLoad = true;
    inView.forEach((visible, video) => { if (visible && !reduced.matches) activate(video); });
  }));
  if (document.readyState === 'complete') afterFirstScreen();
  else window.addEventListener('load', afterFirstScreen, { once: true });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) inView.forEach((visible, video) => { if (visible) activate(video); });
  });
  document.addEventListener('media-modal-change', event => {
    if (event.detail.open && event.detail.video) activate(event.detail.video);
  });
  document.querySelector('.promo-audio')?.addEventListener('click', () => {
    const video = document.querySelector('#promo-video');
    if (video) activate(video);
  }, { capture: true });
  document.documentElement.dataset.mediaLoader = 'ready';
})();
