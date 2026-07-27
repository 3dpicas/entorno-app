export function ejecutarTarjeta(tarjeta, { abrirUrl, navegarA }) {
  if (tarjeta.tipo === 'enlace') return abrirUrl(tarjeta.url);
  if (tarjeta.tipo === 'guia') return navegarA(`#/guia/${encodeURIComponent(tarjeta.guia)}`);
}
