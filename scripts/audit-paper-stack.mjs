/* V12 browser audit: real site, image bytes, full-bleed panels,
   natural mobile content height, no viewport-edge gaps or section scaling. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw Error('Chrome not installed');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,
 args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
       '--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const repo=(process.env.GITHUB_REPOSITORY||'jfojellyfish-glitch/Fiona-personal--portfolio').split('/')[1];
const base=process.env.NEXT_PUBLIC_BASE_PATH||('/'+repo);
const url='http://127.0.0.1:4173'+base+'/';
const cases=[['wide-desktop',1920,1080],['reference-desktop',1640,928],['desktop',1440,900],['ipad',820,1180],
             ['mobile',390,844],['small-mobile',320,700]];
let failures=0;
for(const [name,width,height] of cases){
 const page=await browser.newPage();
 await page.setViewport({width,height,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
   assert([200,304].includes(response?.status()));
   await page.waitForSelector('.paper-stack-panel',{timeout:20000});
   await page.evaluate(()=>document.getElementById('intro-enter')?.click());
   await page.waitForFunction(()=>!document.body.classList.contains('intro-locked'),{timeout:7500});
   await page.waitForFunction(()=>document.querySelector('img.lotus-manifesto')?.dataset.matteRemoved==='true',
      {timeout:15000});
   const lotus=await page.evaluate(()=>{
     const img=document.querySelector('img.lotus-manifesto');
     const canvas=document.createElement('canvas');
     canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(img,0,0);
     const a=ctx.getImageData(0,0,1,1).data[3];
     const b=ctx.getImageData(canvas.width-1,canvas.height-1,1,1).data[3];
     // Sample colored ink and flower to ensure only white is removed.
     const raw=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     let colorful=0,opaque=0;
     for(let i=0;i<raw.length;i+=160){
       const r=raw[i],g=raw[i+1],b=raw[i+2],alpha=raw[i+3];
       if(alpha>220){opaque++;if(Math.max(r,g,b)-Math.min(r,g,b)>35)colorful++;}
     }
     return {width:canvas.width,height:canvas.height,topLeftAlpha:a,bottomRightAlpha:b,
       colorful,opaque,loaded:img.complete,srcIsTransparentPNG:img.src.startsWith('data:image/png;base64,')};
   });
   assert(lotus.srcIsTransparentPNG,'lotus still uses white-matte original asset');
   assert.equal(lotus.width,791,'lotus width changed');
   assert.equal(lotus.height,1989,'lotus height changed');
   assert(lotus.topLeftAlpha<32 && lotus.bottomRightAlpha<32,'lotus corners still have a white matte');
   assert(lotus.colorful>100 && lotus.opaque>500,'lotus or ink lost while removing white');
   console.log('LOTUS_MATTE_AUDIT '+name+' '+JSON.stringify(lotus));

   // Current design deliberately uses a pure solid color, not the photo.
   const expectedSolid='rgb(249, 249, 247)';
   const expectedPink='rgb(234, 216, 229)';

   const initial=await page.evaluate(()=>{
     const nodes=[...document.querySelectorAll('#portfolio-site .site > main > section.paper-stack-panel')];
     const s=el=>getComputedStyle(el);
     return {
       count:nodes.length,
       enabled:document.documentElement.classList.contains('paper-stack-enabled'),
       stack:nodes.map(n=>({
         className:n.className,
         position:s(n).position,
         scale:s(n).transform,
         top:Number.parseFloat(s(n).top),
         expected:Math.min(0,innerHeight-n.offsetHeight),
         width:Math.round(n.getBoundingClientRect().width),
         left:Math.round(n.getBoundingClientRect().left),
         right:Math.round(n.getBoundingClientRect().right),
         naturalHeight:n.offsetHeight,
         image:s(n).backgroundImage,
         color:s(n).backgroundColor,
         contentY:s(n).getPropertyValue('--paper-content-y'),
         contentCount:n.children.length,
       })),
       introTexture:getComputedStyle(document.querySelector('#intro-screen')).backgroundImage,
       introColor:getComputedStyle(document.querySelector('#intro-screen')).backgroundColor,
       paperStyling:(()=>{
         const bodyStyle=getComputedStyle(document.body);
         const sections=nodes.filter(n=>!n.classList.contains('note-band'));
         const first=getComputedStyle(sections[0]);
         const last=getComputedStyle(sections[sections.length-1]);
         const root=document.querySelector('#portfolio-site > .site');
         const footer=document.querySelector('.site > main > footer');
         const footerStyle=footer&&getComputedStyle(footer);
         return {
           rootWidth:Math.round(root?.getBoundingClientRect().width||0),
           bodyImage:bodyStyle.backgroundImage,
           bodyColor:bodyStyle.backgroundColor,
           bodySize:bodyStyle.backgroundSize,
           bodyPosition:bodyStyle.backgroundPosition,
           bodyAttachment:bodyStyle.backgroundAttachment,
           firstSize:first.backgroundSize,
           firstPosition:first.backgroundPosition,
           firstAttachment:first.backgroundAttachment,
           contactSize:last.backgroundSize,
           contactAttachment:last.backgroundAttachment,
           footerSize:footerStyle?.backgroundSize,
           footerColor:footerStyle?.backgroundColor,
           footerImage:footerStyle?.backgroundImage,
           footerAttachment:footerStyle?.backgroundAttachment,
           shadow:getComputedStyle(nodes[0]).boxShadow,
           firstBorder:getComputedStyle(nodes[0]).borderTopWidth
         };
       })(),
       footer:(()=>{const r=document.querySelector('.site > main > footer')?.getBoundingClientRect();return r?{left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}:null})(),
       contact:!!document.querySelector('#contact-angel-canvas'),
       entries:document.querySelectorAll('#notes .archive-entry-link').length,
       works:!!document.querySelector('#work a[href]'),
       about:!!document.querySelector('.about-poem .about-name'),
       overflow:document.documentElement.scrollWidth-innerWidth
     };
   });
   assert.equal(initial.enabled,true);
   assert.equal(initial.count,6);
   assert(initial.stack.every(n=>n.position==='sticky'),'panel not sticky');
   assert(initial.paperStyling.rootWidth>=width-3,'outer site shell is still card-width');
   assert.equal(initial.paperStyling.bodyImage,'none','body still uses a texture');
   assert.equal(initial.paperStyling.bodyColor,expectedSolid,'body background is not the chosen solid color');
   assert.equal(initial.paperStyling.footerImage,'none','footer still uses a texture');
   assert.equal(initial.paperStyling.footerColor,expectedSolid,'footer does not match body');
   assert.equal(initial.introTexture,'none','opening screen still uses a texture');
   assert.equal(initial.introColor,expectedSolid,'opening color differs from body');
   assert(initial.stack.filter(n=>!n.className.includes('note-band')).every(n=>n.image==='none'&&n.color===expectedSolid),
     'at least one white section still has a textured or different background');
   assert(initial.stack[2].image==='none'&&initial.stack[2].color===expectedPink,
     'pink statement section changed');
   assert.equal(initial.paperStyling.shadow,'none','visible section outline still present');
   assert.equal(initial.paperStyling.firstBorder,'0px','paper edge line still present');
   assert(initial.stack.every(n=>n.scale==='none'),'a whole panel was transformed');
   assert(initial.stack.every(n=>Math.abs(n.top-n.expected)<3),'long content might be clipped');
   assert(initial.stack.every(n=>n.width>=width-3),'full-bleed paper misses viewport edge');
   assert(initial.stack.every(n=>Math.abs(n.left)<3&&Math.abs(n.right-width)<3),'paper has exposed side gutters');
   assert(initial.footer&&Math.abs(initial.footer.left)<3&&Math.abs(initial.footer.right-width)<3,'footer has exposed side gutters');
   assert(initial.works&&initial.entries===3&&initial.about&&initial.contact,'original content missing');
   assert(initial.overflow<=3,'horizontal overflow');

   await page.evaluate(()=>{
     const target=document.querySelector('#work');
     window.scrollTo(0,window.scrollY+target.getBoundingClientRect().top-innerHeight*.6);
   });
   await new Promise(r=>setTimeout(r,200));
   const transition=await page.evaluate(()=>{
     const hero=document.querySelector('.paper-stack-panel.hero');
     const works=document.querySelector('.paper-stack-panel.works');
     const s=el=>getComputedStyle(el);
     return {
       heroTransform:s(hero).transform,
       heroFloat:s(hero).getPropertyValue('--paper-content-y').trim(),
       worksFloat:s(works).getPropertyValue('--paper-content-y').trim(),
       worksTransform:s(works).transform,
       heroWidth:hero.getBoundingClientRect().width,
       workWidth:works.getBoundingClientRect().width,
       hOverflow:document.documentElement.scrollWidth-innerWidth
     };
   });
   assert.equal(transition.heroTransform,'none');
   assert.equal(transition.worksTransform,'none');
   assert(transition.heroWidth>=width-3&&transition.workWidth>=width-3);
   assert(transition.hOverflow<=3,'overflow while scrolling');
   if(name==='desktop'||name==='ipad'){
     assert(transition.worksFloat!=='0.00px','section content should float on desktop/tablet');
   }
   await page.screenshot({path:'paper-stack-'+name+'.png'});

   if(width<=390){
     // Original portfolio includes long sections, and they must never be
     // clipped to a fixed viewport height or forced to overlap on mobile.
     const m=await page.evaluate(()=>{
       const ns=[...document.querySelectorAll('.paper-stack-panel')];
       return {
         tall:ns.filter(n=>n.offsetHeight>innerHeight*1.07).map(n=>({
           label:n.classList[0],offset:n.offsetHeight,
           top:getComputedStyle(n).top,
           overflow:getComputedStyle(n).overflow,
           dy:getComputedStyle(n).getPropertyValue('--paper-content-y').trim()
         })),
         viewport:innerHeight
       };
     });
     assert(m.tall.length>=1,'mobile tall sections absent');
     assert(m.tall.every(n=>n.overflow!=='hidden'&&n.dy==='0.00px'),
      'mobile long content was clipped or translated');
     console.log('V12_MOBILE_CONTENT '+name+' '+JSON.stringify(m));
   }
   assert.equal(errors.length,0,'uncaught client page errors '+errors.join('; '));
   console.log('V64_SOLID_STACK_AUDIT '+name+' '+JSON.stringify({initial,transition,errors}));
 }catch(error){
   failures++;
   console.error('V12_PAPER_STACK_ERROR '+name+' '+error.stack);
 }
 await page.close();
}
const reduced=await browser.newPage();
await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
try{
 await reduced.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
 await reduced.waitForSelector('#work',{timeout:12000});
 const state=await reduced.evaluate(()=>({
   enabled:document.documentElement.classList.contains('paper-stack-enabled'),
   texture:getComputedStyle(document.querySelector('#work')).backgroundImage
 }));
 assert.equal(state.enabled,false);
 assert.equal(state.texture,'none','reduced-motion still has texture');
 console.log('V12_REDUCED_MOTION '+JSON.stringify(state));
}catch(error){failures++;console.error('V12_REDUCED_ERROR '+error.stack);}
await reduced.close();
await browser.close();
if(failures)process.exitCode=1;
else console.log('V64 plain-color background, mobile-safe motion and full-width layout passed');
