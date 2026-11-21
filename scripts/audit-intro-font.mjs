/* Browser verification for the user-authorized Retrogression webfont on the intro only. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Chrome executable unavailable');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const repository=(process.env.GITHUB_REPOSITORY||'jfojellyfish-glitch/Fiona-personal--portfolio').split('/')[1];
const base=process.env.NEXT_PUBLIC_BASE_PATH||('/'+repository);
let errors=0;
for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage();
  await page.setViewport({width,height,deviceScaleFactor:1});
  try{
    const response=await page.goto('http://127.0.0.1:4173'+base+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const result=await page.evaluate(async()=>{
      const selectors=['#intro-screen .intro-kicker','#intro-screen .intro-invite .intro-sub'];
      const output=[];
      for(const sel of selectors){
        const element=document.querySelector(sel);
        const font=element?getComputedStyle(element).fontFamily:'NOT_FOUND';
        const loaded=await Promise.race([
           document.fonts.load('400 16px Retrogression',element?.textContent||'hello').then(face=>face.map(f=>({family:f.family,status:f.status}))).catch(error=>({error:String(error)})),
           new Promise(resolve=>setTimeout(()=>resolve({error:'Font load timed out'}),10000))
        ]);
        const box=element?.getBoundingClientRect();
        output.push({selector:sel,text:element?.textContent,font,loaded,width:box?.width,viewport:innerWidth});
      }
      return output;
    });
    console.log('RETROGRESSION_AUDIT '+label+' '+JSON.stringify({http:response?.status(),elements:result}));
    if(response?.status()!==200||result.some(x=>!x.font.includes('Retrogression')||!Array.isArray(x.loaded)||x.loaded.length===0)){errors++;}
  }catch(error){console.error('RETROGRESSION_FAILURE '+label+' '+error.stack);errors++;}
  await page.close();
}
await browser.close();
if(errors){console.error(errors+' font load checks failed');process.exitCode=1;}
else console.log('Retrogression verified on desktop and mobile');
