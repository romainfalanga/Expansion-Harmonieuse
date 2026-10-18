import { copyFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const destination = resolve(root, 'dist/assets/vendor');
await mkdir(destination, { recursive: true });
const source = resolve(root, 'node_modules/babylonjs/babylon.js');
const target = resolve(destination, 'babylon.js');
try {
  await access(source);
  await copyFile(source, target);
} catch {
  // A locally prepared vendor bundle is also accepted for the private preview.
  await access(target);
}
console.log('Static site prepared with Babylon.js 9.31.0.');
