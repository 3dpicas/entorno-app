import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { parsearManifest } from './manifest.js';

export async function cargarManifest() {
  const texto = await invoke('contenido_leer', { rel: 'manifest.json' });
  return parsearManifest(texto);
}

export async function leerTexto(rel) {
  return invoke('contenido_leer', { rel });
}

export async function urlRecurso(rel) {
  const abs = await invoke('contenido_ruta', { rel });
  return convertFileSrc(abs);
}
