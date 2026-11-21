'use client';

import { useEffect } from 'react';
declare global { interface Window { __fionaPortfolioBooted?: boolean; } }
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? '/Fiona-personal--portfolio';
const scripts: Array<[string,'module'|'classic']> = [
  ['intro-webgl.js','module'], ['main.js','classic'], ['scroll-motion.js','classic'], ['paper-stack.js','classic']
];
/** Boot the original custom WebGL intro and archive after React hydration.
 *  Archive drawers are now React components, not a DOM-mutation script.
 *  No server-dependent code is used so the site can export statically.
 */
export function LegacyBoot(){
  useEffect(()=>{
    if(window.__fionaPortfolioBooted)return;
    window.__fionaPortfolioBooted=true;
    let active=true;
    const load=(file:string,type:'module'|'classic')=>new Promise<void>((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=`${prefix}/js/${file}`;
      if(type==='module')s.type='module';else s.async=false;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('Unable to load '+file));
      document.body.appendChild(s);
    });
    (async()=>{
      for(const [file,type] of scripts){if(!active)return;await load(file,type);}
    })().catch(error=>{
      console.error('Portfolio interaction initialization failed',error);
      document.querySelector<HTMLButtonElement>('#intro-enter')?.addEventListener('click',()=>{
        document.documentElement.classList.remove('intro-locked');
        document.body.classList.remove('intro-locked');
        document.querySelector('#intro-screen')?.setAttribute('hidden','');
        document.querySelector('.site')?.removeAttribute('inert');
      },{once:true});
    });
    return ()=>{active=false;};
  },[]);
  return null;
}
