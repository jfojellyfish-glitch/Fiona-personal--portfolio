import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const paths=['legacy/site-template.txt','public/js/archive-content.js','app/archive/page.tsx'];
let count=0;
for(const path of paths){
 const source=readFileSync(path,'utf8');
 const matches=source.matchAll(/[↗↖↘↙←→↑↓➡⬅⬆]/g);
 for(const match of matches){
  assert.equal(source[match.index+match[0].length],'\uFE0E',path+': arrow should have text-variation selector');
  count++;
 }
}
assert(count>20,'Expected to validate multiple arrow glyphs');
console.log('✓ '+count+' text arrows checked');
