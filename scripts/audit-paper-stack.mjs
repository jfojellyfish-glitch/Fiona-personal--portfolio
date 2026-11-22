/* v66: Full-site editorial rhythm audit, using the REAL Next.js export.
   No screenshot-only or viewport-only smoke claims: check actual geometry
   across sections, intrinsic image ratios, layout, mobile and scroll motion. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw Error('Chrome not installed');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,
 args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
       '--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const repo=(process.env.GITHUB_REPOSITORY||'jfojellyfish-glitch/Fiona-personal--portfolio').split('/')[1];
const base=process.env.NEXT_PUBLIC_BASE_PATH||('/'+repo);
const url='http://127.0.0.1:4173'+base+'/';
const cases=[
 ['wide-desktop',1920,1080],['reference-desktop',1640,928],
 ['desktop',1440,900],['tablet',820,1180],
 ['mobile',390,844],['small-mobile',320,700]
];
let failures=0;

for(const [name,width,height] of cases){
 const page=await browser.newPage();
 await page.setViewport({width,height,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  assert([200,304].includes(response?.status()),'page did not load');
  await page.waitForSelector('section.paper-stack-panel',{timeout:20000});
  await page.evaluate(()=>document.getElementById('intro-enter')?.click());
  await page.waitForFunction(()=>!document.body.classList.contains('intro-locked'),{timeout:8500});
  // Avoid capturing the 900ms 3D entrance fade over the portfolio.
  await page.waitForFunction(()=>document.getElementById('intro-screen')?.hidden===true,
    {timeout:6000});
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.body.style.scrollBehavior='auto';
  });
  await page.waitForFunction(()=>document.querySelector('img.lotus-manifesto')?.dataset.matteRemoved==='true',{timeout:15000});
  await page.evaluate(()=>document.fonts?.ready);

  const initial=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
   const style=e=>getComputedStyle(e);
   const sections=[...document.querySelectorAll('#portfolio-site .site > main > section.paper-stack-panel')];
   const hero=document.querySelector('section.hero');
   const works=document.querySelector('section.works');
   const note=document.querySelector('section.note-band');
   const notes=document.querySelector('section.notes');
   const about=document.querySelector('section.about');
   const contact=document.querySelector('section.contact');
   const lotus=document.querySelector('img.lotus-manifesto');
   const canvas=document.querySelector('#contact-angel-canvas');
   const footer=document.querySelector('.site > main > footer');
   const noteImages=[...notes.querySelectorAll('.wall figure img')];
   const ns=[...notes.querySelectorAll('.wall figure')];
   const bigHeadings=[works.querySelector('.section-top h2'),notes.querySelector('h2'),about.querySelector('.section-top h2')];
   const colors=sections.map(s=>style(s).backgroundColor);
   return {
     enabled:document.documentElement.classList.contains('paper-stack-enabled'),
     count:sections.length,
     sections:sections.map(s=>({name:s.classList[0],rect:rect(s),position:style(s).position,
       height:s.offsetHeight,minHeight:style(s).minHeight,image:style(s).backgroundImage,
       color:style(s).backgroundColor,transform:style(s).transform,
       children:s.children.length,overflow:style(s).overflow})),
     rootWidth:rect(document.querySelector('#portfolio-site > .site')).w,
     footer:rect(footer),
     solid:style(hero).backgroundColor,pink:style(note).backgroundColor,
     headings:bigHeadings.map(e=>({font:parseFloat(style(e).fontSize),height:rect(e).h})),
     heroColumns:{left:rect(hero.querySelector('.hero-left')),right:rect(hero.querySelector('.hero-right')),
       title:rect(hero.querySelector('.hero-title')),image:rect(lotus),
       intrinsic:[lotus.naturalWidth,lotus.naturalHeight],
       imgSource:lotus.src.slice(0,22),overline:rect(hero.querySelector('.hero-left > .kicker')),
       intro:rect(hero.querySelector('.hero-intro'))},
     archive:{figures:ns.map(rect),images:noteImages.map(rect)},
     about:{identity:rect(about.querySelector('.about-identity')),prose:rect(about.querySelector('.about-poem')),
       question:rect(about.querySelector('.question'))},
     contact:{heading:rect(contact.querySelector('.contact-heading')),
       details:rect(contact.querySelector('.contact-details')),
       email:rect(contact.querySelector('.contact-email')),
       canvasOpacity:style(canvas).opacity},
     content:{worksLinks:works.querySelectorAll('a[href]').length,
       archiveLinks:notes.querySelectorAll('.archive-entry-link').length,
       aboutName:!!about.querySelector('.about-name'),
       contactMail:!!contact.querySelector('a[href^="mailto:"]')},
     viewport:innerWidth,
     overflow:document.documentElement.scrollWidth-innerWidth
   };
  });

  assert(initial.enabled,'section motion initialization missing');
  assert.equal(initial.count,6,'section count changed');
  assert(initial.sections.every(s=>s.position==='relative'),'a section is still sticky');
  assert(initial.sections.every(s=>s.transform==='none'),'section itself transformed');
  assert(initial.sections.every(s=>s.overflow!=='hidden' || s.name==='contact'),
   'long section has clipped content');
  assert(initial.rootWidth>=width-3,'site is still a narrow card');
  assert(initial.sections.every(s=>Math.abs(s.rect.x)<3 && Math.abs(s.rect.right-width)<3),
   'section has exposed viewport gutters');
  assert(Math.abs(initial.footer.x)<3 && Math.abs(initial.footer.right-width)<3,
   'footer has side gutters');
  assert.equal(initial.solid,'rgb(249, 249, 247)');
  assert.equal(initial.pink,'rgb(234, 216, 229)');
  assert(initial.sections.filter(s=>s.name!=='note-band').every(s=>s.image==='none'),
   'paper texture unexpectedly returned');
  assert.deepEqual(initial.heroColumns.intrinsic,[791,1989],'lotus original image resized');
  assert(initial.heroColumns.imgSource.startsWith('data:image/png;base64,'),'lotus white matte restored');
  assert(initial.headings.every(x=>x.font>=48&&x.font<=116),'headings no longer share an editorial type scale');
  assert(Math.max(...initial.headings.map(x=>x.font)) - Math.min(...initial.headings.map(x=>x.font))<2,
   'work, notes and about headings diverged');
  assert(initial.archive.images.length===3 && initial.archive.figures.length===3);
  assert(initial.archive.images.every(i=>i.h>25),
    'lazy archive image collapsed before entering the viewport');
  assert(initial.content.worksLinks>=2 && initial.content.archiveLinks===3 &&
         initial.content.aboutName && initial.content.contactMail,'content/link lost');
  assert.equal(initial.contact.canvasOpacity,'0.18','Angel stipple opacity changed');
  assert(initial.overflow<=3,'horizontal document overflow');

  const overlaps=(a,b,pad=3)=>
   a.x<b.right-pad && a.right>b.x+pad && a.y<b.bottom-pad && a.bottom>b.y+pad;
  // Real geometry, including those cross-column collisions that the old
  // overflow-only test failed to detect.
  assert(!overlaps(initial.heroColumns.title,initial.heroColumns.image,5),'hero title collides with lotus');
  assert(!overlaps(initial.about.identity,initial.about.prose,4),'about illustration overlaps biography');
  assert(!overlaps(initial.contact.heading,initial.contact.details,4),'contact heading overlaps email column');
  assert(!overlaps(initial.archive.figures[0],initial.archive.figures[1],4),'archive covers overlap');
  assert(!overlaps(initial.archive.figures[1],initial.archive.figures[2],4),'archive images overlap');
  if(width<=700){
    assert(initial.heroColumns.right.y>=initial.heroColumns.left.y+initial.heroColumns.left.h-5,
      'mobile hero image starts before left content finishes');
    assert(initial.about.prose.y>=initial.about.identity.y+initial.about.identity.h-5,
      'mobile biography overlaps glyph');
    assert(initial.contact.details.y>=initial.contact.heading.y+initial.contact.heading.h-5,
      'mobile email overlaps heading');
    assert(initial.archive.figures.every((r,i,a)=>i===0||r.y>=a[i-1].bottom-5),
      'mobile archive content is stacked on itself');
  }

  const moving=await page.evaluate(()=>{
    const target=document.querySelector('section.works');
    window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-innerHeight*.58,behavior:'instant'});
    return scrollY;
  });
  await new Promise(r=>setTimeout(r,180));
  const motion=await page.evaluate(()=>{
    const work=document.querySelector('section.works');
    const ss=getComputedStyle(work);
    const el=work.querySelector('.section-top');
    return {position:ss.position,y:ss.getPropertyValue('--editorial-content-y').trim(),
      alpha:ss.getPropertyValue('--editorial-content-alpha').trim(),
      actualTextTranslate:getComputedStyle(el).translate,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.equal(motion.position,'relative');
  assert(motion.overflow<=3,'transition creates horizontal overflow');
  if(width>700){assert(motion.y!=='' && motion.y!=='0.00px',
    'desktop section transition no longer moves inner content');}
  else assert(motion.actualTextTranslate==='0px' || motion.actualTextTranslate==='none'
                || motion.actualTextTranslate==='0px 0px',
                'mobile section content moves and may overlap');

  const imageGeometry=await page.evaluate(async()=>{
    const images=[...document.querySelectorAll('#notes .wall figure img')];
    const before=images.map(i=>i.getBoundingClientRect().height);
    const note=document.querySelector('#notes');
    const initialNoteHeight=note.getBoundingClientRect().height;
    await Promise.all(images.map(async i=>{
      i.loading='eager';
      try {await i.decode();}catch{}
    }));
    const after=images.map(i=>i.getBoundingClientRect().height);
    return {before,after,images:images.map(i=>({w:i.naturalWidth,h:i.naturalHeight,complete:i.complete,src:i.currentSrc.split('/').at(-1)})),
      noteBefore:initialNoteHeight,noteAfter:note.getBoundingClientRect().height};
  });
  assert(imageGeometry.images.every(i=>i.complete&&i.w>0&&i.h>0),
    'Archive images failed to load');
  assert(imageGeometry.before.every(h=>h>25),
    'Archive image had no reserved height before lazy loading');
  assert(imageGeometry.after.every((h,i)=>Math.abs(h-imageGeometry.before[i])<3),
    'Archive image jumped in size after loading');
  assert(Math.abs(imageGeometry.noteAfter-imageGeometry.noteBefore)<3,
    'Archive section changed height while images loaded');
  console.log('EDITORIAL_IMAGE_GEOMETRY '+name+' '+JSON.stringify(imageGeometry));
  await page.screenshot({path:'paper-stack-'+name+'.png'});
  if(['desktop','mobile'].includes(name)){
   for(const section of ['notes','about','contact']){
     await page.evaluate(key=>{
       const el=document.querySelector('section.'+key);
       window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top,behavior:'instant'});
     },section);
     await new Promise(r=>setTimeout(r,75));
     await page.screenshot({path:'editorial-'+name+'-'+section+'.png'});
   }
  }
  assert.equal(errors.length,0,'uncaught browser errors '+errors.join('; '));
  console.log('EDITORIAL_LAYOUT_AUDIT '+name+' '+JSON.stringify({initial,motion,errors}));
 }catch(error){
  failures++;
  console.error('EDITORIAL_LAYOUT_ERROR '+name+' '+error.stack);
 }
 await page.close();
}

const reduced=await browser.newPage();
await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
try{
 await reduced.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
 await reduced.waitForSelector('#about',{timeout:13000});
 const v=await reduced.evaluate(()=>({
   hasPink:!!document.querySelector('.note-band'),
   position:getComputedStyle(document.querySelector('section.notes')).position,
   noBackgroundImage:getComputedStyle(document.querySelector('section.notes')).backgroundImage
 }));
 assert(v.hasPink);
 assert.equal(v.noBackgroundImage,'none');
 assert.equal(v.position,'relative');
 console.log('EDITORIAL_REDUCED_MOTION '+JSON.stringify(v));
}catch(error){failures++;console.error('EDITORIAL_REDUCED_ERROR '+error.stack);}
await reduced.close();
await browser.close();
if(failures)process.exitCode=1;
else console.log('Editorial layout and natural section motion verified on all viewports');
