export function renderAdmin({ versionApp, estado, lineasLog, alForzarSync, alCerrar }) {
  const el = document.createElement('div');
  el.className = 'panel-admin';

  const fecha = estado?.fecha ? new Date(estado.fecha).toLocaleString('es-ES') : '—';
  const info = document.createElement('pre');
  info.textContent = [
    `App:        v${versionApp}`,
    `Contenido:  v${estado?.version ?? '—'} (${estado?.sha?.slice(0, 7) ?? '—'})`,
    `Último sync: ${fecha}`,
    `Estado:     ${estado?.estado ?? '—'}`,
  ].join('\n');

  const log = document.createElement('pre');
  log.className = 'log-admin';
  log.textContent = (lineasLog ?? []).join('\n');

  const forzar = document.createElement('button');
  forzar.className = 'boton-forzar-sync';
  forzar.textContent = 'Forzar sincronización';
  forzar.addEventListener('click', alForzarSync);

  const cerrar = document.createElement('button');
  cerrar.className = 'boton-cerrar-admin';
  cerrar.textContent = 'Cerrar';
  cerrar.addEventListener('click', alCerrar);

  el.append(info, log, forzar, cerrar);
  return el;
}
