import './styles/tokens.css';
import './styles/base.css';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { registrarRuta, iniciarRouter, navegarA } from './lib/router.js';
import { ejecutarTarjeta } from './lib/acciones.js';
import { cargarManifest, leerTexto, urlRecurso } from './lib/contenido.js';
import { parsearGuia } from './lib/guia.js';
import { renderInicio } from './ui/inicio.js';
import { renderSeccion } from './ui/seccion.js';
import { renderGuia } from './ui/guia.js';
import { renderIndicador } from './ui/indicador.js';
import { getVersion } from '@tauri-apps/api/app';
import { renderAdmin } from './ui/admin.js';

const SEIS_HORAS = 6 * 60 * 60 * 1000;

let manifest;

const alPulsarTarjeta = (tarjeta) => ejecutarTarjeta(tarjeta, { abrirUrl: openUrl, navegarA });

async function arrancar() {
  manifest = await cargarManifest();
  const raiz = document.querySelector('#app');

  registrarRuta(/^#\/$/, () => renderInicio(manifest, { navegarA }));
  registrarRuta(/^#\/seccion\/([a-z0-9-]+)$/, (id) => {
    const seccion = manifest.secciones.find((s) => s.id === id);
    if (!seccion) { navegarA('#/'); return document.createElement('div'); }
    return renderSeccion(seccion, { alPulsarTarjeta, navegarA });
  });
  registrarRuta(/^#\/guia\/(.+)$/, (rutaCodificada) => {
    const contenedor = document.createElement('div');
    const rel = decodeURIComponent(rutaCodificada);
    leerTexto(rel)
      .then((md) => {
        const guia = parsearGuia(md);
        contenedor.replaceChildren(renderGuia(guia, { navegarA, resolverImagen: urlRecurso }));
      })
      .catch((e) => {
        console.error(`No se pudo abrir la guía ${rel}:`, e);
        navegarA('#/');
      });
    return contenedor;
  });

  iniciarRouter(raiz);

  document.body.append(renderIndicador(await invoke('estado_sync').catch(() => ({}))));
  sincronizar();
  setInterval(sincronizar, SEIS_HORAS);
}

async function sincronizar() {
  try {
    const resultado = await invoke('sync_now');
    if (resultado.estado === 'actualizado') {
      manifest = await cargarManifest();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
    const previo = document.querySelector('.indicador-contenido');
    const estado = resultado.version ? resultado : await invoke('estado_sync');
    previo?.replaceWith(renderIndicador(estado));
  } catch (e) {
    console.error('sync falló:', e);
  }
}

// Pantalla de administración oculta: Ctrl+Shift+A la abre y la cierra. No hay
// ningún botón que lleve a ella; el padre no debe encontrarla por accidente.
window.addEventListener('keydown', async (ev) => {
  if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyA') {
    const existente = document.querySelector('.panel-admin');
    if (existente) { existente.remove(); return; }
    const [versionApp, estado, lineasLog] = await Promise.all([
      getVersion(),
      invoke('estado_sync').catch(() => null),
      invoke('leer_log_reciente').catch(() => []),
    ]);
    const panel = renderAdmin({
      versionApp, estado, lineasLog,
      alForzarSync: async () => { await invoke('sync_now'); panel.remove(); },
      alCerrar: () => panel.remove(),
    });
    document.body.append(panel);
  }
});

arrancar();
