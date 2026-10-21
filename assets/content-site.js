// Content videos are opt-in and stay paused when the page is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.querySelectorAll('.reading-body video').forEach(video => video.pause());
});
window.addEventListener('pagehide', () => document.querySelectorAll('.reading-body video').forEach(video => video.pause()));

// Native details keeps language selection usable before JavaScript loads.
(() => {
  const picker = document.querySelector('.site-language-picker');
  if (!picker) return;
  const trigger = picker.querySelector('summary');
  const choices = [...picker.querySelectorAll('.language-menu a')];
  const close = () => { picker.open = false; };

  document.addEventListener('pointerdown', event => {
    if (!picker.contains(event.target)) close();
  });
  picker.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!picker.contains(document.activeElement)) close();
    });
  });
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && picker.open) {
      event.preventDefault();
      close();
      trigger.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      picker.open = true;
      const index = choices.indexOf(document.activeElement);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = index < 0 ? (direction > 0 ? 0 : choices.length - 1) : (index + direction + choices.length) % choices.length;
      choices[next].focus();
    }
  });
  choices.forEach(choice => choice.addEventListener('click', () => {
    if (location.hash) choice.hash = location.hash;
  }));
  window.addEventListener('pagehide', close);
})();
