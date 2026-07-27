export function renderSeccion(seccion, { alPulsarTarjeta, navegarA }) {
  const el = document.createElement('main');
  el.className = 'pantalla-seccion';
  el.style.setProperty('--color-seccion', seccion.color ?? '#455A64');

  const cabecera = document.createElement('header');
  const botonInicio = document.createElement('button');
  botonInicio.className = 'boton-inicio';
  botonInicio.textContent = '🏠 Inicio';
  botonInicio.addEventListener('click', () => navegarA('#/'));
  const titulo = document.createElement('h1');
  titulo.textContent = seccion.titulo;
  cabecera.append(botonInicio, titulo);
  el.append(cabecera);

  const pintarTarjetas = (tarjetas, contenedor) => {
    for (const tarjeta of tarjetas) {
      const boton = document.createElement('button');
      boton.className = 'tarjeta';
      boton.textContent = tarjeta.titulo;
      boton.addEventListener('click', () => alPulsarTarjeta(tarjeta));
      contenedor.append(boton);
    }
  };

  if (seccion.grupos) {
    for (const grupo of seccion.grupos) {
      const tituloGrupo = document.createElement('h2');
      tituloGrupo.className = 'titulo-grupo';
      tituloGrupo.textContent = grupo.titulo;
      const parrilla = document.createElement('div');
      parrilla.className = 'parrilla-tarjetas';
      pintarTarjetas(grupo.tarjetas, parrilla);
      el.append(tituloGrupo, parrilla);
    }
  } else {
    const parrilla = document.createElement('div');
    parrilla.className = 'parrilla-tarjetas';
    pintarTarjetas(seccion.tarjetas ?? [], parrilla);
    el.append(parrilla);
  }
  return el;
}
