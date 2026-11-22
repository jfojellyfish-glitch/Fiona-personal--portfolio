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
// Make gallery image URLs independent of trailing slashes and current routes.
const assetPrefix=process.env.NEXT_PUBLIC_BASE_PATH ?? '/Fiona-personal--portfolio';
const sourceHomepage=markup.slice(0,cut).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const absoluteHomepage=sourceHomepage
 .replaceAll('src="./assets/', 'src="'+assetPrefix+'/assets/')
 .replaceAll("src='./assets/", "src='"+assetPrefix+'/assets/');
// Preserve the original 02 cover, but embed its small JPEG into static HTML:
// this removes a separate fragile image request on mobile Safari.
const cassieCover='src="'+assetPrefix+'/assets/skins-cassie.jpg"';
if(!absoluteHomepage.includes(cassieCover))throw new Error('3D Objects homepage cover not found');
const cassieData='data:image/jpeg;base64,'+readFileSync(join(process.cwd(),'public','assets','skins-cassie.jpg')).toString('base64');
const homepage=absoluteHomepage.replace(cassieCover,'src="'+cassieData+'"');
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
