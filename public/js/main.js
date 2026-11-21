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


/* Fiona Angel point-stipple: individual pixels travel lower-right to upper-left,
   then gently fade; 11.5-second loop, permanently fixed at 18% peak opacity. */
(() => {
  const section = document.getElementById('contact');
  const source = section?.querySelector('.contact-mark');
  const canvas = document.getElementById('contact-angel-canvas');
  if (!(section instanceof HTMLElement) || !(source instanceof HTMLImageElement) ||
      !(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) return;
  const image = new Image();
  image.decoding = 'async';
  image.src = source.currentSrc || source.src;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const points = [];
  let crop = {x:0,y:0,w:1,h:1};
  let width = 0, height = 0, pixelRatio = 1;
  let visible = true, start = performance.now(), previousFrame = -Infinity;
  const smooth = (a,b,t) => {
    const x = Math.max(0,Math.min(1,(t-a)/(b-a)));
    return x*x*(3-2*x);
  };
  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1,Math.round(width*pixelRatio));
    canvas.height = Math.max(1,Math.round(height*pixelRatio));
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  };
  function extract() {
    const factor = Math.min(1, 1200 / Math.max(image.naturalWidth,image.naturalHeight));
    const w = Math.max(1,Math.round(image.naturalWidth*factor));
    const h = Math.max(1,Math.round(image.naturalHeight*factor));
    const buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    const g = buffer.getContext('2d', {willReadFrequently:true});
    if (!g) return;
    g.drawImage(image,0,0,w,h);
    const pixels = g.getImageData(0,0,w,h).data;
    const stride = Math.max(1,Math.round(Math.max(w,h)/700));
    let minx=w,miny=h,maxx=0,maxy=0;
    const inkAt = (x,y) => {
      const k=(y*w+x)*4,alpha=pixels[k+3]/255;
      const lum=(.2126*pixels[k]+.7152*pixels[k+1]+.0722*pixels[k+2])/255;
      return Math.max(0,(1-lum)*alpha);
    };
    for(let y=0;y<h;y+=stride){
      for(let x=0;x<w;x+=stride){
        let ink=0,px=x,py=y;
        for(let dy=0;dy<stride&&y+dy<h;dy++){
          for(let dx=0;dx<stride&&x+dx<w;dx++){
            const p=inkAt(x+dx,y+dy);
            if(p>ink){ink=p;px=x+dx;py=y+dy;}
          }
        }
        if(ink<.13)continue;
        points.push([px,py,Math.min(1,ink*1.7)]);
        minx=Math.min(minx,px);miny=Math.min(miny,py);
        maxx=Math.max(maxx,px);maxy=Math.max(maxy,py);
      }
    }
    if(points.length>0)crop={x:minx,y:miny,w:Math.max(1,maxx-minx),h:Math.max(1,maxy-miny)};
  }
  function draw(now){
    requestAnimationFrame(draw);
    if(!visible||!width||!height||!points.length||now-previousFrame<28)return;
    previousFrame=now;
    const t=reduced.matches?6.9:((now-start)/1000)%11.5;
    ctx.clearRect(0,0,width,height);
    const portraitTablet=width>760&&width<=1199&&height>width;
    const small=width<=760;
    const ratio=crop.w/crop.h;
    const paintedWidth=small?Math.min(width*1.19,height*.28*ratio):
      portraitTablet?Math.min(width*.95,height*.30*ratio):
      Math.min(width*.80,height*.46*ratio);
    const paintedHeight=paintedWidth/ratio;
    const left=small?width*.49-paintedWidth*.5:
      portraitTablet?width*.50-paintedWidth*.5:width*.53-paintedWidth*.5;
    const top=small?height*.59-paintedHeight*.5:
      portraitTablet?height*.63-paintedHeight*.5:height*.69-paintedHeight*.5;
    const dot=Math.max(.85,Math.min(2.4,paintedWidth/crop.w*1.5));
    for(let i=0;i<points.length;i++){
      const [x,y,ink]=points[i];
      const nx=(x-crop.x)/crop.w,ny=(y-crop.y)/crop.h;
      const gradient=.61*(1-nx)+.39*(1-ny);
      const jitter=(Math.sin(i*47.23)*43758.5453%1+1)%1*.06;
      const phase=Math.min(1,Math.max(0,gradient+jitter));
      const alpha=reduced.matches?.18:
        smooth(.38+5.5*phase,1.5+5.5*phase,t)*
        (1-smooth(7.25+2.1*phase,8.4+2.1*phase,t))*.18;
      if(alpha<.003)continue;
      ctx.fillStyle='rgba(54,51,49,'+(alpha*ink).toFixed(3)+')';
      ctx.fillRect(left+nx*paintedWidth,top+ny*paintedHeight,dot,dot);
    }
  }
  image.onload=()=>{
    try{extract();resize();requestAnimationFrame(draw);}
    catch(error){console.warn('Angel stipple could not initialize',error);}
  };
  if(image.complete&&image.naturalWidth)image.onload();
  const observer=new ResizeObserver(resize);
  observer.observe(section);
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting ?? true;},{threshold:0})
      .observe(section);
  }
})();
