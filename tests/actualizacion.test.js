import { describe, it, expect, vi } from 'vitest';
import { actualizarApp } from '../src/lib/actualizacion.js';

describe('actualizarApp', () => {
  function crearRegistroFalso() {
    return {
      info: vi.fn(async () => {}),
      error: vi.fn(async () => {}),
    };
  }

  it('sin actualización registra comprobación y ausencia', async () => {
    const relanzar = vi.fn();
    const registro = crearRegistroFalso();

    await actualizarApp({ comprobar: async () => null, relanzar, registro });

    expect(registro.info.mock.calls).toEqual([
      ['[updater] comprobación'],
      ['[updater] sin actualización'],
    ]);
    expect(registro.error).not.toHaveBeenCalled();
    expect(relanzar).not.toHaveBeenCalled();
  });

  it('con actualización registra versión, instala y relanza', async () => {
    const descargarEInstalar = vi.fn(async () => {});
    const relanzar = vi.fn(async () => {});
    const registro = crearRegistroFalso();

    await actualizarApp({
      comprobar: async () => ({ version: '0.1.3', downloadAndInstall: descargarEInstalar }),
      relanzar,
      registro,
    });

    expect(registro.info.mock.calls).toEqual([
      ['[updater] comprobación'],
      ['[updater] encontrada v0.1.3'],
      ['[updater] instalada; relanzando'],
    ]);
    expect(descargarEInstalar).toHaveBeenCalledOnce();
    expect(relanzar).toHaveBeenCalledOnce();
  });

  it('si la comprobación falla registra error y no lanza', async () => {
    const relanzar = vi.fn();
    const registro = crearRegistroFalso();
    const causa = new Error('sin red');

    await expect(actualizarApp({
      comprobar: async () => { throw causa; },
      relanzar,
      registro,
    })).resolves.toBeUndefined();

    expect(registro.error).toHaveBeenCalledWith('[updater] error', causa);
    expect(relanzar).not.toHaveBeenCalled();
  });

  it('si la instalación falla registra error y no relanza', async () => {
    const relanzar = vi.fn();
    const registro = crearRegistroFalso();
    const causa = new Error('descarga rota');

    await expect(actualizarApp({
      comprobar: async () => ({
        version: '0.1.3',
        downloadAndInstall: async () => { throw causa; },
      }),
      relanzar,
      registro,
    })).resolves.toBeUndefined();

    expect(registro.error).toHaveBeenCalledWith('[updater] error', causa);
    expect(relanzar).not.toHaveBeenCalled();
  });
});
