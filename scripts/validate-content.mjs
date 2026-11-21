import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateManifest,safePath} from '../public/js/catalogue.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifests=[['pearls','content/pearls/index.json','entries'],['photography','content/photography/index.json','photos'],['objects','content/objects/index.json','models']];
const failures=[];
for(const [key,filename,arrayName] of manifests){
 try{
  const content=JSON.parse(fs.readFileSync(path.join(root,'public',filename),'utf8'));
  for(const issue of validateManifest(key,content))failures.push(filename+': '+issue.path+': '+issue.message);
  for(const [i,item] of (content[arrayName]||[]).entries()){
   if(item&&safePath(item.file)){
    const filenameOnDisk=path.join(root,'public',item.file);
    if(!fs.existsSync(filenameOnDisk))failures.push(filename+': missing file '+item.file);
    else if(item.file.endsWith('.glb')){
     const size=fs.statSync(filenameOnDisk).size;
     const fd=fs.openSync(filenameOnDisk,'r'),header=Buffer.alloc(12);
     fs.readSync(fd,header,0,12,0);fs.closeSync(fd);
     if(header.toString('ascii',0,4)!=='glTF'||header.readUInt32LE(4)!==2||header.readUInt32LE(8)!==size)failures.push('Invalid GLB '+item.file);
     if(size>25*1024*1024)failures.push('Oversized GLB '+item.file);
    }
   }
  }
  console.log('✓ '+key+': '+content[arrayName].length+' items checked');
 }catch(error){failures.push(filename+': '+error.message);}
}
for(const p of ['app/page.tsx','public/css/style.css','public/js/main.js','public/js/intro-webgl.js','public/assets/fiona-logo.glb']){
 if(!fs.existsSync(path.join(root,p)))failures.push('Missing core site file: '+p);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('✓ Content manifests and core site files passed');
