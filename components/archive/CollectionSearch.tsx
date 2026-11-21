'use client';
import { useEffect,useRef } from 'react';
export function CollectionSearch({label,count,query,setQuery,active}:{
 label:string;count:number;query:string;setQuery:(s:string)=>void;active:boolean;
}){
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{
   if(!active||count<4)return;
   const onKey=(event:KeyboardEvent)=>{
     const el=event.target as HTMLElement|null;
     if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!el?.closest('input, textarea, [contenteditable="true"]')){
       event.preventDefault();input.current?.focus();
     }
   };
   document.addEventListener('keydown',onKey);
   return ()=>document.removeEventListener('keydown',onKey);
 },[active,count]);
 if(count<4)return null;
 return <div className="archive-search">
   <label className="archive-search-label">{label}
     <input ref={input} type="search" maxLength={100} autoComplete="off" spellCheck={false} placeholder={label}
       value={query} onChange={e=>setQuery(e.target.value)}
       onKeyDown={e=>{if(e.key==='Escape'){setQuery('');e.currentTarget.blur();}}}/>
   </label>
   <span className="archive-search-count" aria-live="polite">{count} works</span>
 </div>;
}
