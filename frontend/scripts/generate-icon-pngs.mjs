// Genera PNGs de los iconos para iOS y browsers antiguos que no soportan SVG en manifest.
// Uso: node scripts/generate-icon-pngs.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(publicDir, { recursive: true });

const svgAny = readFileSync(join(publicDir, 'tinku.svg'));
const svgMask = readFileSync(join(publicDir, 'tinku-maskable.svg'));

const targets = [
  { src: svgAny,  out: 'tinku-192.png', size: 192 },
  { src: svgAny,  out: 'tinku-512.png', size: 512 },
  { src: svgAny,  out: 'tinku-apple-touch.png', size: 180 },
  { src: svgMask, out: 'tinku-maskable-192.png', size: 192 },
  { src: svgMask, out: 'tinku-maskable-512.png', size: 512 },
];

for (const t of targets) {
  await sharp(t.src)
    .resize(t.size, t.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, t.out));
  console.log(`✅ ${t.out} (${t.size}×${t.size})`);
}
