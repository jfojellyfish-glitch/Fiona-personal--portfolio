/* Keyboard-friendly archive search: enabled when a collection has 4+ works. */
import type {CollectionKey} from './catalogue.js';
type Config={collectionId:string; listId:string; itemSelector:string; label:string; key:CollectionKey};
const sections:Config[]=[
 {collectionId:'pearls-collection',listId:'pearls-list',itemSelector:'.pearl-card',label:'search pearls',key:'pearls'},
 {collectionId:'objects-collection',listId:'objects-list',itemSelector:'.model-card',label:'search objects',key:'objects'},
 {collectionId:'photography-collection',listId:'photography-grid',itemSelector:'.photo-card',label:'search photography',key:'photography'}
];
const stores=new Map<CollectionKey,HTMLInputElement>();
function initSection(cfg:Config):void{
 const collection=document.getElementById(cfg.collectionId),list=document.getElementById(cfg.listId);
 if(!collection||!list)return;
 const toolbar=document.createElement('div');toolbar.className='archive-search';toolbar.hidden=true;
 const label=document.createElement('label');label.className='archive-search-label';label.textContent=cfg.label;
 const input=document.createElement('input');input.type='search';input.autocomplete='off';input.spellcheck=false;
 input.placeholder=cfg.label;input.setAttribute('aria-label',cfg.label);input.maxLength=100;
 const count=document.createElement('span');count.className='archive-search-count';count.setAttribute('aria-live','polite');
 const empty=document.createElement('p');empty.className='archive-search-empty';empty.textContent='nothing found.';empty.hidden=true;
 label.append(input);toolbar.append(label,count);collection.prepend(toolbar);list.after(empty);stores.set(cfg.key,input);
 const filter=():void=>{
   const elements=Array.from(list.querySelectorAll<HTMLElement>(cfg.itemSelector));
   toolbar.hidden=elements.length<4||(cfg.key==='pearls'&&location.hash.startsWith('#writing/'));
   const term=input.value.trim().toLocaleLowerCase();
   let showing=0;
   for(const item of elements){
     const matches=item.textContent?.toLocaleLowerCase().includes(term)??false;
     item.hidden=!matches;if(matches)showing++;
   }
   count.textContent=term?showing+' / '+elements.length:elements.length+' works';
   empty.hidden=showing>0||!term;
 };
 input.addEventListener('input',filter);window.addEventListener('hashchange',filter);
 const observer=new MutationObserver(filter);observer.observe(list,{childList:true});filter();
}
sections.forEach(initSection);
document.addEventListener('keydown',event=>{
 const target=event.target;if(!(target instanceof HTMLElement))return;
 const typing=target.matches('input, textarea, [contenteditable="true"]');
 const lightbox=document.getElementById('photo-lightbox');if(lightbox&&!lightbox.hidden)return;
 if(event.key==='/'&&!typing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   const key:CollectionKey|undefined=location.hash.startsWith('#writing')?'pearls':location.hash.startsWith('#objects')?'objects':location.hash.startsWith('#photography')?'photography':undefined;
   const field=key?stores.get(key):undefined;
   if(field&&!field.closest('.archive-search')?.hasAttribute('hidden')){event.preventDefault();field.focus();}
 }
 if(event.key==='Escape'&&target instanceof HTMLInputElement&&target.type==='search'){
   target.value='';target.dispatchEvent(new Event('input'));target.blur();
 }
});
