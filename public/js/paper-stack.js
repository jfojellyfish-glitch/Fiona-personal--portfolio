/* v61 — Section motion based on the approved V12: never scale a panel,
 * keep paper full-bleed, animate only existing content groups.
 * Tall sections (especially mobile Notes/About) scroll to their natural end
 * before the next paper covers them. Respect reduced motion. */
(() => {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !CSS.supports('position','sticky')) return;

  const root=document.getElementById('portfolio-site');
  const site=root?.querySelector(':scope > .site');
  const main=site?.querySelector(':scope > main');
  const band=root?.querySelector(':scope > section.note-band');
  const lastSite=root?.querySelectorAll(':scope > .site')[1];
  if (!site || !main || !band || !lastSite) return;

  // Original markup is split into two .site shells with a full-width pink
  // statement between them. Bring the same real elements into one main so
  // their sticky layer order is continuous. Nothing is cloned or clipped.
  main.appendChild(band);
  while (lastSite.firstChild) main.appendChild(lastSite.firstChild);
  lastSite.remove();

  const selectors=['.hero','.works','.note-band','.notes','.about','.contact'];
  const panels=selectors.map(s=>main.querySelector(':scope > section'+s));
  if (panels.some(p=>!p)) return;

  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
  let ticking=false;
  let drawerOpen=false;

  panels.forEach((panel,i)=>{
    panel.classList.add('paper-stack-panel');
    panel.style.setProperty('--paper-z',String(i+1));
  });
  document.documentElement.classList.add('paper-stack-enabled');

  function measure() {
    const vh=window.innerHeight;
    for (const panel of panels) {
      // Tall chapters must be able to reveal their bottom-most paragraphs.
      // Negative sticky top is crucial on narrow/mobile viewports.
      const height=panel.offsetHeight;
      panel.style.setProperty('--paper-stick-top',Math.min(0,vh-height)+'px');
    }
    schedule();
  }

  function update() {
    ticking=false;
    if (document.hidden || drawerOpen) return;
    const vh=window.innerHeight;
    const narrow=window.innerWidth<=700;
    const rects=panels.map(p=>p.getBoundingClientRect());
    panels.forEach((panel,i)=>{
      const rect=rects[i];
      const next=rects[i+1];
      const entering=i===0?1:smooth((vh-rect.top)/(vh*.74));
      const leaving=next?smooth((vh-next.top)/(vh*.88)):0;
      const tall=panel.offsetHeight>vh*1.07;
      const safeMobile=narrow && (tall || window.innerWidth<360);

      // Keep the actual panel fully sized at all times. Move all direct child
      // groups by the same small amount, never reflow a paragraph individually.
      const rise=safeMobile?0:narrow?9:25;
      const recede=safeMobile?0:narrow?6:20;
      const y=(1-entering)*rise-leaving*recede;
      const fade=safeMobile?1:1-(1-entering)*(narrow?.02:.055)-leaving*(narrow?.025:.11);
      panel.style.setProperty('--paper-content-y',y.toFixed(2)+'px');
      panel.style.setProperty('--paper-content-opacity',fade.toFixed(3));
      panel.classList.toggle('paper-stack-active',rect.top<vh*1.05 && rect.bottom>-vh*.08);
    });
  }

  function schedule() {
    if (ticking) return;
    ticking=true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  document.getElementById('intro-enter')?.addEventListener('click',()=>requestAnimationFrame(schedule));

  const observer=new ResizeObserver(measure);
  panels.forEach(panel=>observer.observe(panel));
  if (document.fonts?.ready) document.fonts.ready.then(measure);
  window.visualViewport?.addEventListener('resize',measure,{passive:true});
  const setDrawer=()=>{drawerOpen=document.body.classList.contains('archive-open');if(!drawerOpen)schedule();};
  new MutationObserver(setDrawer).observe(document.body,{attributes:true,attributeFilter:['class']});
  measure();
})();
