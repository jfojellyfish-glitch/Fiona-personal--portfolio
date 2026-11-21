/* Regression: active UI navigation uses real vector icons on all devices.
 * Keep legacy-only text references explicit U+FE0E until removed. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const active = [
  'legacy/site-template.txt',
  'components/archive/ObjectsDrawer.tsx',
  'components/archive/PearlsDrawer.tsx',
  'components/archive/PhotographyDrawer.tsx',
  'app/archive/page.tsx'
];
let vectors=0;
for (const file of active) {
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source, /[↗↖↘↙←→↑↓➡⬅⬆]/u,
    `${file}: navigation must use SVG, not a Unicode emoji candidate`);
  vectors+=(source.match(/(?:class="plain-arrow"|<PlainArrow direction=)/g)||[]).length;
}
assert.ok(vectors>=35,`Expected 35+ vectors in portfolio UI, found ${vectors}`);
const css=fs.readFileSync('public/css/contact.css','utf8');
assert.match(css,/\.plain-arrow\s*\{/);
assert.match(css,/font-size:clamp\(130px,16\.5vw,260px\)/);
const legacy=fs.readFileSync('public/js/archive-content.js','utf8');
for(const match of legacy.matchAll(/[↗↖↘↙←→↑↓➡⬅⬆]/gu)){
  assert.equal(legacy[match.index+match[0].length],'\uFE0E',
    'legacy-only fallback navigation must request text presentation');
}
console.log(`✓ ${vectors} active SVG arrows; no Unicode emoji candidates`);
