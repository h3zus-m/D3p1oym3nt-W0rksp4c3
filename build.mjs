import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const staging = path.join(root, '.runtime', 'briefing-dist-staging');
export const runtimeFiles = [
  'index.html', 'favicon.svg', 'styles.css', 'briefing-app.js', 'briefing-3d.js',
  'briefing-director.js', 'briefing-chatbot.js', 'briefing-actions.js', 'tour-timing.js', 'operations.js', 'assembly-controls.js',
  'vendor/three.module.min.js', 'vendor/GLTFLoader.js',
  'vendor/BufferGeometryUtils.js', 'vendor/THREE-LICENSE.txt',
  'media/pm820-microinverter.glb', 'fonts/InterVariable.woff2', 'fonts/OFL.txt'
];

const textExtensions = new Set(['.html', '.css', '.js', '.json', '.txt', '.svg']);
const prohibitedPunctuation = String.fromCodePoint(0x2014);
const filler = /\b(?:delve|testament)\b|orchestrating a symphony|standing at the nexus/i;

function assertContained(target, parent) {
  const relative = path.relative(parent, path.resolve(target));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe build target: ${target}`);
  }
}

assertContained(dist, root);
assertContained(staging, root);

// Validate every input before changing the existing deployment directory.
for (const relative of runtimeFiles) {
  const source = path.join(root, relative);
  if (!fs.statSync(source).isFile()) throw new Error(`Missing runtime file: ${relative}`);
  if (textExtensions.has(path.extname(source))) {
    const text = fs.readFileSync(source, 'utf8');
    if (text.includes(prohibitedPunctuation)) throw new Error(`Prohibited punctuation in ${relative}`);
    if (!relative.startsWith('vendor/') && filler.test(text)) throw new Error(`Filler phrase in ${relative}`);
  }
}

fs.rmSync(staging, {recursive: true, force: true});
fs.mkdirSync(staging, {recursive: true});
for (const relative of runtimeFiles) {
  const target = path.join(staging, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, relative), target);
}
fs.rmSync(dist, {recursive: true, force: true});
fs.renameSync(staging, dist);
console.log(`Built ${runtimeFiles.length} static files in dist. Verified text and asset inputs.`);
