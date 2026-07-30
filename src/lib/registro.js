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

export async function registrarResultadoSync(registro, resultado) {
  if (resultado?.estado === 'error') {
    await registro.error('[sync] error', resultado.detalle ?? 'error desconocido');
    return;
  }
  if (resultado?.estado === 'actualizado') {
    const version = resultado.version ?? 'desconocida';
    const sha = typeof resultado.sha === 'string' && resultado.sha
      ? resultado.sha.slice(0, 7)
      : 'desconocido';
    await registro.info(`[sync] actualizado · versión ${version} · SHA ${sha}`);
    return;
  }
  if (resultado?.estado === 'dev') {
    await registro.info('[sync] omitido en desarrollo');
    return;
  }
  await registro.info('[sync] sin cambios');
}
