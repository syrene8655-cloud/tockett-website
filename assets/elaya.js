/* Progressive enhancement: content stays visible without JavaScript or reduced motion. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const words = document.querySelectorAll('.elaya-benefit-copy h2 span');
  let observer;
  const setup = () => {
    observer?.disconnect();
    document.body.classList.remove('elaya-motion');
    if (preference.matches || !('IntersectionObserver' in window)) return;
    document.body.classList.add('elaya-motion');
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.add('is-read');observer.unobserve(entry.target);}
      });
    }, {rootMargin: '0px 0px -18% 0px', threshold: .5});
    words.forEach((word, index) => {word.style.transitionDelay = `${index * 65}ms`;observer.observe(word);});
  };
  setup();
  preference.addEventListener('change', setup);
})();
