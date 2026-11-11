(()=>{const reduce=matchMedia('(prefers-reduced-motion: reduce)');document.querySelectorAll('.cuckoo-name').forEach(h=>{
let played=false;
const reset=()=>h.classList.remove('is-animating');
h.addEventListener('animationend',e=>{if(e.animationName==='cuckoo-head-peek')reset()});
new IntersectionObserver(entries=>{const entry=entries[0];if(!entry.isIntersecting){played=false;reset();return}if(entry.intersectionRatio>=.5&&!played){played=true;if(!reduce.matches)h.classList.add('is-animating')}},{threshold:[0,.5]}).observe(h);
reduce.addEventListener('change',()=>{if(reduce.matches)reset()});
});const videos=[...document.querySelectorAll('#cuckoo video')];videos.forEach(v=>{const io=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!document.hidden&&!reduce.matches){const source=v.querySelector('source[data-src]');if(source){source.src=source.dataset.src;source.removeAttribute('data-src');v.load()}v.play().catch(()=>{})}else v.pause()},{threshold:.2});io.observe(v);document.addEventListener('visibilitychange',()=>{if(document.hidden)v.pause()});reduce.addEventListener('change',()=>{if(reduce.matches)v.pause()})})})();
