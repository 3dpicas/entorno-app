export const URL_BUSQUEDA = 'https://search.brave.com/';

// Buscar tiene que abrir algo siempre: si Brave no aparece o el comando falla,
// se cae al navegador predeterminado. Nunca lanza: el padre no ve errores.
export async function abrirBusquedaInternet({ invocar, abrirUrl, registro }) {
  try {
    const estado = await invocar('abrir_busqueda_brave');
    if (estado === 'abierto') {
      await registro.info('[busqueda] Brave abierto');
      return;
    }
    await registro.info('[busqueda] Brave no disponible; usando navegador predeterminado');
  } catch (causa) {
    await registro.error('[busqueda] error al abrir Brave', causa);
  }

  try {
    await abrirUrl(URL_BUSQUEDA);
  } catch (causa) {
    await registro.error('[busqueda] error en navegador predeterminado', causa);
  }
}
