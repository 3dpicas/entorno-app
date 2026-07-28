import { cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, '..', 'entorno-contenido');
const destino = join(raiz, 'recursos', 'contenido-semilla');

// En CI el repo de contenido no está como carpeta hermana: ahí vale la semilla
// que ya viene commiteada. Sin repo y sin semilla sí es un error de verdad.
if (!existsSync(origen)) {
  if (existsSync(join(destino, 'manifest.json'))) {
    console.log(`No existe ${origen}; se conserva la semilla ya commiteada`);
    process.exit(0);
  }
  console.error(`No existe ${origen} y no hay semilla previa en ${destino}`);
  process.exit(1);
}
rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, {
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.includes(`${origen}\\.git`) && !src.includes(`${origen}/.git`),
});
console.log('Semilla actualizada desde entorno-contenido');
