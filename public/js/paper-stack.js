/* v66 — Fiona's editorial section rhythm.
 * Keeps the real six section nodes and all existing links/drawers.
 * Previous six-panel sticky/100svh stack caused unbalanced blank areas and
 * awkward long-content scrolling. New transition: a short, reversible lift
 * INSIDE natural-height full-bleed sections; no scaling, no pinning.
 * On phones the content is completely stationary to avoid overlaps.
 */
(() => {
  const root=document.getElementById('portfolio-site');
  const site=root?.querySelector(':scope > .site');
  const main=site?.querySelector(':scope > main');
  const band=root?.querySelector(':scope > section.note-band');
  const lastSite=root?.querySelectorAll(':scope > .site')[1];
  if(!site||!main||!band||!lastSite)return;

  // Preserve the original artwork and archive DOM. They were separated by
  // two .site shells; give them a single flow for one coherent layout grid.
  main.appendChild(band);
  while(lastSite.firstChild) main.appendChild(lastSite.firstChild);
  lastSite.remove();

  const panels=['.hero','.works','.note-band','.notes','.about','.contact']
    .map(s=>main.querySelector(':scope > section'+s));
  if(panels.some(p=>!p))return;

  panels.forEach((panel,i)=>{
    panel.classList.add('paper-stack-panel');
    panel.style.setProperty('--paper-z',String(i+1));
  });
  document.documentElement.classList.add('paper-stack-enabled');

  // Keep the original dotted <333 as live type, not a stretched image.
  // Match its visible ink height to the neighbouring biography at every desktop
  // width. A fixed scaleY(1.85) previously left the mark looking squat.
  const about=main.querySelector(':scope > section.about');
  const poem=about?.querySelector('.about-poem');
  const glyph=about?.querySelector('.about-identity .question');
  const metricsCanvas=document.createElement('canvas');
  const metricsContext=metricsCanvas.getContext('2d');
  function sizeAboutGlyph(){
    if(!poem||!glyph)return;
    if(window.innerWidth<=700){
      glyph.style.removeProperty('--about-vertical-scale');
      return;
    }
    const computed=getComputedStyle(glyph);
    const fontSize=parseFloat(computed.fontSize)||120;
    if(metricsContext){
      metricsContext.font=`${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    }
    const m=metricsContext?.measureText(glyph.textContent?.trim()||'<333');
    const inkHeight=(m?.actualBoundingBoxAscent||0)+(m?.actualBoundingBoxDescent||0);
    const nominalInk=inkHeight>0?inkHeight:fontSize*.78;
    const target=poem.getBoundingClientRect().height*.91;
    const scale=Math.min(8,Math.max(2,target/nominalInk));
    glyph.style.setProperty('--about-vertical-scale',scale.toFixed(3));
  }
  if(typeof ResizeObserver!=='undefined'&&poem){
    new ResizeObserver(sizeAboutGlyph).observe(poem);
  }
  sizeAboutGlyph();

  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
  let pending=false;
  let archiveOpen=false;
  function update(){
    pending=false;
    if(document.hidden||archiveOpen)return;
    const vh=window.innerHeight;
    const phone=window.innerWidth<=700;
    const silent=phone||reduced.matches;
    for(let i=0;i<panels.length;i++){
      const el=panels[i];
      const r=el.getBoundingClientRect();
      // Enter near the bottom of the viewport, settle by its upper quarter.
      const enters=i===0?1:ease((vh-r.top)/(vh*.78));
      // Ease out only when the LAST content is leaving the upper viewport;
      // this is independent of a panel's intrinsic content height.
      const exits=ease((vh*.20-r.bottom)/(vh*.46));
      const y=silent?0:Math.round(((1-enters)*16-exits*7)*100)/100;
      const opacity=silent?1:Math.max(.94,1-(1-enters)*.055-exits*.022);
      el.style.setProperty('--editorial-content-y',y.toFixed(2)+'px');
      el.style.setProperty('--editorial-content-alpha',opacity.toFixed(3));
    }
  }
  function request(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(update);
  }
  const checkArchive=()=>{
    archiveOpen=document.body.classList.contains('archive-open');
    if(!archiveOpen)request();
  };
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',()=>{sizeAboutGlyph();request();},{passive:true});
  document.addEventListener('visibilitychange',request);
  reduced.addEventListener?.('change',request);
  new MutationObserver(checkArchive).observe(document.body,
    {attributes:true,attributeFilter:['class']});
  document.getElementById('intro-enter')?.addEventListener('click',request);
  document.fonts?.ready?.then(()=>{sizeAboutGlyph();request();});
  request();
})();
