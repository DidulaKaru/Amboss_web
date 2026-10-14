import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');
const src = join(distDir, 'index.html');
const dest = join(distDir, '404.html');

mkdirSync(distDir, { recursive: true });

if (!existsSync(src)) {
  console.error('build output missing: dist/index.html not found');
  process.exit(1);
}

copyFileSync(src, dest);
console.log('Copied index.html to 404.html for GitHub Pages SPA routing');
