(() => {
  const surfaces = [...document.querySelectorAll('.hero-screen')];
  if (!surfaces.length) return;
  const english = document.documentElement.lang.startsWith('en');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preferredSize = 351;
  let size = preferredSize;
  const zoom = 2.8;
  const lens = document.createElement('div');
  lens.className = 'media-magnifier';
  lens.hidden = true;
  lens.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = Math.round(size * ratio);
  lens.append(canvas);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const help = document.createElement('p');
  help.id = 'media-magnifier-help';
  help.className = 'media-magnifier-help';
  help.textContent = english
    ? 'Hover to see details. With keyboard focus, use the arrow keys to move the magnifier. Press Esc to close.'
    : '悬停查看细节。键盘聚焦后用方向键移动放大镜，按 Esc 关闭。';
  document.body.append(lens, help);
  let active = null;
  let frame = 0;
  let lastDraw = 0;

  const hide = () => {
    active = null;
    cancelAnimationFrame(frame);
    frame = 0;
    lens.hidden = true;
  };
  const wake = () => {
    if (!active) return;
    active.updated = performance.now();
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const sourceFor = surface => {
    const video = surface.querySelector('video');
    if (video && video.readyState >= 2 && video.videoWidth &&
        Number(getComputedStyle(video).opacity) > 0) return video;
    return [...surface.querySelectorAll('img')].find(img =>
      img.complete && img.naturalWidth && Number(getComputedStyle(img).opacity) > 0);
  };
  const offset = (value, free) => {
    if (value.endsWith('%')) return free * parseFloat(value) / 100;
    if (value === 'left' || value === 'top') return 0;
    if (value === 'right' || value === 'bottom') return free;
    if (value === 'center') return free / 2;
    return parseFloat(value) || 0;
  };
  const draw = () => {
    const { surface, x, y } = active;
    const bounds = surface.getBoundingClientRect();
    const media = sourceFor(surface);
    if (!media || x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
      lens.hidden = true;
      return false;
    }
    // getBoundingClientRect includes the existing upward card transform.
    const box = media.getBoundingClientRect();
    const style = getComputedStyle(media);
    const width = media.videoWidth || media.naturalWidth;
    const height = media.videoHeight || media.naturalHeight;
    const fit = style.objectFit === 'contain' ? Math.min : Math.max;
    const scale = fit(box.width / width, box.height / height);
    const paintedWidth = width * scale;
    const paintedHeight = height * scale;
    const [positionX, positionY = '50%'] = style.objectPosition.split(' ');
    const left = box.left + offset(positionX, box.width - paintedWidth);
    const top = box.top + offset(positionY, box.height - paintedHeight);
    if (x < left || x > left + paintedWidth || y < top || y > top + paintedHeight ||
        x < box.left || x > box.right || y < box.top || y > box.bottom) {
      lens.hidden = true;
      return false;
    }
    const gutter = 12;
    const masthead = document.querySelector('.masthead');
    const safeTop = Math.max(gutter, (masthead?.getBoundingClientRect().bottom || 0) + gutter);
    const fittedSize = Math.min(preferredSize, innerWidth - 2 * gutter, innerHeight - safeTop - gutter);
    if (fittedSize <= 0) {
      lens.hidden = true;
      return false;
    }
    if (size !== fittedSize) {
      size = fittedSize;
      canvas.width = canvas.height = Math.round(size * ratio);
      lens.style.width = lens.style.height = `${size}px`;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#151716';
    context.fillRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    try {
      context.drawImage(media, size / 2 - (x - left) * zoom,
        size / 2 - (y - top) * zoom, paintedWidth * zoom, paintedHeight * zoom);
    } catch {
      lens.hidden = true;
      return false;
    }
    const lensX = x + size + 24 <= innerWidth - gutter ? x + 24 : x - size - 24;
    const lensY = Math.max(safeTop, Math.min(y + 24, innerHeight - size - gutter));
    lens.style.left = `${Math.max(gutter, Math.min(lensX, innerWidth - size - gutter))}px`;
    lens.style.top = `${Math.min(lensY, innerHeight - size - gutter)}px`;
    lens.hidden = false;
    return media instanceof HTMLVideoElement && !media.paused;
  };
  function tick(now) {
    frame = 0;
    if (!active) return;
    if (now - lastDraw < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    lastDraw = now;
    const playing = draw();
    // Still images only need repainting while the pointer/card is moving.
    if (active && (playing || now - active.updated < 500)) frame = requestAnimationFrame(tick);
  }
  const activate = (surface, x, y, keyboard = false) => {
    active = { surface, x, y, keyboard, updated: performance.now() };
    wake();
  };
  surfaces.forEach(surface => {
    surface.dataset.magnify = '';
    surface.tabIndex = 0;
    surface.setAttribute('role', 'group');
    const media = surface.querySelector('video, img');
    const label = media?.getAttribute('aria-label') || media?.getAttribute('alt') || (english ? 'Product preview' : '产品预览');
    surface.setAttribute('aria-label', label);
    surface.setAttribute('aria-describedby', help.id);
    const point = event => {
      if (!fine.matches || event.pointerType !== 'mouse' || event.buttons) return;
      activate(surface, event.clientX, event.clientY);
    };
    surface.addEventListener('pointerenter', point);
    surface.addEventListener('pointermove', point);
    surface.addEventListener('pointerleave', () => {
      if (active?.surface === surface && !active.keyboard) hide();
    });
    surface.addEventListener('focus', () => {
      if (!surface.matches(':focus-visible')) return;
      const box = surface.getBoundingClientRect();
      activate(surface, box.left + box.width / 2, box.top + box.height / 2, true);
    });
    surface.addEventListener('blur', () => { if (active?.surface === surface) hide(); });
    surface.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        hide();
        event.stopPropagation();
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const box = surface.getBoundingClientRect();
      const x = active?.surface === surface ? active.x : box.left + box.width / 2;
      const y = active?.surface === surface ? active.y : box.top + box.height / 2;
      activate(surface,
        Math.max(box.left + 1, Math.min(box.right - 1, x + (event.key === 'ArrowRight' ? 16 : event.key === 'ArrowLeft' ? -16 : 0))),
        Math.max(box.top + 1, Math.min(box.bottom - 1, y + (event.key === 'ArrowDown' ? 16 : event.key === 'ArrowUp' ? -16 : 0))), true);
    });
    surface.querySelectorAll('video').forEach(video => {
      ['playing', 'pause', 'loadeddata', 'error'].forEach(type => video.addEventListener(type, wake));
    });
  });
  // Do not compete with rail dragging, page scrolling or controls.
  document.addEventListener('pointerdown', hide, { capture: true, passive: true });
  document.addEventListener('scroll', hide, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('resize', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  fine.addEventListener('change', hide);
  reduced.addEventListener('change', wake);
})();
