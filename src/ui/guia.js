export function renderGuia(guia, { navegarA, resolverImagen }) {
  const el = document.createElement('main');
  el.className = 'pantalla-guia';
  let indice = 0;

  const cabecera = document.createElement('header');
  const botonInicio = document.createElement('button');
  botonInicio.className = 'boton-inicio';
  botonInicio.textContent = '🏠 Inicio';
  botonInicio.addEventListener('click', () => navegarA('#/'));
  const titulo = document.createElement('h1');
  titulo.textContent = guia.titulo ?? '';
  cabecera.append(botonInicio, titulo);

  const tituloPaso = document.createElement('h2');
  tituloPaso.className = 'titulo-paso';
  const cuerpo = document.createElement('article');
  cuerpo.className = 'cuerpo-paso';

  const pie = document.createElement('footer');
  pie.className = 'pie-guia';
  const botonAnterior = document.createElement('button');
  botonAnterior.className = 'boton-anterior';
  botonAnterior.textContent = '⬅ Anterior';
  const indicador = document.createElement('p');
  indicador.className = 'indicador-paso';
  const botonSiguiente = document.createElement('button');
  botonSiguiente.className = 'boton-siguiente';
  pie.append(botonAnterior, indicador, botonSiguiente);

  const pintar = () => {
    const paso = guia.pasos[indice];
    tituloPaso.textContent = paso.titulo;
    cuerpo.innerHTML = paso.html;
    for (const img of cuerpo.querySelectorAll('img')) {
      const rel = img.getAttribute('src');
      if (rel && !rel.includes('://')) {
        resolverImagen(rel).then((url) => { img.src = url; });
        img.addEventListener('error', () => img.remove(), { once: true });
      }
    }
    indicador.textContent = `Paso ${indice + 1} de ${guia.pasos.length}`;
    botonAnterior.hidden = indice === 0;
    const ultimo = indice === guia.pasos.length - 1;
    botonSiguiente.textContent = ultimo ? '✔ Terminar' : 'Siguiente ➡';
  };

  botonAnterior.addEventListener('click', () => { indice -= 1; pintar(); });
  botonSiguiente.addEventListener('click', () => {
    if (indice === guia.pasos.length - 1) { navegarA('#/'); return; }
    indice += 1;
    pintar();
  });

  pintar();
  el.append(cabecera, tituloPaso, cuerpo, pie);
  return el;
}
