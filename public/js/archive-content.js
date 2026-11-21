/* v46 content drawers — no framework, external JS library, tracking, or build step. */
(() => {
  'use strict';
  const safeText = x => String(x == null ? '' : x);
  const $ = id => document.getElementById(id);
  const dataCache = new Map();
  const allData = {pearls: [], photography: [], objects: []};
  let loaded = false;
  let currentPhoto = 0;
  let photoList = [];
  let objectLoaders = [];
  let priorFocus = null;

  // The fully self-contained downloadable preview supplies the same content
  // via an embedded resource table. Normal GitHub Pages loads the JSON/MD files.
  async function readFile(path) {
    if (Object.prototype.hasOwnProperty.call(window.__PORTFOLIO_INLINE_FILES__ || {}, path))
      return window.__PORTFOLIO_INLINE_FILES__[path];
    const response = await fetch('./' + path, {cache:'no-cache'});
    if (!response.ok) throw new Error('Unable to read ' + path);
    return response.text();
  }
  function validRelativePath(path) {
    return typeof path === 'string' && !path.includes('..') && !path.startsWith('/') && !path.startsWith('\\') && /^[a-zA-Z0-9_./-]+$/.test(path);
  }
  function asset(path) { return validRelativePath(path) ? './' + path : ''; }
  function externalUrl(url) {
    try { const parsed = new URL(String(url)); return ['https:','http:'].includes(parsed.protocol) ? parsed.href : ''; }
    catch (_) { return ''; }
  }
  const isSlug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
  function el(tag, cls, contents) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (contents != null) node.textContent = safeText(contents);
    return node;
  }
  function setHref(anchor, href) {
    if (!href) return false;
    anchor.href = href;
    return true;
  }
  function formatDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return safeText(date);
    const [y,m,d]=date.split('-'); return `${d}.${m}.${y}`;
  }
  function escapeHTML(text) { return safeText(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function parseInline(text) {
    // Markup is first escaped; only safe Markdown syntax is later recognized.
    let result = escapeHTML(text);
    result = result.replace(/\[([^\]\n]+)\]\(([^\s)]+)\)/g, (_,label,url) => {
      const safe = externalUrl(url);
      return safe ? `<a target="_blank" rel="noopener noreferrer" href="${escapeHTML(safe)}">${label}</a>` : label;
    });
    result = result.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    return result;
  }
  function markdownToHTML(markdown) {
    const lines = safeText(markdown).replace(/\r\n/g,'\n').split('\n');
    const out = [];
    let paragraph = [], list = '', quote = [];
    function flushParagraph(){if(paragraph.length){out.push('<p>'+parseInline(paragraph.join(' '))+'</p>');paragraph=[];}}
    function flushList(){if(list){out.push('</'+list+'>');list='';}}
    function flushQuote(){if(quote.length){out.push('<blockquote><p>'+parseInline(quote.join(' '))+'</p></blockquote>');quote=[];}}
    for(const original of lines){
      const line=original.trim();
      if(!line){flushParagraph();flushList();flushQuote();continue;}
      const heading=line.match(/^(#{1,3})\s+(.+)$/);
      const unordered=line.match(/^[-*]\s+(.+)$/);
      const ordered=line.match(/^\d+\.\s+(.+)$/);
      if(heading){flushParagraph();flushList();flushQuote();const n=Math.min(3,heading[1].length+1);out.push(`<h${n}>${parseInline(heading[2])}</h${n}>`);continue;}
      if(/^---+$/.test(line)){flushParagraph();flushList();flushQuote();out.push('<hr>');continue;}
      if(line.startsWith('> ')){flushParagraph();flushList();quote.push(line.slice(2));continue;}
      if(unordered||ordered){flushParagraph();flushQuote();const t=unordered?'ul':'ol';if(list!==t){flushList();out.push('<'+t+'>');list=t;}out.push('<li>'+parseInline((unordered||ordered)[1])+'</li>');continue;}
      flushList();flushQuote();paragraph.push(line);
    }
    flushParagraph();flushList();flushQuote();
    return out.join('\n');
  }
  function showError(container, message) {
    if (!container) return;
    container.replaceChildren(el('p','collection-error',message));
    container.hidden=false;
  }
  async function loadIndex(path, name) {
    try {
      const parsed=JSON.parse(await readFile(path));
      return Array.isArray(parsed[name]) ? parsed[name] : [];
    } catch (error) {
      console.warn('Archive data was not available:',path,error);
      return [];
    }
  }
  function renderPearls(items) {
    const list=$('pearls-list');
    if(!list)return;
    list.replaceChildren();
    const seen=new Set();
    allData.pearls=items.filter(p => {
      if(!p || !isSlug(p.slug) || !p.title || !validRelativePath(p.file) || seen.has(p.slug)) return false;
      seen.add(p.slug);return true;
    });
    for(const p of allData.pearls){
      const a=el('a','pearl-card');a.href='#writing/'+p.slug;
      const date=el('span','pearl-card-date',formatDate(p.date));
      const body=el('div','pearl-card-copy');
      body.append(el('h2','pearl-card-title',p.title),el('p','pearl-card-description',p.description || ''));
      a.append(date,body,el('span','pearl-card-arrow','↗︎'));list.append(a);
    }
    $('pearls-empty').hidden=allData.pearls.length>0;
    $('pearls-collection').hidden=allData.pearls.length===0;
  }
  function getSketchfabID(model) {
    const direct = safeText(model.sketchfabId || '').toLowerCase();
    if(/^[0-9a-f]{32}$/.test(direct)) return direct;
    const link=externalUrl(model.sketchfabUrl);
    if(!link) return '';
    const url=new URL(link);
    if(url.hostname!=='sketchfab.com' && url.hostname!=='www.sketchfab.com')return '';
    const match=url.pathname.match(/([0-9a-f]{32})(?:\/|$)/i);
    return match ? match[1].toLowerCase() : '';
  }
  // Local GLB viewing does not require a Sketchfab upload. Load the viewer
  // only on request so the main portfolio stays fast and unchanged.
  let modelViewerLoader = null;
  function ensureModelViewer() {
    if (customElements.get('model-viewer')) return Promise.resolve();
    if (modelViewerLoader) return modelViewerLoader;
    modelViewerLoader = new Promise((resolve,reject) => {
      const script=document.createElement('script');
      script.type='module';
      script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js';
      script.onload=()=>customElements.whenDefined('model-viewer').then(resolve,reject);
      script.onerror=()=>reject(new Error('The 3D viewer script could not be loaded. Check your internet connection.'));
      document.head.append(script);
    }).catch(error=>{modelViewerLoader=null;throw error;});
    return modelViewerLoader;
  }
  const localModel = m => typeof m.file==='string' && validRelativePath(m.file) && /\.glb$/i.test(m.file);
  function localModelURL(model) {
    const inline=window.__PORTFOLIO_INLINE_MODELS__ || {};
    return inline[model.file] || asset(model.file);
  }
  // v48: direct, frameless display. The viewer loads when visitors enter 02,
  // not on the home page and without adding a framed poster or load button.
  function renderObjects(models) {
    const list=$('objects-list');if(!list)return;
    list.replaceChildren();
    objectLoaders=[];
    allData.objects=models.filter(m=>m && m.title && (getSketchfabID(m)||localModel(m)||externalUrl(m.url)));
    for(const model of allData.objects) {
      const card=el('article','model-card model-card-direct');
      const id=getSketchfabID(model);
      const isLocal=localModel(model);
      const stage=el('div','model-stage');
      const status=el('p','model-stage-status','loading 3d…');
      stage.append(status);
      const heading=el('h2','model-title',model.title);
      card.append(stage,heading);
      if (model.description) card.append(el('p','model-description',model.description));
      if (model.year) card.append(el('p','model-meta',model.year));
      const href=id ? 'https://sketchfab.com/models/'+id : externalUrl(model.url);
      if(href){const link=el('a','model-link',id?'open on sketchfab ↗︎':'view project ↗︎');
        setHref(link,href);link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
      list.append(card);
      if (!id && !isLocal) {stage.remove();continue;}
      let started=false;
      const load=async()=>{
        if(started)return;
        started=true;
        status.textContent='loading 3d…';
        try {
          if(isLocal){
            await ensureModelViewer();
            const viewer=el('model-viewer','model-interactive');
            viewer.setAttribute('src',localModelURL(model));
            viewer.setAttribute('alt',safeText(model.alt || '3D artwork'));
            viewer.setAttribute('camera-controls','');
            viewer.setAttribute('auto-rotate','');
            viewer.setAttribute('rotation-per-second','6deg');
            viewer.setAttribute('environment-image','neutral');
            viewer.setAttribute('exposure','1');
            viewer.setAttribute('shadow-intensity','0.18');
            viewer.setAttribute('interaction-prompt','auto');
            viewer.setAttribute('loading','eager');
            viewer.setAttribute('touch-action','pan-y');
            viewer.addEventListener('error',()=>{
              stage.replaceChildren(el('p','model-stage-error','The model could not be loaded. Please check its file.'));
            },{once:true});
            stage.replaceChildren(viewer);
          } else {
            const iframe=el('iframe');iframe.loading='eager';iframe.title=safeText(model.title)+' — interactive 3D model';
            iframe.allow='autoplay; fullscreen; xr-spatial-tracking';iframe.allowFullscreen=true;
            iframe.referrerPolicy='strict-origin-when-cross-origin';
            iframe.src='https://sketchfab.com/models/'+id+'/embed?autostart=0&ui_controls=1';
            stage.replaceChildren(iframe);
          }
        } catch(error) {
          started=false;
          const retry=el('button','model-stage-retry','viewer unavailable · retry ↗︎');
          retry.type='button';
          retry.title=error?.message || '3D viewer unavailable';
          retry.addEventListener('click',load,{once:true});
          stage.replaceChildren(retry);
        }
      };
      objectLoaders.push(load);
    }
    $('objects-empty').hidden=allData.objects.length>0;
    $('objects-collection').hidden=allData.objects.length===0;
  }
  function renderPhotography(photos) {
    const grid=$('photography-grid');if(!grid)return;
    grid.replaceChildren();
    photoList=photos.filter(p=>p && validRelativePath(p.file) && p.title);
    for(const [index,p] of photoList.entries()) {
      const btn=el('button','photo-card');btn.type='button';btn.setAttribute('aria-label','Open photograph: '+p.title);
      const img=el('img');img.src=asset(p.file);img.alt=safeText(p.alt || p.title);img.loading='lazy';img.decoding='async';
      btn.append(img,el('span','photo-caption',p.title),el('span','photo-meta',[p.year,p.location].filter(Boolean).join(' · ')));
      btn.addEventListener('click',()=>openPhoto(index));grid.append(btn);
    }
    $('photography-empty').hidden=photoList.length>0;
    $('photography-collection').hidden=photoList.length===0;
  }
  function showPhoto() {
    if(!photoList.length)return;
    currentPhoto=(currentPhoto+photoList.length)%photoList.length;
    const p=photoList[currentPhoto];
    const img=$('photo-lightbox-img');img.src=asset(p.file);img.alt=safeText(p.alt || p.title);
    $('photo-lightbox-title').textContent=p.title;
    $('photo-lightbox-meta').textContent=[p.year,p.location].filter(Boolean).join(' · ');
    $('photo-lightbox-count').textContent=`${currentPhoto+1} / ${photoList.length}`;
  }
  function openPhoto(index) {priorFocus=document.activeElement;currentPhoto=index;showPhoto();$('photo-lightbox').hidden=false;$('photo-close').focus();}
  function closePhoto() {$('photo-lightbox').hidden=true;if(priorFocus?.isConnected)priorFocus.focus();}
  function photoOffset(diff) {currentPhoto+=diff;showPhoto();}
  $('photo-close')?.addEventListener('click',closePhoto);
  $('photo-prev')?.addEventListener('click',()=>photoOffset(-1));
  $('photo-next')?.addEventListener('click',()=>photoOffset(1));
  // Capture before the existing archive-wide Escape handler; close the photo first.
  document.addEventListener('keydown',event=>{
    if($('photo-lightbox').hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closePhoto();}
    else if(event.key==='ArrowLeft'){event.preventDefault();photoOffset(-1);}
    else if(event.key==='ArrowRight'){event.preventDefault();photoOffset(1);}
    else if(event.key==='Tab'){
      const controls=[$('photo-close'),$('photo-prev'),$('photo-next')];
      if(event.shiftKey && document.activeElement===controls[0]){event.preventDefault();controls[2].focus();}
      else if(!event.shiftKey && document.activeElement===controls[2]){event.preventDefault();controls[0].focus();}
    }
  },true);

  async function openPearl(slug) {
    const p=allData.pearls.find(x=>x.slug===slug);
    if(!p){location.hash='writing';return;}
    $('pearls-list').hidden=true;
    const reader=$('pearl-reader');reader.hidden=false;
    $('pearl-reader-title').textContent=p.title;
    $('pearl-reader-date').textContent=[formatDate(p.date),p.category].filter(Boolean).join(' / ');
    const body=$('pearl-reader-body');body.replaceChildren();
    if(dataCache.has(p.file)){body.innerHTML=markdownToHTML(dataCache.get(p.file));return;}
    try {const markdown=await readFile(p.file);dataCache.set(p.file,markdown);if(location.hash==='#writing/'+slug)body.innerHTML=markdownToHTML(markdown);}
    catch(error){body.append(el('p','','This pearl could not be opened. Please check its file path.'));}
  }
  function updateRoute() {
    const hash=decodeURIComponent(location.hash.slice(1));
    // Start 3D loading only after opening its drawer. No home-page download.
    if(hash==='objects') objectLoaders.forEach(load=>load());
    if(!hash.startsWith('writing')) {if(!$('photo-lightbox').hidden)closePhoto();return;}
    const slug=hash.startsWith('writing/')?hash.slice(8):'';
    if(!allData.pearls.length)return;
    if(slug){openPearl(slug);}
    else {$('pearls-list').hidden=false;$('pearl-reader').hidden=true;}
  }
  async function start() {
    const [pearls,photos,models]=await Promise.all([
      loadIndex('content/pearls/index.json','entries'),
      loadIndex('content/photography/index.json','photos'),
      loadIndex('content/objects/index.json','models')
    ]);
    renderPearls(pearls);renderPhotography(photos);renderObjects(models);
    loaded=true;updateRoute();
  }
  window.addEventListener('hashchange',()=>{if(loaded)updateRoute();});
  start();
})();
