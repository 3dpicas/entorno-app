import { cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, '..', 'entorno-contenido');
const destino = join(raiz, 'recursos', 'contenido-semilla');

if (!existsSync(origen)) {
  console.error(`No existe ${origen}`);
  process.exit(1);
}
rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, {
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.includes(`${origen}\\.git`) && !src.includes(`${origen}/.git`),
});
console.log('Semilla actualizada desde entorno-contenido');
