import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {LegacyBoot} from '@/components/LegacyBoot';
import {ArchiveDrawers} from '@/components/archive/ArchiveDrawers';
import type {Pearl,Photo,Model} from '@/components/archive/types';

/** Original artist-designed landing page remains byte-identical.
 * React owns the three Archive drawers instead of the legacy DOM writer.
 */
const template=readFileSync(join(process.cwd(),'legacy','site-template.txt'),'utf8');
const markup=template.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]??'';
const archiveMarker='<div aria-live="off" class="archive-pages" id="archive-pages">';
const cut=markup.indexOf(archiveMarker);
if(cut<0||!markup.includes('id="intro-enter"'))throw new Error('Portfolio template landmarks not found');
const homepage=markup.slice(0,cut).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
function manifest<T>(category:'pearls'|'photography'|'objects',name:'entries'|'photos'|'models'):T[]{
 const file=join(process.cwd(),'public','content',category,'index.json');
 const data=JSON.parse(readFileSync(file,'utf8')) as Record<string,unknown>;
 if(!Array.isArray(data[name]))throw new Error('Invalid '+category+' manifest');
 return data[name] as T[];
}
export default function Home(){
 const pearls=manifest<Pearl>('pearls','entries'),photos=manifest<Photo>('photography','photos'),
   models=manifest<Model>('objects','models');
 return <>
   <div id="portfolio-site" dangerouslySetInnerHTML={{__html:homepage}}/>
   <ArchiveDrawers pearls={pearls} photos={photos} models={models}/>
   <LegacyBoot/>
 </>;
}
