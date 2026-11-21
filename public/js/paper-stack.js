/* v60 — Fiona's approved section-to-section paper-stack choreography.
 * Unlike the static prototype, real sections keep intrinsic content height:
 * long chapters scroll through fully before they can pin and be covered.
 * Scroll-driven, reversible, no external libraries or element reparenting. */
(() => {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches || !CSS.supports('position','sticky'))return;

  const site=document.querySelector('#portfolio-site .site');
  if(!site)return;
  const selectors=['.hero','.works','.note-band','.notes','.about','.contact'];
  const panels=selectors.map(selector=>site.querySelector(':scope > section'+selector));
  if(panels.some(el=>!el))return;

  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t)};
  let scheduled=false;
  let scrollActive=true;

  panels.forEach((panel,index)=>{
    panel.classList.add('paper-stack-panel');
    panel.style.setProperty('--paper-z',String(index+1));
  });
  document.documentElement.classList.add('paper-stack-enabled');

  const measure=()=>{
    const viewport=window.innerHeight;
    panels.forEach(panel=>{
      // A tall section must scroll normally until its bottom reaches the screen,
      // rather than pinning its heading and hiding everything below the fold.
      const height=panel.offsetHeight;
      panel.style.setProperty('--paper-stick-top',Math.min(0,viewport-height)+'px');
    });
    schedule();
  };
  const update=()=>{
    scheduled=false;
    if(document.hidden || !scrollActive)return;
    const height=window.innerHeight;
    const rects=panels.map(panel=>panel.getBoundingClientRect());
    const small=window.innerWidth<=700;
    const translate=small?24:38;
    const leave=small?11:19;
    for(let index=0;index<panels.length;index++){
      const panel=panels[index],rect=rects[index];
      const before=smooth((height-rect.top)/(height*.66));
      const next=rects[index+1];
      const after=next?smooth((height-next.top)/(height*.76)):0;
      const shift=translate*(1-before)-leave*after;
      const scale=(1-(1-before)*(small?.010:.014))*(1-after*(small?.017:.026));
      const radius=Math.round((1-before)*17+after*(small?0:12));
      panel.style.setProperty('--paper-enter-y',shift.toFixed(2)+'px');
      panel.style.setProperty('--paper-scale',scale.toFixed(4));
      panel.style.setProperty('--paper-radius',radius+'px');
      panel.classList.toggle('paper-stack-active',
        rect.top<height*1.15 && rect.bottom>height*-.3);
    }
  };
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  document.getElementById('intro-enter')?.addEventListener('click',()=>{
    requestAnimationFrame(schedule);
  });
  // The archive drawers are overlays. Keep section motion frozen beneath them.
  const updateOverlayState=()=>{
    scrollActive=!document.body.classList.contains('archive-open');
    if(scrollActive)schedule();
  };
  new MutationObserver(updateOverlayState).observe(document.body,
    {attributes:true,attributeFilter:['class']});

  const observer=new ResizeObserver(()=>measure());
  panels.forEach(panel=>observer.observe(panel));
  if(document.fonts?.ready)document.fonts.ready.then(measure);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',measure,{passive:true});
  measure();
})();
