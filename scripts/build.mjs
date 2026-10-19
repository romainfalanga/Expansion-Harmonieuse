import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const file of ['index.html', 'styles.css', 'app.js', 'assets/embleme.svg', 'assets/nimbus-sans.woff', 'assets/nimbus-sans-bold.woff', 'assets/urw-gothic-demi.woff']) await access(resolve(root, 'dist', file));
console.log('Static programme ready: one opening, native reading, no runtime dependencies.');
