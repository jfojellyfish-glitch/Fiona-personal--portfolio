/* v28 — restrained, progressive-enhancement scroll motion.
   No external libraries, motion is off with prefers-reduced-motion. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;

  // The source already uses deliberate <br> breaks. Animate those actual lines
  // individually, without changing copy or the existing type scale.
  const copySelectors = [
    '.works .section-top h2',
    '.note-band .inner > p',
    '.notes h2',
    '.about .section-top h2',
    '.contact h2',
    '.about-poem .about-name',
    '.about-poem .about-given-name',
    '.about-poem > p:not(.about-name):not(.about-given-name):not(.about-slogan)',
    '.about-poem .about-slogan'
  ];

  const lineBlocks = Array.from(document.querySelectorAll(copySelectors.join(',')));
  const linesObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-animated');
      observer.unobserve(entry.target);
    }
  }, {rootMargin:'0px 0px -10% 0px', threshold:0.08});

  function prepareLines(block, blockIndex) {
    // Text and <br> only: links or custom markup should never be rewritten.
    const children = [...block.childNodes];
    if (children.some(node => node.nodeType === 1 && node.tagName !== 'BR')) return;
    const parts = [''];
    for (const node of children) {
      if (node.nodeType === 1 && node.tagName === 'BR') parts.push('');
      else if (node.nodeType === 3) parts[parts.length - 1] += node.textContent;
    }
    if (!parts.some(part => part.trim())) return;
    const fragment = document.createDocumentFragment();
    parts.forEach((content, i) => {
      const mask = document.createElement('span');
      mask.className = 'motion-line-mask';
      const line = document.createElement('span');
      line.className = 'motion-line-text';
      line.textContent = content || '\u00a0';
      const baseDelay = block.closest('.about-poem') ? Math.min(blockIndex * 45, 180) : 0;
      line.style.setProperty('--line-delay', `${baseDelay + i * 210}ms`);
      mask.appendChild(line);
      fragment.appendChild(mask);
    });
    block.replaceChildren(fragment);
    block.classList.add('motion-lines');
    linesObserver.observe(block);
  }
  lineBlocks.forEach(prepareLines);

  const rowObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-animated');
      observer.unobserve(entry.target);
    }
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.04});
  document.querySelectorAll('.works .work-list > details').forEach((row, i) => {
    row.dataset.rowReveal = '';
    row.style.setProperty('--row-delay', `${i * 170}ms`);
    rowObserver.observe(row);
  });

  const apple = document.querySelector('.hero-right .apple');
  const hero = document.querySelector('.hero');
  const notesWall = document.querySelector('.notes .wall');
  const entries = [
    {figure:notesWall?.querySelector('.lotus'), x:0, y:-7},
    {figure:notesWall?.querySelector('.fig'), x:7, y:12},
    {figure:notesWall?.querySelector('.breath'), x:-7, y:-11}
  ].filter(item => item.figure).map(item => ({...item, link:item.figure.querySelector('.archive-entry-link')}));

  let pending = false;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function centeredProgress(element) {
    const rect = element.getBoundingClientRect();
    // Normalized distance from the viewport center, so transforms stay bounded.
    const viewport = window.innerHeight;
    const distance = viewport * 0.5 - (rect.top + rect.height * 0.5);
    return clamp(distance / (viewport * 0.48 + rect.height * 0.5), -1, 1);
  }
  function update() {
    pending = false;
    if (document.hidden || document.body.classList.contains('intro-locked') || document.body.classList.contains('archive-open')) return;
    const factor = window.innerWidth <= 700 ? 0.43 : 1;
    if (apple && hero) {
      const rect=hero.getBoundingClientRect();
      if (rect.bottom > -80 && rect.top < innerHeight + 80)
        apple.style.setProperty('--motion-apple-y', `${(centeredProgress(hero) * 11 * factor).toFixed(2)}px`);
    }
    if (notesWall) {
      const rect=notesWall.getBoundingClientRect();
      if (rect.bottom > -110 && rect.top < innerHeight + 110) {
        // Each archive item drifts in a different direction, while staying clickable.
        for (const {figure, link, x, y} of entries) {
          const progress = centeredProgress(figure);
          link.style.setProperty('--motion-drift-x', `${(progress * x * factor).toFixed(2)}px`);
          link.style.setProperty('--motion-drift-y', `${(progress * y * factor).toFixed(2)}px`);
        }
      }
    }
  }
  const schedule = () => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  };
  document.documentElement.classList.add('motion-v28');
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  document.addEventListener('visibilitychange', schedule);
  document.getElementById('intro-enter')?.addEventListener('click', schedule);
  schedule();
})();
