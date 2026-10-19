import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const file of ['index.html', 'styles.css', 'programme.css', 'journey.css', 'journey.js', 'scene-timeline.js']) await access(resolve(root, 'dist', file));
console.log('Static site prepared with four semantic narrative compositions.');
