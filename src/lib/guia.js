import { marked } from 'marked';

export function parsearGuia(md) {
  const { meta, cuerpo } = separarFrontmatter(md);
  const pasos = cuerpo
    .split(/^##\s+/m)
    .filter((b) => /^paso/i.test(b.trim()))
    .map((bloque) => {
      const [primera, ...resto] = bloque.split('\n');
      return { titulo: primera.trim(), html: marked.parse(resto.join('\n')) };
    });
  if (pasos.length === 0) throw new Error('La guía no tiene pasos (## Paso ...)');
  return { titulo: meta.titulo, icono: meta.icono, pasos };
}

function separarFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, cuerpo: md };
  const meta = {};
  for (const linea of m[1].split('\n')) {
    const i = linea.indexOf(':');
    if (i > 0) meta[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return { meta, cuerpo: md.slice(m[0].length) };
}
