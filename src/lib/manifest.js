export const TIPOS_CONOCIDOS = ['enlace', 'guia'];

export function parsearManifest(textoJson) {
  let datos;
  try {
    datos = JSON.parse(textoJson);
  } catch (e) {
    throw new Error(`manifest.json no es JSON válido: ${e.message}`);
  }
  if (!Number.isInteger(datos.version)) throw new Error('manifest: falta "version" entera');
  if (!Array.isArray(datos.secciones) || datos.secciones.length === 0)
    throw new Error('manifest: "secciones" vacío o ausente');

  const secciones = datos.secciones.map((s) => {
    if (!s.id || !s.titulo) throw new Error('manifest: sección sin id o titulo');
    if (s.tarjetas && s.grupos) throw new Error(`sección ${s.id}: tarjetas y grupos a la vez`);
    return {
      ...s,
      tarjetas: s.tarjetas ? filtrarTarjetas(s.tarjetas) : undefined,
      grupos: s.grupos
        ? s.grupos.map((g) => ({ ...g, tarjetas: filtrarTarjetas(g.tarjetas) }))
        : undefined,
    };
  });
  return { version: datos.version, secciones };
}

function filtrarTarjetas(tarjetas = []) {
  return tarjetas.filter((t) => TIPOS_CONOCIDOS.includes(t.tipo));
}
