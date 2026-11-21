/* Portfolio data schema, checked during GitHub Actions runs. */
export type Pearl = {slug:string; title:string; file:string; date?:string; description?:string; category?:string};
export type Photo = {title:string; file:string; year?:string; location?:string; alt?:string};
export type Artwork = {title:string; year?:string; description?:string; alt?:string; file?:string; url?:string; sketchfabId?:string; sketchfabUrl?:string};
export type CollectionKey = 'pearls'|'photography'|'objects';
export type ValidationIssue = {path:string; message:string};
export function isRecord(value:unknown):value is Record<string,unknown>{
 return typeof value==='object' && value!==null && !Array.isArray(value);
}
export function safePath(value:unknown):value is string{
 return typeof value==='string' && !value.startsWith('/') && !value.startsWith('\\') &&
 !value.includes('..') && /^[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('//');
}
export function safeUrl(value:unknown):value is string{
 if(typeof value!=='string')return false;
 try{const url=new URL(value);return url.protocol==='https:';}catch{return false;}
}
export function isValidDate(value:unknown):boolean{
 if(typeof value!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split('-').map(Number);
 const dt=new Date(Date.UTC(y,m-1,d));
 return dt.getUTCFullYear()===y && dt.getUTCMonth()===m-1 && dt.getUTCDate()===d;
}
export function validateManifest(key:CollectionKey,value:unknown):ValidationIssue[]{
 const issues:ValidationIssue[]=[];
 const listKey={pearls:'entries',photography:'photos',objects:'models'}[key];
 if(!isRecord(value)||!Array.isArray(value[listKey]))return [{path:listKey,message:'Expected an array'}];
 const seen=new Set<string>();
 for(const [i,item] of (value[listKey] as unknown[]).entries()){
   const path=listKey+'['+i+']';
   const err=(message:string)=>issues.push({path,message});
   if(!isRecord(item)){err('Expected an object');continue;}
   if(typeof item.title!=='string'||!item.title.trim())err('Missing non-empty title');
   if(key==='pearls'){
     if(typeof item.slug!=='string'||!/^[a-z0-9][a-z0-9-]*$/.test(item.slug))err('Invalid slug');
     else if(seen.has(item.slug))err('Duplicate slug');else seen.add(item.slug);
     if(!safePath(item.file)||!item.file.endsWith('.md')||!item.file.startsWith('content/pearls/'))err('Use a safe .md file under content/pearls/');
     if(item.date!==undefined && !isValidDate(item.date))err('Invalid ISO date YYYY-MM-DD');
   }else if(key==='photography'){
     if(!safePath(item.file)||!item.file.startsWith('assets/photography/'))err('Use a safe file under assets/photography/');
     if(item.alt!==undefined&&typeof item.alt!=='string')err('alt must be text');
   }else{
     const local=safePath(item.file)&&item.file.startsWith('assets/models/')&&item.file.endsWith('.glb');
     const remote=safeUrl(item.url)||safeUrl(item.sketchfabUrl)||(typeof item.sketchfabId==='string'&&/^[a-f\d]{32}$/i.test(item.sketchfabId));
     if(!local&&!remote)err('Provide assets/models/*.glb, a valid Sketchfab ID, or an HTTPS URL');
   }
   if(item.year!==undefined && !/^\d{4}$/.test(String(item.year)))err('year should be YYYY');
 }
 return issues;
}
