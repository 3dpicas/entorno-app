import './styles/tokens.css';
import './styles/base.css';
import { openUrl } from '@tauri-apps/plugin-opener';
import { registrarRuta, iniciarRouter, navegarA } from './lib/router.js';
import { ejecutarTarjeta } from './lib/acciones.js';
import { cargarManifest, leerTexto, urlRecurso } from './lib/contenido.js';
import { parsearGuia } from './lib/guia.js';
import { renderInicio } from './ui/inicio.js';
import { renderSeccion } from './ui/seccion.js';
import { renderGuia } from './ui/guia.js';

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
}

arrancar();
