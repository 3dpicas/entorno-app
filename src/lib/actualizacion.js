/**
 * Comprueba si hay una versión nueva de la app y, si la hay, la instala y
 * relanza. Silencioso de principio a fin: cualquier fallo se queda en el log,
 * porque el padre no debe ver mensajes de error (spec §8). Las dependencias van
 * inyectadas para poder probarlo sin Tauri delante.
 */
export async function actualizarApp({ comprobar, relanzar, registro }) {
  await registro.info('[updater] comprobación');
  try {
    const actualizacion = await comprobar();
    if (!actualizacion) {
      await registro.info('[updater] sin actualización');
      return;
    }
    await registro.info(`[updater] encontrada v${actualizacion.version}`);
    await actualizacion.downloadAndInstall();
    await registro.info('[updater] instalada; relanzando');
    await relanzar();
  } catch (e) {
    await registro.error('[updater] error', e);
  }
}
