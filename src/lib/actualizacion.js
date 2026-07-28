/**
 * Comprueba si hay una versión nueva de la app y, si la hay, la instala y
 * relanza. Silencioso de principio a fin: cualquier fallo se queda en el log,
 * porque el padre no debe ver mensajes de error (spec §8). Las dependencias van
 * inyectadas para poder probarlo sin Tauri delante.
 */
export async function actualizarApp({ comprobar, relanzar }) {
  try {
    const actualizacion = await comprobar();
    if (!actualizacion) return;
    console.info(`actualizando la app a ${actualizacion.version}`);
    await actualizacion.downloadAndInstall();
    await relanzar();
  } catch (e) {
    console.error('comprobación de actualización falló:', e);
  }
}
