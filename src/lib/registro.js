import { info as infoTauri, error as errorTauri } from '@tauri-apps/plugin-log';

function textoError(causa) {
  if (causa instanceof Error) return causa.message || causa.name;
  if (typeof causa === 'string') return causa;
  try {
    return String(causa);
  } catch {
    return 'error desconocido';
  }
}

async function escribirSeguro(escritor, mensaje) {
  try {
    await escritor(mensaje);
  } catch {
    // El log es diagnóstico: nunca puede romper la función diagnosticada.
  }
}

export function crearRegistro({
  info: escribirInfo = infoTauri,
  error: escribirError = errorTauri,
} = {}) {
  return {
    info(mensaje) {
      return escribirSeguro(escribirInfo, mensaje);
    },
    error(contexto, causa) {
      return escribirSeguro(escribirError, `${contexto} · ${textoError(causa)}`);
    },
  };
}
