import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const publicDir = resolve(root, 'dist');
const html = await readFile(resolve(publicDir, 'index.html'), 'utf8');
const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML ids');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith('#')) assert(ids.includes(target.slice(1)), 'Missing anchor: ' + target);
  else if (!/^https?:/.test(target)) await access(resolve(publicDir, target));
}
for (const id of ['projet', 'education', 'plateforme', 'monnaie', 'retraites', 'democratie', 'calendrier']) assert(ids.includes(id));
for (const phrase of ['Si je suis élu président, c’est pour qu’il n’y en ait plus.', 'revenus internationaux', 'investis automatiquement', 'sortie de l’Union européenne', 'Aucun rendement']) assert(html.includes(phrase), 'Missing programme content: ' + phrase);
for (const phrase of ['Crédit intellectuel', 'candidature imaginaire', 'forcément bénéfiques']) assert(!html.includes(phrase));
assert.equal((html.match(/data-chapter="/g) || []).length, 5);
assert.equal((html.match(/data-go="/g) || []).length, 5);
assert(!html.includes('onwheel=') && !html.includes('ontouchmove='));
for (const file of ['styles.css', 'journey.css']) {
  const css = await readFile(resolve(publicDir, file), 'utf8');
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  for (const match of css.matchAll(/url\(['"]?([^)'"]+)/g)) await access(resolve(publicDir, match[1]));
}
for (const file of ['app.js', 'journey.js', 'world.js']) {
  const checked = spawnSync(process.execPath, ['--check', resolve(publicDir, file)], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
}
const sandbox = {};
vm.runInNewContext(await readFile(resolve(publicDir, 'world.js'), 'utf8'), sandbox);
const World = sandbox.ExpansionWorld;
let previousZ = Infinity;
for (const value of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
  for (const portrait of [true, false]) {
    const c = World.cameraState(value, portrait);
    Object.values(c).forEach(number => assert(Number.isFinite(number)));
  }
  const c = World.cameraState(value, false);
  assert(c.z < previousZ, 'Camera must travel through the scene');
  previousZ = c.z;
}
const require = createRequire(import.meta.url);
let B;
try { B = require('babylonjs'); }
catch { B = require(resolve(publicDir, 'assets/vendor/babylon.js')); }
const engine = new B.NullEngine({ renderWidth: 1200, renderHeight: 750, textureSize: 512 });
const world = World.create(B, null, { engine });
assert.equal(world.scene.metadata.chapters, 5);
assert(world.scene.meshes.length > 90);
for (const p of [0, 0.23, 0.45, 0.68, 0.9, 1]) {
  world.update(p, false);
  assert(Number.isFinite(world.camera.position.z));
}
world.update(0.5, true);
world.dispose();
assert.equal(world.scene.isDisposed, true);
engine.dispose();
console.log('Programme, links, assets, camera travel and 3D scene lifecycle checked.');
