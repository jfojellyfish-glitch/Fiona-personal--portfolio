'use client';
import {PlainArrow} from '@/components/PlainArrow';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CollectionSearch} from './CollectionSearch';
import {assetUrl} from './types';
import type {Photo} from './types';

export function PhotographyDrawer({photos,active}:{photos:Photo[];active:boolean}){
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<number|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null);
 const prior=useRef<HTMLElement|null>(null);
 const shown=useMemo(()=>photos.filter(p=>[p.title,p.year,p.location].join(' ').toLocaleLowerCase()
   .includes(query.trim().toLocaleLowerCase())),[photos,query]);
 const close=()=>{setSelected(null);};
 const open=(p:Photo)=>{
   prior.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
   setSelected(photos.indexOf(p));
 };
 useEffect(()=>{if(!active)setSelected(null);},[active]);
 useEffect(()=>{
   if(selected===null){prior.current?.focus();return;}
   closeRef.current?.focus();
   const handler=(event:KeyboardEvent)=>{
     if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
     else if(event.key==='ArrowLeft'){event.preventDefault();setSelected(n=>n===null?null:(n-1+photos.length)%photos.length);}
     else if(event.key==='ArrowRight'){event.preventDefault();setSelected(n=>n===null?null:(n+1)%photos.length);}
     else if(event.key==='Tab'){
       const controls=Array.from(document.querySelectorAll<HTMLElement>('.photo-lightbox button:not(:disabled)'));
       if(!controls.length)return;
       const first=controls[0],last=controls[controls.length-1];
       if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
       else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
     }
   };
   document.addEventListener('keydown',handler,true);
   return ()=>document.removeEventListener('keydown',handler,true);
 },[selected,photos.length]);
 const selectedPhoto=selected!==null?photos[selected]:null;
 return <section aria-label="Photography" className="archive-page" data-archive-page="photography" id="photography-page" hidden={!active}>
   <div className="archive-page-inner">
     <div className="archive-page-top"><a className="archive-back" href="#notes"><PlainArrow direction="left" /> back to index</a><span>fᵢₒₙₐ / 03</span></div>
     <header className="archive-page-heading"><p className="archive-overline">drawer no. 03 / photographs</p>
       <h1 tabIndex={-1}>through<br/>my eyes.</h1><p>a place for the photographs I want to keep.</p></header>
     {photos.length===0?<div className="archive-empty archive-photo-empty"><span className="archive-small-num">03 —</span></div>:
       <div className="archive-collection" aria-label="Photography collection">
         <CollectionSearch label="search photography" count={photos.length} query={query} setQuery={setQuery} active={active&&selected===null}/>
         <div className="photo-grid">
           {shown.map(p=><button key={p.file} type="button" className="photo-card" onClick={()=>open(p)}
                aria-label={'Open photograph: '+p.title}>
             <img src={assetUrl(p.file)} alt={p.alt||p.title} loading="lazy" decoding="async"/>
             <span className="photo-caption">{p.title}</span>
             <span className="photo-meta">{[p.year,p.location].filter(Boolean).join(' · ')}</span>
           </button>)}
         </div>{query&&shown.length===0&&<p className="archive-search-empty">nothing found.</p>}
       </div>}
     {selectedPhoto&&<div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Photograph viewer">
       <div className="photo-lightbox-bar"><span>{selected!+1} / {photos.length}</span>
         <button ref={closeRef} type="button" className="photo-close" aria-label="Close photograph" onClick={close}>close ×</button></div>
       <div className="photo-lightbox-body">
         <button type="button" aria-label="Previous photograph" onClick={()=>setSelected(n=>n===null?null:(n-1+photos.length)%photos.length)}><PlainArrow direction="left" /></button>
         <img src={assetUrl(selectedPhoto.file)} alt={selectedPhoto.alt||selectedPhoto.title}/>
         <button type="button" aria-label="Next photograph" onClick={()=>setSelected(n=>n===null?null:(n+1)%photos.length)}><PlainArrow direction="right" /></button>
       </div>
       <div className="photo-lightbox-caption"><span>{selectedPhoto.title}</span>
         <span>{[selectedPhoto.year,selectedPhoto.location].filter(Boolean).join(' · ')}</span></div>
     </div>}
     <nav aria-label="Archive pages" className="archive-page-bottom"><a href="#objects"><PlainArrow direction="left" /> 3d objects</a><span>© 2026 Fiona Qian</span></nav>
   </div>
 </section>;
}
