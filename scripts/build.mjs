import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const file of ['index.html', 'styles.css', 'journey.css', 'journey.js', 'scene-timeline.js', 'assets/illustrations/vision.webp', 'assets/illustrations/collectif.webp', 'assets/illustrations/pensees.webp', 'assets/illustrations/echanges.webp']) await access(resolve(root, 'dist', file));
console.log('Static site prepared with four locally hosted narrative illustrations.');
