import { info as infoTauri, error as errorTauri } from '@tauri-apps/plugin-log';

const LONGITUD_MAXIMA = 500;
const INICIO_RUTA_LOCAL = /(?:file:\/\/\/[a-z]:\/|\b[a-z]:[\\/]|\\\\[^\\/\s]+[\\/])/i;

function normalizarMensaje(valor) {
  try {
    let texto = String(valor)
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const ruta = INICIO_RUTA_LOCAL.exec(texto);
    if (ruta?.index != null) {
      const prefijo = texto.slice(0, ruta.index).trimEnd();
      texto = `${prefijo}${prefijo ? ' ' : ''}[ruta local]`;
    }
    if (texto.length > LONGITUD_MAXIMA) {
      texto = `${texto.slice(0, LONGITUD_MAXIMA - 3)}...`;
    }
    return texto;
  } catch {
    return 'error desconocido';
  }
}

function textoError(causa) {
  try {
    if (causa instanceof Error) return causa.message || causa.name || 'error desconocido';
    if (typeof causa === 'string') return causa;
    return String(causa);
  } catch {
    return 'error desconocido';
  }
}

async function escribirSeguro(escritor, crearMensaje) {
  try {
    await escritor(normalizarMensaje(crearMensaje()));
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
      return escribirSeguro(escribirInfo, () => mensaje);
    },
    error(contexto, causa) {
      return escribirSeguro(escribirError, () => `${contexto} · ${textoError(causa)}`);
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
