import {PlainArrow} from '@/components/PlainArrow';
'use client';
import { useEffect,useMemo,useState } from 'react';
import { CollectionSearch } from './CollectionSearch';
import { Markdown } from './Markdown';
import { assetUrl,formatDate } from './types';
import type { Pearl } from './types';

export function PearlsDrawer({entries,active,slug}:{entries:Pearl[];active:boolean;slug:string}){
 const [query,setQuery]=useState('');
 const [markdown,setMarkdown]=useState('');
 const [loadError,setLoadError]=useState(false);
 const selected=entries.find(e=>e.slug===slug);
 const visible=useMemo(()=>entries.filter(e=>[e.title,e.description,e.category,e.date]
   .join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[entries,query]);
 useEffect(()=>{
   if(!selected||!active){setMarkdown('');setLoadError(false);return;}
   const ctrl=new AbortController();
   setMarkdown('');setLoadError(false);
   fetch(assetUrl(selected.file),{signal:ctrl.signal,cache:'no-cache'})
     .then(r=>{if(!r.ok)throw new Error('Markdown missing');return r.text();})
     .then(setMarkdown).catch(e=>{if(e.name!=='AbortError')setLoadError(true);});
   return ()=>ctrl.abort();
 },[selected,active]);
 return <section aria-label="Pearls" className="archive-page" data-archive-page="writing" id="writing-page" hidden={!active}>
   <div className="archive-page-inner">
     <div className="archive-page-top"><a className="archive-back" href="#notes"><PlainArrow direction="left" /> back to index</a><span>fᵢₒₙₐ / 01</span></div>
     <header className="archive-page-heading"><p className="archive-overline">drawer no. 01 / pearls</p>
       <h1 tabIndex={-1}>passing<br/>thoughts.</h1><p>essays, notes, and things I wanted to write down.</p></header>
     {entries.length===0?<div className="archive-empty archive-writing-empty"><span className="archive-small-num">01 —</span></div>:
     <div className="archive-collection" aria-label="Published pearls">
       {selected?<article className="pearl-reader">
         <a className="pearl-reader-back" href="#writing"><PlainArrow direction="left" /> all pearls</a>
         <p className="pearl-reader-date">{[formatDate(selected.date),selected.category].filter(Boolean).join(' / ')}</p>
         <h2>{selected.title}</h2>
         <div className="pearl-reader-body">{loadError?<p>This pearl could not be opened. Please check its file path.</p>:
           markdown?<Markdown text={markdown}/>:<p>loading…</p>}</div>
         <a className="pearl-reader-bottom" href="#writing"><PlainArrow direction="left" /> back to pearls</a>
       </article>:<>
         <CollectionSearch label="search pearls" count={entries.length} query={query} setQuery={setQuery} active={active}/>
         <div className="pearl-list">
           {visible.map(p=><a key={p.slug} className="pearl-card" href={'#writing/'+p.slug}>
             <span className="pearl-card-date">{formatDate(p.date)}</span>
             <div className="pearl-card-copy"><h2 className="pearl-card-title">{p.title}</h2><p className="pearl-card-description">{p.description||''}</p></div>
             <span className="pearl-card-arrow" aria-hidden="true"><PlainArrow direction="up-right" /></span>
           </a>)}
         </div>{query&&visible.length===0&&<p className="archive-search-empty">nothing found.</p>}
       </>}
     </div>}
     <nav aria-label="Archive pages" className="archive-page-bottom"><a href="#objects">next / 3d objects <PlainArrow direction="up-right" /></a><span>© 2026 Fiona Qian</span></nav>
   </div>
 </section>;
}
