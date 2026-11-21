/* Visual regression audit: render the exported and published Contact section in Chrome.
   Screenshots are uploaded as workflow artifacts; reduced JPEGs are logged for inspection. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
if(!executablePath)throw new Error('Chrome executable not found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const [owner,repo]=(process.env.GITHUB_REPOSITORY||'jfojellyfish-glitch/Fiona-personal--portfolio').split('/');
const base=process.env.NEXT_PUBLIC_BASE_PATH??('/'+repo);
const sources=[['published','https://'+owner+'.github.io'+base+'/']];
const viewports=[['desktop',1440,900],['ipad-portrait',820,1180]];
for(const [origin,url] of sources){
 for(const [name,width,height] of viewports){
  const page=await browser.newPage();
  await page.setViewport({width,height,deviceScaleFactor:1,isMobile:name==='mobile',hasTouch:name!=='desktop'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>errors.push('network '+r.url()+' '+r.failure()?.errorText));
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForSelector('#contact-angel-canvas',{timeout:7000});
    await page.evaluate(()=>{
      document.body.classList.remove('intro-locked');
      document.documentElement.classList.remove('intro-locked');
      document.querySelector('#intro-screen')?.setAttribute('hidden','');
      document.querySelector('.site')?.removeAttribute('inert');
      document.getElementById('contact')?.scrollIntoView({block:'start',behavior:'instant'});
    });
    // At 6.8 s almost all letters have appeared, before the fading sequence.
    await page.waitForFunction(()=>performance.now()>6900,{timeout:15000});
    const result=await page.evaluate(()=>{
      const bbox=sel=>{const e=document.querySelector(sel);if(!e)return null;const x=e.getBoundingClientRect();return {x:+x.x.toFixed(1),y:+x.y.toFixed(1),width:+x.width.toFixed(1),height:+x.height.toFixed(1),right:+x.right.toFixed(1)};};
      const canvas=document.getElementById('contact-angel-canvas');
      const c=canvas?.getContext('2d',{willReadFrequently:true});
      const data=c?.getImageData(0,0,canvas.width,canvas.height).data;
      let nonZero=0,peak=0;
      if(data){const step=Math.max(1,Math.ceil(data.length/4/300000));for(let i=3;i<data.length;i+=4*step){if(data[i]>0)nonZero++;peak=Math.max(peak,data[i]);}}
      const title=bbox('#contact-heading'),left=bbox('.contact-heading'),details=bbox('.contact-details'),email=bbox('.contact-email');
      return {at:Math.round(performance.now()),viewport:{width:innerWidth,height:innerHeight},
        section:bbox('#contact'),heading:title,headingColumn:left,
        firstLine:bbox('.contact-line-one'),secondLine:bbox('.contact-line-two'),
        email,emailSection:details,canvas:bbox('#contact-angel-canvas'),
        canvasPixelWidth:canvas?.width,nonZeroCanvasSamplePixels:nonZero,peakCanvasAlpha:peak,
        angelImgLoaded:!!document.querySelector('.contact-mark')?.naturalWidth,
        angelImgNaturalWidth:document.querySelector('.contact-mark')?.naturalWidth,
        arrowCount:document.querySelectorAll('#contact .plain-arrow,#contact .contact-plain-arrow').length,
        textOverflow:document.documentElement.scrollWidth>innerWidth+2,
        titleEmailOverlap:!!title&&!!email&&title.right>email.x&&title.y<email.y+email.height&&title.y+title.height>email.y};
    });
    const el=await page.$('#contact');
    const screenshot=await el.screenshot({type:'jpeg',quality:48});
    const file='contact-audit-'+origin+'-'+name+'.jpg';
    fs.writeFileSync(file,screenshot);
    console.log('CONTACT_AUDIT '+origin+' '+name+' '+JSON.stringify({status:response?.status(),...result,errors}));
    if(origin==='published'){
      console.log('CONTACT_IMAGE_'+origin+'_'+name+'_BEGIN');
      console.log(Buffer.from(screenshot).toString('base64'));
      console.log('CONTACT_IMAGE_'+origin+'_'+name+'_END');
    }
    if(response?.status()!==200||result.peakCanvasAlpha===0||result.titleEmailOverlap||result.textOverflow)
      console.error('CONTACT_PROBLEM '+origin+' '+name);
  }catch(e){console.error('CONTACT_AUDIT_ERROR '+origin+' '+name+' '+e.stack);}
  finally{await page.close();}
 }
}
await browser.close();