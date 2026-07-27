import { saludo } from '../lib/saludo.js';

export function renderInicio(manifest, { navegarA }) {
  const el = document.createElement('main');
  el.className = 'pantalla-inicio';

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

  el.append(cabecera, parrilla);
  return el;
}
