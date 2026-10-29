import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const base = new URL(process.argv[2] || 'http://127.0.0.1:5173/');

function collect(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : [file];
  });
}

const entry = await fetch(base, {signal: AbortSignal.timeout(10000)});
assert.equal(entry.status, 200, 'Entry page must be available');
assert.match(entry.headers.get('content-type'), /text\/html/);
assert.equal(await entry.text(), fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), 'Server must serve the current built entry');

const files = collect(dist);
await Promise.all(files.map(async file => {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const response = await fetch(new URL(relative, base), {signal: AbortSignal.timeout(10000)});
  assert.equal(response.status, 200, `${relative} should return 200`);
  assert.ok(Buffer.from(await response.arrayBuffer()).equals(fs.readFileSync(file)), `Served bytes differ: ${relative}`);
  if (relative.endsWith('.js')) assert.match(response.headers.get('content-type'), /javascript/, relative);
  if (relative.endsWith('.css')) assert.match(response.headers.get('content-type'), /text\/css/, relative);
  if (relative.endsWith('.glb')) assert.match(response.headers.get('content-type'), /gltf/, relative);
  if (relative.endsWith('.woff2')) assert.match(response.headers.get('content-type'), /font\/woff2/, relative);
}));

const missing = await fetch(new URL('missing-briefing-file.txt', base), {signal: AbortSignal.timeout(10000)});
assert.equal(missing.status, 404, 'Missing file should return 404');
console.log(`HTTP smoke passed: entry, ${files.length} exact assets, MIME types, and missing-file handling.`);
