import {PlainArrow} from '@/components/PlainArrow';
import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import './archive.css';
type Entry = {title:string;year?:string;date?:string;slug?:string;location?:string};
function items(kind:'pearls'|'photography'|'objects',key:'entries'|'photos'|'models'):Entry[]{
  const file=join(process.cwd(),'public','content',kind,'index.json');
  const manifest=JSON.parse(readFileSync(file,'utf8')) as Record<string,Entry[]>;
  return manifest[key] || [];
}
export const metadata:Metadata={title:'@𝒂𝒏𝒈𝒆𝒍𝒌𝒖𝒓𝒂𝒈𝒆'};
const homeUrl=(process.env.NEXT_PUBLIC_BASE_PATH ?? '/Fiona-personal--portfolio')+'/';
const collections=[
  {id:'01',name:'pearls',route:'/#writing',data:items('pearls','entries')},
  {id:'02',name:'3d objects',route:'/#objects',data:items('objects','models')},
  {id:'03',name:'photography',route:'/#photography',data:items('photography','photos')}
];
export default function ArchivePage(){
  return <main className="next-archive">
    <header><a href={homeUrl}><PlainArrow direction="left" /> back to portfolio</a><span>personal archive / 2026</span></header>
    <h1>things on<br/>my desktop.</h1>
    <p className="archive-explainer">three drawers: one for words, one for objects, and one for photographs.</p>
    <div className="archive-collections">{collections.map(c=><section key={c.id}>
      <div className="archive-collection-heading"><span>{c.id} / {c.name}</span><a href={`${homeUrl}${c.route.slice(1)}`}>open drawer <PlainArrow direction="up-right" /></a></div>
      {c.data.length?<ul>{c.data.map((item,i)=><li key={item.title+i}><span>{item.title}</span><small>{item.year??item.date??item.location??''}</small></li>)}</ul>:<p className="archive-empty-state">a little space for things to come.</p>}
    </section>)}</div>
    <footer>© 2026 Fiona Qian</footer>
  </main>;
}
