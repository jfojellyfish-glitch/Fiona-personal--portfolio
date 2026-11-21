/* Visual QA: approved six-section paper stack applied to the REAL landing page.
   Tests original content, layering, tall content, scroll reversal & reduced motion. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(path=>fs.existsSync(path));
if(!chrome)throw Error('Chrome not installed');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const repo=(process.env.GITHUB_REPOSITORY||'jfojellyfish-glitch/Fiona-personal--portfolio').split('/')[1];
const base=process.env.NEXT_PUBLIC_BASE_PATH||('/'+repo);
const pageURL='http://127.0.0.1:4173'+base+'/';
const viewports=[['desktop',1440,900],['ipad',820,1180],['mobile',390,844]];
let failures=0;
for(const [name,width,height] of viewports){
 const page=await browser.newPage();
 await page.setViewport({width,height,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
   const response=await page.goto(pageURL,{waitUntil:'domcontentloaded',timeout:20000});
   await page.waitForSelector('.paper-stack-panel',{timeout:20000});
   await page.evaluate(()=>document.getElementById('intro-enter')?.click());
   await page.waitForFunction(()=>!document.body.classList.contains('intro-locked'),{timeout:7000});
   const initial=await page.evaluate(()=>{
     const sections=[...document.querySelectorAll('#portfolio-site .site > main > section.paper-stack-panel')];
     const style=el=>getComputedStyle(el);
     const v=innerHeight;
     return {
       enabled:document.documentElement.classList.contains('paper-stack-enabled'),
       count:sections.length,
       classes:sections.map(el=>el.className),
       position:sections.map(el=>style(el).position),
       zIndexes:sections.map(el=>Number(style(el).zIndex)),
       sections:sections.map(el=>({
         height:el.offsetHeight,top:Number.parseFloat(style(el).top),
         expectedTop:Math.min(0,v-el.offsetHeight)
       })),
       originalWorks:!!document.querySelector('#work a[href]'),
       originalDrawers:document.querySelectorAll('#notes .archive-entry-link').length,
       contact:!!document.querySelector('#contact-angel-canvas'),
       contentVisible:!!document.querySelector('.about-poem .about-name'),
       hOverflow:document.documentElement.scrollWidth>innerWidth+4
     };
   });
   assert([200,304].includes(response?.status()),'Unexpected local server response');
   assert.equal(initial.enabled,true,'motion disabled');
   assert.equal(initial.count,6,'six panels');
   assert(initial.position.every(x=>x==='sticky'),'all panels sticky');
   assert.deepEqual(initial.zIndexes,[1,2,3,4,5,6],'correct stack order');
   assert(initial.sections.every(s=>Math.abs(s.top-s.expectedTop)<3),'tall sections show all content');
   assert(initial.originalWorks&&initial.originalDrawers>=3&&initial.contact&&initial.contentVisible,
    'existing portfolio contents missing');
   assert.equal(initial.hOverflow,false,'horizontal overflow');

   const sample=await page.evaluate(()=>{
     const work=document.getElementById('work');
     window.scrollTo(0,window.scrollY+work.getBoundingClientRect().top-window.innerHeight*.55);
     return {target:window.scrollY};
   });
   await new Promise(resolve=>setTimeout(resolve,180));
   const transition=await page.evaluate(()=>{
     const hero=document.querySelector('.paper-stack-panel.hero');
     const works=document.querySelector('.paper-stack-panel.works');
     return {
       heroTransform:getComputedStyle(hero).transform,
       worksTransform:getComputedStyle(works).transform,
       heroTop:hero.getBoundingClientRect().top,
       worksTop:works.getBoundingClientRect().top,
       title:document.querySelector('.works .section-top h2')?.textContent?.trim()
     };
   });
   assert(transition.title?.includes('selected'),'section heading changed');
   assert(transition.heroTransform!=='none','whole section did not move');
   assert(transition.worksTop<height,'next page did not enter');

   await page.evaluate(()=>window.scrollTo(0,0));
   await new Promise(resolve=>setTimeout(resolve,150));
   const reverse=await page.evaluate(()=>{
     const hero=document.querySelector('.paper-stack-panel.hero');
     return {top:hero.getBoundingClientRect().top, transform:getComputedStyle(hero).transform};
   });
   await page.screenshot({path:'paper-stack-'+name+'.png'});
   console.log('PAPER_STACK_AUDIT '+name+' '+JSON.stringify({initial,transition,reverse,errors}));
 }catch(error){
   failures++;
   console.error('PAPER_STACK_ERROR '+name+' '+error.stack);
 }
 await page.close();
}
// Accessible non-sticky layout for reduced-motion visitors.
const reduced=await browser.newPage();
await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
try{
 await reduced.goto(pageURL,{waitUntil:'domcontentloaded',timeout:20000});
 await reduced.waitForSelector('#work',{timeout:12000});
 await new Promise(resolve=>setTimeout(resolve,800));
 const state=await reduced.evaluate(()=>({
   enabled:document.documentElement.classList.contains('paper-stack-enabled'),
   sticky:document.querySelector('#work')?.classList.contains('paper-stack-panel')
 }));
 assert.equal(state.enabled,false,'reduced motion must not activate stacking');
 console.log('PAPER_STACK_REDUCED_MOTION '+JSON.stringify(state));
}catch(error){failures++;console.error('PAPER_STACK_REDUCED_ERROR '+error.stack);}
await reduced.close();
await browser.close();
if(failures)process.exitCode=1;
else console.log('All section-to-section paper-stack checks passed');
