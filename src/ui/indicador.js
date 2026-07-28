export function renderIndicador(estado) {
  const el = document.createElement('footer');
  el.className = 'indicador-contenido';
  if (estado?.version && estado?.fecha) {
    // Con opciones explícitas: sin ellas sale «26/7/2026» en vez de «26/07/2026».
    const fecha = new Date(estado.fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    el.textContent = `Contenido v${estado.version} · ${fecha}`;
  }
  return el;
}
