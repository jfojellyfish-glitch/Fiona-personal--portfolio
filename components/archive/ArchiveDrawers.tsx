'use client';
import {useEffect,useRef,useState} from 'react';
import {PearlsDrawer} from './PearlsDrawer';
import {ObjectsDrawer} from './ObjectsDrawer';
import {PhotographyDrawer} from './PhotographyDrawer';
import type {Drawer,Pearl,Photo,Model} from './types';

type Location={drawer:Drawer;slug:string};
function route():Location{
 if(typeof window==='undefined')return {drawer:'none',slug:''};
 const hash=decodeURIComponent(location.hash.replace(/^#/,''));
 const drawer=hash.split('/')[0];
 return {drawer:drawer==='writing'||drawer==='objects'||drawer==='photography'?drawer:'none',
   slug:drawer==='writing'?hash.slice('writing/'.length).replace(/^writing$/,''):''};
}
export function ArchiveDrawers({pearls,photos,models}:{pearls:Pearl[];photos:Photo[];models:Model[]}){
 const [current,setCurrent]=useState<Location>({drawer:'none',slug:''});
 const previous=useRef<Drawer>('none');
 useEffect(()=>{
   function sync(){
     const next=route(),opened=next.drawer!=='none';
     setCurrent(next);document.body.classList.toggle('archive-open',opened);
     if(opened){
       const page=document.getElementById(next.drawer+'-page');
       if(page){page.scrollTop=0;page.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}
     }else if(previous.current!=='none'){
       document.getElementById('notes')?.scrollIntoView({block:'start',behavior:'auto'});
     }
     previous.current=next.drawer;
   }
   window.addEventListener('hashchange',sync);sync();
   return ()=>{window.removeEventListener('hashchange',sync);document.body.classList.remove('archive-open');};
 },[]);
 useEffect(()=>{
   function onEscape(event:KeyboardEvent){
     if(event.key!=='Escape'||current.drawer==='none'||event.defaultPrevented)return;
     const editable=event.target instanceof HTMLElement&&event.target.closest('input,textarea,[contenteditable="true"]');
     if(editable)return;
     location.hash='#notes';
   }
   document.addEventListener('keydown',onEscape);
   return ()=>document.removeEventListener('keydown',onEscape);
 },[current.drawer]);
 return <div className="archive-pages" id="archive-pages" aria-live="off">
   <PearlsDrawer entries={pearls} active={current.drawer==='writing'} slug={current.slug}/>
   <ObjectsDrawer models={models} active={current.drawer==='objects'}/>
   <PhotographyDrawer photos={photos} active={current.drawer==='photography'}/>
 </div>;
}
