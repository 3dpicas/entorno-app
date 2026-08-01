import { saludo } from '../lib/saludo.js';

export function renderInicio(manifest, { navegarA, alBuscarInternet }) {
  const el = document.createElement('main');
  el.className = 'pantalla-inicio';

  // Buscar no es una sección del manifest: va antes que nada y siempre en el
  // mismo sitio, para que se encuentre sin leer el resto de la pantalla.
  const botonBuscar = document.createElement('button');
  botonBuscar.type = 'button';
  botonBuscar.className = 'boton-buscar-internet';

  const iconoBuscar = document.createElement('span');
  iconoBuscar.setAttribute('aria-hidden', 'true');
  iconoBuscar.textContent = '🔎';

  const textoBuscar = document.createElement('span');
  textoBuscar.textContent = 'BUSCAR EN INTERNET';

  botonBuscar.append(iconoBuscar, textoBuscar);
  botonBuscar.addEventListener('click', alBuscarInternet);

  const cabecera = document.createElement('header');
  const elSaludo = document.createElement('h1');
  elSaludo.className = 'saludo';
  elSaludo.textContent = saludo(new Date().getHours());
  const reloj = document.createElement('p');
  reloj.className = 'reloj';
  const pintarHora = () => {
    reloj.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  pintarHora();
  setInterval(pintarHora, 30_000);
  cabecera.append(elSaludo, reloj);

  const parrilla = document.createElement('div');
  parrilla.className = 'parrilla-secciones';
  for (const seccion of manifest.secciones) {
    const boton = document.createElement('button');
    boton.className = 'tarjeta-seccion';
    boton.style.setProperty('--color-seccion', seccion.color ?? '#455A64');
    boton.textContent = seccion.titulo;
    boton.addEventListener('click', () => navegarA(`#/seccion/${seccion.id}`));
    parrilla.append(boton);
  }

  el.append(botonBuscar, cabecera, parrilla);
  return el;
}
