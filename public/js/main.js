(() => {
  const logo = document.querySelector('nav#top .lotus-brand-art svg');
  const entrance = document.querySelector('#intro-enter');
  if (!logo || !logo.querySelector('circle')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  logo.classList.add('lotus-awaiting');
  let intervalId = null;
  const playOnce = () => {
    logo.classList.remove('lotus-drawing');
    void logo.getBoundingClientRect();
    window.requestAnimationFrame(() => logo.classList.add('lotus-drawing'));
  };
  const beginLoop = () => {
    playOnce();
    if (intervalId) return;
    intervalId = window.setInterval(playOnce, 7800);
  };
  if (entrance && document.body.classList.contains('intro-locked')) {
    entrance.addEventListener('click', () => window.setTimeout(beginLoop, 180), {once:true});
  } else {
    beginLoop();
  }
})();

/* Archive drawer routing now lives in components/archive/ArchiveDrawers.tsx. */

/* Match the tall left glyph to the biography height, including after resizing. */
(() => {
  const glyph = document.querySelector('.about-body .about-identity .question');
  const prose = document.querySelector('.about-body .about-poem');
  if (!glyph || !prose) return;
  const update = () => {
    if (window.matchMedia('(max-width:650px)').matches) {
      glyph.style.removeProperty('--about-vertical-scale');
      return;
    }
    const natural = glyph.offsetHeight;
    if (natural > 0) glyph.style.setProperty('--about-vertical-scale',(prose.offsetHeight/natural*1.02).toFixed(4));
  };
  new ResizeObserver(update).observe(prose);
  window.addEventListener('resize',update,{passive:true});
  if (document.fonts?.ready) document.fonts.ready.then(update);
  update();
})();

/* Gentle one-time section reveals. Optional foundation for future scroll effects.
   IntersectionObserver avoids scroll-event polling and respects reduced-motion. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const targets = [
    '.works .section-top', '.works .work-list',
    '.note-band .inner', '.notes .section-top',
    '.notes .wall .lotus', '.notes .wall .fig', '.notes .wall .breath',
    '.about .section-top', '.about-body .about-identity', '.about-body .about-poem',
    '.contact .contact-details'
  ].map(selector => document.querySelector(selector)).filter(Boolean);
  if (!targets.length) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, {rootMargin:'0px 0px -7% 0px', threshold:0.06});
  for (const element of targets) {
    element.setAttribute('data-reveal','');
    observer.observe(element);
  }
  document.documentElement.classList.add('motion-enabled');
})();
