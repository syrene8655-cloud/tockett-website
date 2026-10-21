/* Independently authored from the public Modal Cards demo; no React Bits Pro source is included. */
(() => {
  const triggers = [...document.querySelectorAll('.editor-modal-trigger')];
  if (!triggers.length) return;
  const english = document.documentElement.lang.startsWith('en');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.createElement('dialog');
  dialog.id = 'editor-image-modal';
  dialog.className = 'editor-image-modal';
  dialog.setAttribute('aria-labelledby', 'editor-modal-title');
  dialog.innerHTML = `<div class="editor-modal-backdrop" aria-hidden="true"></div>
    <article class="editor-modal-card">
      <header class="editor-modal-header">
        <div class="editor-modal-heading"><h2 class="editor-modal-title" id="editor-modal-title"></h2><p class="editor-modal-hint">${english ? 'Scroll to view the full screenshot' : '上下滚动查看完整截图'}</p></div>
        <div class="editor-modal-actions"><button type="button" class="editor-modal-close" autofocus aria-label="${english ? 'Close' : '关闭'}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></button></div>
      </header>
      <div class="editor-modal-scroll" tabindex="0" role="region" aria-label="${english ? 'Image enlarged. Scroll to see more.' : '图片已放大，可上下滚动查看'}">
        <img class="editor-modal-image" alt="" draggable="false"/>
        <div class="editor-modal-player" hidden></div>
        <p class="editor-modal-description"></p>
      </div>
    </article>`;
  document.body.append(dialog);
  const card = dialog.querySelector('.editor-modal-card');
  const backdrop = dialog.querySelector('.editor-modal-backdrop');
  const scroll = dialog.querySelector('.editor-modal-scroll');
  const image = dialog.querySelector('.editor-modal-image');
  const title = dialog.querySelector('.editor-modal-title');
  const description = dialog.querySelector('.editor-modal-description');
  const closeButton = dialog.querySelector('.editor-modal-close');
  const hint = dialog.querySelector('.editor-modal-hint');
  const player = dialog.querySelector('.editor-modal-player');
  const actions = dialog.querySelector('.editor-modal-actions');
  let source = null;
  let transfer = null;
  let ghost = null;
  let paintFrame = 0;
  let animations = [];
  let version = 0;
  let pageLock = null;
  let gesture = null;
  let backdropPressed = false;
  const moveEmbed = (embed, parent, before = null) => {
    if (parent.moveBefore) parent.moveBefore(embed, before);
    else parent.insertBefore(embed, before);
  };
  const intersect = (...boxes) => {
    const left = Math.max(...boxes.map(b => b.left));
    const top = Math.max(...boxes.map(b => b.top));
    return { left, top, width: Math.max(0, Math.min(...boxes.map(b => b.right)) - left),
      height: Math.max(0, Math.min(...boxes.map(b => b.bottom)) - top) };
  };
  const paintedImage = element => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const naturalWidth = element.videoWidth || element.naturalWidth || element.width;
    const naturalHeight = element.videoHeight || element.naturalHeight || element.height;
    const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(box.width / naturalWidth, box.height / naturalHeight);
    const width = naturalWidth * scale, height = naturalHeight * scale;
    const [x, y = '50%'] = style.objectPosition.split(' ');
    const offset = (value, free) => value.endsWith('%') ? free * parseFloat(value) / 100 : parseFloat(value) || 0;
    return { left: box.left + offset(x, box.width - width), top: box.top + offset(y, box.height - height), width, height };
  };
  const sourcePose = () => {
    const video = source.querySelector('video');
    const media = video?.videoWidth && Number(getComputedStyle(video).opacity) > 0 ? video : source.querySelector('img');
    return {
      frame: intersect(source.getBoundingClientRect(), (source.closest('.media-track') || source).getBoundingClientRect(), { left: 0, top: 0, right: innerWidth, bottom: innerHeight }),
      picture: paintedImage(media),
    };
  };
  const modalPose = () => {
    const media = transfer?.video || image;
    return { frame: intersect(media.getBoundingClientRect(), scroll.getBoundingClientRect()), picture: paintedImage(media.videoWidth ? media : transfer?.embed.querySelector('img') || image) };
  };
  const ghostPose = () => ({ frame: ghost.getBoundingClientRect(), picture: ghost.firstElementChild.getBoundingClientRect() });
  const clearMotion = () => {
    cancelAnimationFrame(paintFrame);
    paintFrame = 0;
    animations.forEach(animation => animation.cancel());
    animations = [];
    ghost?.remove();
    ghost = null;
    card.style.removeProperty('opacity');
  };
  const lockPage = () => {
    const root = document.documentElement;
    pageLock = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
  };
  const unlockPage = () => {
    if (!pageLock) return;
    document.documentElement.style.overflow = pageLock.overflow;
    document.documentElement.style.scrollbarGutter = pageLock.gutter;
    pageLock = null;
  };
  const notifyPlayback = open => document.dispatchEvent(new CustomEvent('media-modal-change', { detail: { open, video: open ? transfer?.video : null } }));
  const syncHint = () => {
    if (!transfer) return;
    hint.textContent = transfer.video.error || transfer.video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ? (english ? 'Video can\'t play right now. Please try again later.' : '视频暂时无法播放，请稍后重试。') : reduced.matches && transfer.video.paused
      ? (english ? 'Paused because Reduce Motion is on' : '已暂停（已开启减少动态效果）')
      : (transfer.video.muted ? (english ? 'Muted · Looping' : '静音循环播放') : (english ? 'Looping' : '循环播放'));
  };
  const fitVideo = () => {
    if (!transfer || !dialog.open) return;
    const poster = transfer.embed.querySelector('img');
    const ratio = (transfer.video.videoWidth || poster.naturalWidth) / (transfer.video.videoHeight || poster.naturalHeight);
    const padding = parseFloat(getComputedStyle(dialog).paddingLeft);
    const maxWidth = Math.min(1120, innerWidth - padding * 2);
    let width = Math.min(maxWidth, (innerHeight - padding * 2 - 82) * ratio);
    player.style.aspectRatio = String(ratio);
    // Account for a wrapping localized title instead of imposing a fixed header height.
    for (let i = 0; i < 4; i++) {
      card.style.width = `${width}px`;
      const available = innerHeight - padding * 2 - dialog.querySelector('header').getBoundingClientRect().height - 2;
      width = Math.min(maxWidth, Math.max(1, available) * ratio);
    }
    card.style.width = `${width}px`;
  };
  const transferVideo = video => {
    const embed = video.parentElement;
    const placeholder = document.createElement('div');
    placeholder.className = embed.className.replace('is-playing', '').trim();
    placeholder.append(embed.querySelector('img').cloneNode(true));
    const audio = video.id === 'promo-video' ? document.querySelector('.promo-audio') : null;
    const audioAnchor = audio ? document.createComment('promo audio position') : null;
    transfer = { video, embed, placeholder, audio, audioAnchor };
    embed.before(placeholder);
    moveEmbed(embed, player);
    if (audio) { audio.before(audioAnchor); actions.prepend(audio); }
    ['volumechange', 'play', 'pause'].forEach(type => video.addEventListener(type, syncHint));
    video.addEventListener('error', syncHint, true);
    video.addEventListener('loadedmetadata', fitVideo);
    syncHint();
  };
  const restoreVideo = () => {
    if (!transfer) return;
    const { video, embed, placeholder, audio, audioAnchor } = transfer;
    ['volumechange', 'play', 'pause'].forEach(type => video.removeEventListener(type, syncHint));
    video.removeEventListener('error', syncHint, true);
    video.removeEventListener('loadedmetadata', fitVideo);
    moveEmbed(embed, placeholder.parentElement, placeholder);
    placeholder.remove();
    if (audio) audioAnchor.replaceWith(audio);
    transfer = null;
    card.style.removeProperty('width');
  };
  const settleOpen = () => {
    clearMotion();
    source?.classList.remove('editor-modal-source');
    dialog.dataset.state = 'open';
  };
  const finishClose = () => {
    clearMotion();
    const trigger = source;
    restoreVideo();
    source = null;
    trigger?.classList.remove('editor-modal-source');
    dialog.dataset.state = 'closed';
    if (dialog.open) dialog.close();
    unlockPage();
    notifyPlayback(false);
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
  const morph = (from, to, opening) => {
    ghost = document.createElement('div');
    ghost.className = 'editor-modal-morph';
    ghost.setAttribute('aria-hidden', 'true');
    let copy;
    const video = transfer?.video;
    if (video?.readyState >= 2 && video.videoWidth) {
      // One original decoder; only this brief morph paints its live frames.
      copy = document.createElement('canvas');
      copy.width = Math.min(1600, video.videoWidth);
      copy.height = Math.round(copy.width * video.videoHeight / video.videoWidth);
      const context = copy.getContext('2d', { alpha: false });
      const paint = () => {
        if (context && video.readyState >= 2) context.drawImage(video, 0, 0, copy.width, copy.height);
        paintFrame = requestAnimationFrame(paint);
      };
      paint();
    } else {
      copy = document.createElement('img');
      copy.src = transfer?.video.poster || image.src;
      copy.alt = '';
    }
    ghost.append(copy);
    dialog.append(ghost);
    const frame = pose => ({ left: `${pose.frame.left}px`, top: `${pose.frame.top}px`, width: `${pose.frame.width}px`, height: `${pose.frame.height}px`, borderRadius: '0px' });
    const picture = pose => ({ left: `${pose.picture.left - pose.frame.left}px`, top: `${pose.picture.top - pose.frame.top}px`, width: `${pose.picture.width}px`, height: `${pose.picture.height}px` });
    // Interpolate the image dimensions at one constant aspect ratio. The frame
    // changes shape independently, so native UI glyphs never stretch in transit.
    Object.assign(ghost.style, frame(to));
    Object.assign(copy.style, picture(to));
    const duration = opening ? 480 : 360;
    const timing = { duration, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
    animations = [
      ghost.animate([frame(from), frame(to)], timing),
      copy.animate([picture(from), picture(to)], timing),
      backdrop.animate([{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }], { duration, fill: 'both' }),
      card.animate(opening ? [{ opacity: 0 }, { opacity: 0, offset: .42 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: .42 }, { opacity: 0 }], { duration, fill: 'both' }),
      ghost.animate(opening ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 1 }], { duration, fill: 'both' }),
    ];
    return Promise.allSettled(animations.map(animation => animation.finished));
  };
  const open = async trigger => {
    if (dialog.open) return;
    const video = trigger.querySelector('video');
    if (!dialog.showModal) { location.href = video?.currentSrc || video?.querySelector('source').src || trigger.querySelector('img').src; return; }
    const original = trigger.querySelector('img');
    if (!original.complete || !original.naturalWidth) return;
    source = trigger;
    const from = sourcePose();
    const caption = trigger.closest('.media-card, figure').querySelector('figcaption');
    title.textContent = video ? (caption.querySelector('.promo-copy')?.innerText.replaceAll('\n', ' · ') || caption.textContent.trim()) : caption.textContent.trim();
    image.hidden = !!video;
    player.hidden = !video;
    description.hidden = !!video;
    dialog.classList.toggle('editor-modal-video', !!video);
    dialog.classList.toggle('editor-modal-wide', !video && original.naturalWidth > original.naturalHeight);
    if (video) transferVideo(video);
    else {
      description.textContent = original.alt;
      image.src = original.currentSrc || original.src;
      image.alt = original.alt;
      image.width = original.naturalWidth;
      image.height = original.naturalHeight;
      hint.textContent = english ? 'Scroll to view the full screenshot' : '上下滚动查看完整截图';
    }
    scroll.setAttribute('aria-label', video ? (english ? 'Enlarged video' : '放大视频') : (english ? 'Image enlarged. Scroll to see more.' : '图片已放大，可上下滚动查看'));
    scroll.scrollTop = 0;
    lockPage();
    dialog.showModal();
    fitVideo();
    notifyPlayback(true);
    dialog.dataset.state = 'opening';
    const request = ++version;
    if (!reduced.matches && Element.prototype.animate && from.frame.width > 0 && from.frame.height > 0) {
      trigger.classList.add('editor-modal-source');
      await morph(from, modalPose(), true);
    }
    if (request === version) settleOpen();
  };
  const close = async () => {
    if (!dialog.open || dialog.dataset.state === 'closing') return;
    const from = ghost ? ghostPose() : modalPose();
    const request = ++version;
    clearMotion();
    dialog.dataset.state = 'closing';
    source?.classList.add('editor-modal-source');
    const to = sourcePose();
    if (!reduced.matches && Element.prototype.animate && to.frame.width > 0 && to.frame.height > 0) await morph(from, to, false);
    if (request === version) finishClose();
  };
  triggers.forEach(trigger => {
    const video = trigger.querySelector('video');
    const caption = video ? video.getAttribute('aria-label') : trigger.closest('.media-card, figure').querySelector('figcaption').textContent.trim();
    trigger.setAttribute('aria-label', `${video ? (english ? 'Open video: ' : '展开视频：') : (english ? 'Open image: ' : '打开大图：')}${caption}`);
    trigger.addEventListener('pointerdown', event => { gesture = { trigger, x: event.clientX, y: event.clientY, distance: 0 }; });
    trigger.addEventListener('click', event => {
      if (event.detail && gesture?.trigger === trigger && gesture.distance > 6) return;
      open(trigger);
    });
  });
  document.addEventListener('pointerup', event => {
    if (gesture) gesture.distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
  }, true);
  document.addEventListener('pointercancel', () => { if (gesture) gesture.distance = Infinity; }, true);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('pointerdown', event => { backdropPressed = event.target === backdrop || event.target === dialog; });
  dialog.addEventListener('click', event => {
    if (backdropPressed && (event.target === backdrop || event.target === dialog)) close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button,[tabindex="0"]')];
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  });
  dialog.addEventListener('close', () => { if (source) { ++version; finishClose(); } });
  const finishTransition = () => {
    if (!dialog.open) return;
    ++version;
    if (dialog.dataset.state === 'closing') finishClose();
    else { settleOpen(); fitVideo(); }
  };
  window.addEventListener('resize', finishTransition);
  reduced.addEventListener('change', () => { if (reduced.matches) finishTransition(); });
  window.addEventListener('pagehide', () => { ++version; if (dialog.open) finishClose(); });
})();
