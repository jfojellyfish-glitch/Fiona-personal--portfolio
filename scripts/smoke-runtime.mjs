import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
if(!executablePath)throw new Error('Chrome executable not found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'jfojellyfish-glitch/Fiona-personal--portfolio').split('/');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/' + repository;
const urls=[
 ['local', 'http://127.0.0.1:4173' + basePath + '/'],
 ['live', 'https://' + owner + '.github.io' + basePath + '/']
];
let fails=0;
for(const [label,url] of urls) {
 for(const [viewportName,width,height] of [['desktop',1366,820],['mobile',390,844],['mobile-small',320,720]]){
  if(label==='live'&&viewportName==='mobile-small')continue;
  const page=await browser.newPage();
  await page.setViewport({width,height,isMobile:viewportName==='mobile',deviceScaleFactor:1});
  const errors=[],failed=[],bad=[];
  page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
  page.on('requestfailed',r=>failed.push(r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
   await new Promise(res=>setTimeout(res,4000));
   const title=await page.title();
   const pre=await page.evaluate(()=>({
     intro:!!document.querySelector('#intro-enter'),
     portfolio:!!document.querySelector('.site'),
     obj:!!document.querySelector('#objects-page'),
     nav:document.querySelectorAll('a[href="#objects"]').length,
     locked:document.body.classList.contains('intro-locked'),
     text:document.body.innerText.slice(0,280),
   }));
   const typography=await page.evaluate(async ()=>{
     await document.fonts.ready;
     const get=(selector)=>{
       const el=document.querySelector(selector);
       if(!el)return null;
       const s=getComputedStyle(el);
       return {family:s.fontFamily,style:s.fontStyle,weight:s.fontWeight};
     };
     return {intro:get('.hero-bottom .hero-intro'),second:get('.hero-bottom .kicker'),
       loaded:document.fonts.check('italic 500 18px "Playfair Display"'),
       overflow:document.documentElement.scrollWidth>window.innerWidth+3};
   });
   console.log('MOBILE HOME COPY TYPE '+label+' '+viewportName+' '+JSON.stringify(typography));
   if(label==='local'&&viewportName==='mobile'&&(
     !typography.intro?.family.includes('Playfair Display')||
     typography.intro?.weight!=='500'||
     typography.intro?.style!=='italic'||
     !typography.second?.family.includes('Playfair Display')||
     typography.second?.weight!=='500'||
     typography.second?.style!=='italic'||
     !typography.loaded||typography.overflow))fails++;
   if(label==='local'&&viewportName==='desktop'&&
     typography.intro?.family.includes('Playfair Display'))fails++;
   // Assert the entire mobile experience uses the selected Playfair variant,
   // rather than only the two homepage introduction paragraphs.
   const globalType=await page.evaluate(async ()=>{
     await document.fonts.ready;
     const selectors=[
       '#intro-screen .intro-kicker',
       'nav#top .links a',
       '.hero-title.hero-signature',
       '.hero-bottom .hero-intro',
       '.hero-bottom .kicker',
       '.works .section-top h2',
       '.work-list .name',
       '.notes h2',
       '.about-body .about-poem p',
       '.contact-heading h2',
       '#objects-page .archive-page-heading h1',
       '#objects-page .model-title'
     ];
     const samples=selectors.map(selector=>{
       const node=document.querySelector(selector),s=node&&getComputedStyle(node);
       return {selector,exists:!!node,family:s?.fontFamily||'',weight:s?.fontWeight||'',style:s?.fontStyle||''};
     });
     return {samples,fontReady:document.fonts.check('italic 500 18px "Playfair Display"'),
       overflow:document.documentElement.scrollWidth>innerWidth+3};
   });
   console.log('GLOBAL MOBILE TYPE '+label+' '+viewportName+' '+JSON.stringify(globalType));
   if(label==='local'&&viewportName.startsWith('mobile')){
     for(const sample of globalType.samples){
       if(!sample.exists || !sample.family.includes('Playfair Display') ||
          sample.weight!=='500'||sample.style!=='italic'){
         console.error('Wrong mobile font',sample);fails++;
       }
     }
     if(!globalType.fontReady||globalType.overflow){
       console.error('Mobile font unavailable or page overflows',globalType);fails++;
     }
   }
   if(label==='local'&&viewportName==='desktop'){
     if(globalType.samples.some(s=>s.family.includes('Playfair Display'))){
       console.error('Desktop typography changed unexpectedly');fails++;
     }
   }
   await page.screenshot({path:'smoke-'+label+'-'+viewportName+'-intro.png',fullPage:false});
   if(pre.intro){
    await page.click('#intro-enter');
    await new Promise(res=>setTimeout(res,1100));
    await page.evaluate(()=>location.hash='#objects');
    await new Promise(res=>setTimeout(res,3000));
   }
   const post=await page.evaluate(()=>({
     hash:location.hash,
     locked:document.body.classList.contains('intro-locked'),
     open:document.body.classList.contains('archive-open'),
     objPage:!!document.querySelector('#objects-page')&&!document.querySelector('#objects-page')?.hasAttribute('hidden'),
     modelTitle:document.querySelector('#objects-page .model-title')?.textContent,
     modelViewer:!!document.querySelector('#objects-page model-viewer'),
     retry:document.querySelector('.model-stage-retry')?.textContent,
     text:document.body.innerText.slice(0,500)
   }));
   await page.screenshot({path:'smoke-'+label+'-'+viewportName+'-objects.png',fullPage:false});
   if(label==='local'&&viewportName.startsWith('mobile')){
     const archiveUrl=new URL('./archive/',url).href;
     const archiveResponse=await page.goto(archiveUrl,{waitUntil:'domcontentloaded',timeout:40000});
     await page.evaluate(()=>document.fonts.ready);
     const archiveType=await page.evaluate(()=>{
       const el=document.querySelector('.next-archive h1');
       if(!el)return {exists:false};
       const s=getComputedStyle(el);
       return {exists:true,family:s.fontFamily,weight:s.fontWeight,style:s.fontStyle,
         overflow:document.documentElement.scrollWidth>window.innerWidth+3};
     });
     console.log('ARCHIVE TYPE '+viewportName+' '+JSON.stringify(archiveType));
     if(![200,304].includes(archiveResponse?.status())||
       !archiveType.exists||!archiveType.family?.includes('Playfair Display')||
       archiveType.weight!=='500'||archiveType.style!=='italic'||archiveType.overflow){
       console.error('Archive typography mismatch',archiveType);fails++;
     }
   }

   console.log(JSON.stringify({label,viewportName,url,status:response?.status(),title,pre,post,errors,failed:failed.slice(0,8),bad:bad.slice(0,12)},null,2));
   if(![200,304].includes(response?.status())||!pre.intro||!pre.portfolio||!pre.obj||!post.objPage||post.locked||!post.modelTitle){fails++;}
  }catch(e){fails++;console.error('BROWSER FAILURE '+label+' '+viewportName+': '+e.stack);}
  await page.close();
 }
}
await browser.close();
if(fails){console.error(fails+' smoke tests failed');process.exitCode=1;}else console.log('All browser smoke tests passed');
