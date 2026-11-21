'use client';
import {PlainArrow} from '@/components/PlainArrow';
import { createElement,useEffect,useMemo,useState } from 'react';
import { CollectionSearch } from './CollectionSearch';
import {assetUrl,validExternal} from './types';
import type { Model } from './types';

let viewerPromise:Promise<void>|null=null;
function loadViewer():Promise<void>{
 if(customElements.get('model-viewer'))return Promise.resolve();
 if(viewerPromise)return viewerPromise;
 viewerPromise=new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');script.type='module';
   script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js';
   script.onload=()=>customElements.whenDefined('model-viewer').then(()=>resolve(),reject);
   script.onerror=()=>reject(new Error('3D viewer is unavailable'));
   document.head.append(script);
 }).catch(err=>{viewerPromise=null;throw err;});
 return viewerPromise;
}
function sketchfabId(m:Model):string{
 const value=m.sketchfabId||'';
 if(/^[a-f0-9]{32}$/i.test(value))return value.toLowerCase();
 const u=validExternal(m.sketchfabUrl);
 if(!u)return '';
 const parsed=new URL(u);
 if(parsed.hostname!=='sketchfab.com'&&parsed.hostname!=='www.sketchfab.com')return '';
 const match=/([a-f0-9]{32})(?:\/|$)/i.exec(parsed.pathname);
 return match?match[1].toLowerCase():'';
}
function Viewer({model,active}:{model:Model;active:boolean}){
 const [ready,setReady]=useState(false);
 const [error,setError]=useState(false);
 const [retry,setRetry]=useState(0);
 const id=sketchfabId(model);
 const local=!!model.file&&model.file.endsWith('.glb');
 useEffect(()=>{
   if(!active){setReady(false);return;}
   if(!local){setReady(true);return;}
   let alive=true;setReady(false);setError(false);
   loadViewer().then(()=>{if(alive)setReady(true);}).catch(()=>{if(alive)setError(true);});
   return ()=>{alive=false;};
 },[active,local,retry]);
 const retryButton=()=>{setRetry(x=>x+1);setError(false);};
 return <article className="model-card model-card-direct">
   {(id||local)&&<div className="model-stage">
     {!active||!ready?error?<button type="button" className="model-stage-retry" onClick={retryButton}>viewer unavailable · retry <PlainArrow direction="up-right" /></button>:
       <p className="model-stage-status">loading 3d…</p>:
       local?createElement('model-viewer',{
         className:'model-interactive',src:assetUrl(model.file!),alt:model.alt||'3D artwork',
         'camera-controls':'','auto-rotate':'','rotation-per-second':'6deg','environment-image':'neutral',
         exposure:'1','shadow-intensity':'0.18','interaction-prompt':'auto',
         loading:'eager','touch-action':'pan-y',
         onError:()=>{setError(true);setReady(false);}
       }):<iframe title={model.title+' — interactive 3D model'} src={'https://sketchfab.com/models/'+id+'/embed?autostart=0&ui_controls=1'}
          allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}
   </div>}
   <h2 className="model-title">{model.title}</h2>
   {model.description&&<p className="model-description">{model.description}</p>}
   {model.year&&<p className="model-meta">{model.year}</p>}
   {(id||validExternal(model.url))&&<a className="model-link" target="_blank" rel="noopener noreferrer"
       href={id?'https://sketchfab.com/models/'+id:validExternal(model.url)}>{id?'open on sketchfab':'view project'} <PlainArrow direction="up-right" /></a>}
 </article>;
}
export function ObjectsDrawer({models,active}:{models:Model[];active:boolean}){
 const [query,setQuery]=useState('');
 const shown=useMemo(()=>models.filter(m=>[m.title,m.description,m.year].join(' ').toLocaleLowerCase()
     .includes(query.trim().toLocaleLowerCase())),[models,query]);
 return <section aria-label="3D Objects" className="archive-page" data-archive-page="objects" id="objects-page" hidden={!active}>
   <div className="archive-page-inner">
     <div className="archive-page-top"><a className="archive-back" href="#notes"><PlainArrow direction="left" /> back to index</a><span>fᵢₒₙₐ / 02</span></div>
     <header className="archive-page-heading"><p className="archive-overline">drawer no. 02 / objects</p>
       <h1 tabIndex={-1}>made in<br/>three dimensions.</h1><p>little objects, experiments, and digital sculptures.</p></header>
     {models.length===0?<div aria-label="Space reserved for original 3D objects" className="archive-object-stage">
        <div aria-hidden="true" className="archive-object-orbit"><i/><i/></div></div>:
       <div className="archive-collection" aria-label="3D model collection">
         <CollectionSearch label="search objects" count={models.length} query={query} setQuery={setQuery} active={active}/>
         <div className="model-list">{shown.map((m,i)=><Viewer key={m.file||m.sketchfabId||m.title+i} model={m} active={active}/>)}</div>
         {query&&shown.length===0&&<p className="archive-search-empty">nothing found.</p>}
       </div>}
     <nav aria-label="Archive pages" className="archive-page-bottom"><a href="#writing"><PlainArrow direction="left" /> pearls</a><a href="#photography">photography <PlainArrow direction="up-right" /></a></nav>
   </div>
 </section>;
}
