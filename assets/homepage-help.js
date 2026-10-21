(() => {
  const dialog = document.querySelector('#tutorial-dialog');
  if (!dialog || !dialog.showModal) return;
  const video = dialog.querySelector('video');
  const title = dialog.querySelector('h2');
  const error = dialog.querySelector('.tutorial-error');
  const direct = error.querySelector('a');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let trigger = null;
  let overflow = '';
  let backdropPressed = false;
  document.querySelectorAll('[data-tutorial]').forEach(link => {
    link.addEventListener('click', event => {
      // Modified clicks keep the direct, downloadable video link available.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (dialog.open) return;
      trigger = link;
      title.textContent = link.dataset.tutorial;
      error.hidden = true;
      direct.href = link.href;
      video.src = link.href;
      video.muted = true;
      overflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
      document.dispatchEvent(new CustomEvent('media-modal-change', {detail: {open: true, video: null}}));
      if (!reduced.matches) video.play().catch(() => {});
    });
  });
  dialog.querySelector('.tutorial-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('pointerdown', event => {backdropPressed = event.target === dialog});
  dialog.addEventListener('click', event => {
    if (backdropPressed && event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    document.documentElement.style.overflow = overflow;
    document.dispatchEvent(new CustomEvent('media-modal-change', {detail: {open: false, video: null}}));
    trigger?.focus({preventScroll: true});
    trigger = null;
  });
  video.addEventListener('error', () => {if (dialog.open) error.hidden = false});
  document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause()});
  reduced.addEventListener('change', () => {if (reduced.matches) video.pause()});
  window.addEventListener('pagehide', () => {if (dialog.open) dialog.close()});
})();
