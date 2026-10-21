/* Split Flap Text timing/half-flap structure adapted from React Bits.
   License: licenses/react-bits-LICENSE.txt. */
(() => {
  const title = document.querySelector('#airport-title');
  if (!title) return;
  const tiles = [...title.querySelectorAll('.split-flap-text__tile')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = [...'机场牌时钟世界'];
  const flipMs = 120;
  const staggerMs = 60;
  let frame = 0;
  let played = false;

  const half = (classes, char) => {
    const part = document.createElement('span');
    part.className = classes;
    const glyph = document.createElement('span');
    glyph.className = 'split-flap-text__char';
    glyph.textContent = char;
    part.append(glyph);
    return part;
  };

  const render = (tile, current, next = current, flipping = false) => {
    const parts = [
      half('split-flap-text__half split-flap-text__half--top', flipping ? next : current),
      half('split-flap-text__half split-flap-text__half--bottom', current)
    ];
    if (flipping) parts.push(
      half('split-flap-text__flap split-flap-text__flap--front', current),
      half('split-flap-text__flap split-flap-text__flap--back', next)
    );
    tile.classList.toggle('is-flipping', flipping);
    tile.replaceChildren(...parts);
  };

  const settle = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    tiles.forEach(tile => render(tile, tile.dataset.char));
    title.dataset.flapState = motion.matches ? 'reduced' : 'settled';
  };

  const play = () => {
    if (played) return;
    played = true;
    if (motion.matches || document.hidden) { settle(); return; }
    title.dataset.flapState = 'playing';
    const plans = tiles.map((tile, index) => ({
      tile,
      sequence: [...Array.from({length: 8}, () => glyphs[Math.floor(Math.random() * glyphs.length)]), tile.dataset.char],
      delay: index * staggerMs,
      step: -1
    }));
    tiles.forEach(tile => render(tile, '\u00a0'));
    let startedAt;
    const tick = now => {
      if (startedAt === undefined) startedAt = now;
      let running = false;
      plans.forEach(plan => {
        const elapsed = now - startedAt - plan.delay;
        if (elapsed < 0) { running = true; return; }
        const step = Math.floor(elapsed / flipMs);
        if (step < plan.sequence.length) {
          running = true;
          if (step !== plan.step) {
            render(plan.tile, step === 0 ? '\u00a0' : plan.sequence[step - 1], plan.sequence[step], true);
            plan.step = step;
          }
        } else if (plan.step !== plan.sequence.length) {
          render(plan.tile, plan.tile.dataset.char);
          plan.step = plan.sequence.length;
        }
      });
      if (running) frame = requestAnimationFrame(tick);
      else settle();
    };
    frame = requestAnimationFrame(tick);
  };

  title.dataset.flapState = 'ready';
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .6)) {
        observer.disconnect();
        play();
      }
    }, {threshold: .6});
    observer.observe(title);
  } else play();
  motion.addEventListener('change', () => { if (motion.matches) settle(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && frame) settle(); });
  window.addEventListener('pagehide', settle, {once: true});
})();
