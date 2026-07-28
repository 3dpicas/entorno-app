import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
await sharp(join(raiz, 'recursos/icono.svg'))
  .resize(1024, 1024)
  .png()
  .toFile(join(raiz, 'recursos/icono.png'));
console.log('icono.png generado');
