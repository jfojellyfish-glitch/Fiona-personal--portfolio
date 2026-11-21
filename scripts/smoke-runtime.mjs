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
 for(const [viewportName,width,height] of [['desktop',1366,820],['mobile',390,844]]){
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
   console.log(JSON.stringify({label,viewportName,url,status:response?.status(),title,pre,post,errors,failed:failed.slice(0,8),bad:bad.slice(0,12)},null,2));
   if(![200,304].includes(response?.status())||!pre.intro||!pre.portfolio||!pre.obj||!post.objPage||post.locked||!post.modelTitle){fails++;}
  }catch(e){fails++;console.error('BROWSER FAILURE '+label+' '+viewportName+': '+e.stack);}
  await page.close();
 }
}
await browser.close();
if(fails){console.error(fails+' smoke tests failed');process.exitCode=1;}else console.log('All browser smoke tests passed');
