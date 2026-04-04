// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
// Requires: npm install -g sharp (or locally)
// Alternative: use https://realfavicongenerator.net/ with public/icon.svg

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

// Minimal 1x1 transparent PNG (placeholder)
// Replace these with real icons generated from public/icon.svg
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

writeFileSync(join(iconsDir, 'icon-192.png'), minimalPng);
writeFileSync(join(iconsDir, 'icon-512.png'), minimalPng);

console.log('✅ Placeholder icons created in public/icons/');
console.log('⚠️  Replace with real icons from public/icon.svg using:');
console.log('   https://realfavicongenerator.net/');
console.log('   or: npx @vite-pwa/assets-generator --preset minimal public/icon.svg');
