import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repository = (process.env.GITHUB_REPOSITORY || 'jfojellyfish-glitch/Fiona-personal--portfolio').split('/').at(-1);
const prefix = process.argv[2] ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '/' + repository;
assert(prefix === '' || (prefix.startsWith('/') && !prefix.includes('..')), 'Expected GitHub Pages project path');
const pages = ['out/index.html', 'out/archive/index.html'];
for (const file of pages) assert(existsSync(file), 'Next.js export missing: ' + file);
const home = readFileSync('out/index.html','utf8');
const archive = readFileSync('out/archive/index.html','utf8');
const expectedAssets = [prefix + '/css/style.css', prefix + '/js/intro-webgl.js', prefix + '/assets/lotus-growth.png'];
for (const url of [expectedAssets[0], expectedAssets[2]]) {
 assert(home.includes(url), 'Homepage missing expected new URL: ' + url);
}
assert(home.includes(prefix + '/_next/'), 'Next.js bundles not prefixed by ' + prefix);
assert(archive.includes(prefix + '/'), 'Archive links not prefixed by ' + prefix);
const liveAssetName = 'assets/models/model-01.glb';
assert(existsSync(join('out', liveAssetName)), '3D object asset lost during export');
assert(existsSync('out/assets/fiona-logo.glb'), 'Intro 3D asset lost during export');
assert(existsSync('out/assets/lotus-manifesto-2026.png'), 'Original manifesto lotus is missing from the static export');
const lotusData = readFileSync('out/assets/lotus-manifesto-2026.png');
assert(lotusData.readUInt32BE(16)===791 && lotusData.readUInt32BE(20)===1989, 'Lotus dimensions must remain 791x1989');
console.log('✓ Pages export uses base path ' + (prefix || '/') + ' and retains both original 3D assets');
