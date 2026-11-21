/* Character-level regression check for iOS text-arrow rendering. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const files = ['legacy/site-template.txt','public/js/archive-content.js','app/archive/page.tsx'];
let arrows = 0;
for (const file of files) {
  const source = fs.readFileSync(file,'utf8');
  const glyphs = [...source.matchAll(/[↗↖↘↙←→↑↓➡⬅⬆]/g)];
  for (const match of glyphs) {
    const next = source.slice(match.index + match[0].length, match.index + match[0].length + 1);
    assert.equal(next, '\uFE0E', `${file}: arrow at ${match.index} must request text presentation`);
    arrows += 1;
  }
}
assert.ok(arrows > 20, 'Expected coverage for all portfolio navigation arrows');
console.log(`✓ ${arrows} arrows explicitly use text presentation`);
