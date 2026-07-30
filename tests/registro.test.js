import { describe, it, expect, vi } from 'vitest';
import { crearRegistro, registrarResultadoSync } from '../src/lib/registro.js';

describe('crearRegistro', () => {
  it('envía mensajes informativos al nivel info', async () => {
    const info = vi.fn(async () => {});
    const registro = crearRegistro({ info, error: vi.fn() });

    await registro.info('[sync] inicio');

    expect(info).toHaveBeenCalledWith('[sync] inicio');
  });

  it('convierte Error en texto y añade contexto', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });

    await registro.error('[sync] error', new Error('sin red'));

    expect(error).toHaveBeenCalledWith('[sync] error · sin red');
  });

  it('conserva causas que ya son cadenas', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });

    await registro.error('[updater] error', 'firma inválida');

    expect(error).toHaveBeenCalledWith('[updater] error · firma inválida');
  });

  it('convierte otros valores de forma segura', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });

    await registro.error('[sync] error', 503);

    expect(error).toHaveBeenCalledWith('[sync] error · 503');
  });

  it('usa texto neutro si la causa no puede convertirse', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });
    const imposible = { toString() { throw new Error('no convertir'); } };

    await registro.error('[sync] error', imposible);

    expect(error).toHaveBeenCalledWith('[sync] error · error desconocido');
  });

  it('absorbe rechazos del propio plugin', async () => {
    const falloPlugin = async () => { throw new Error('plugin roto'); };
    const registro = crearRegistro({ info: falloPlugin, error: falloPlugin });

    await expect(registro.info('mensaje')).resolves.toBeUndefined();
    await expect(registro.error('contexto', new Error('causa'))).resolves.toBeUndefined();
  });

  it('absorbe causas cuyo getter de mensaje lanza', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });
    const causa = new Error('oculto');
    Object.defineProperty(causa, 'message', {
      get() { throw new Error('getter roto'); },
    });

    await expect(registro.error('[sync] error', causa)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith('[sync] error · error desconocido');
  });

  it('mantiene cada entrada en una sola línea sin caracteres de control', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });

    await registro.error('[sync] error', 'fallo\r\n[INFO] falso\u0000');

    expect(error).toHaveBeenCalledWith('[sync] error · fallo [INFO] falso');
  });

  it('oculta rutas locales Windows y UNC', async () => {
    const error = vi.fn(async () => {});
    const registro = crearRegistro({ info: vi.fn(), error });

    await registro.error('[updater] error', 'fallo en C:\\Users\\papa\\secreto.txt');
    await registro.error('[updater] error', 'fallo en \\\\servidor\\privado\\dato.txt');

    expect(error.mock.calls).toEqual([
      ['[updater] error · fallo en [ruta local]'],
      ['[updater] error · fallo en [ruta local]'],
    ]);
  });
});

describe('registrarResultadoSync', () => {
  function crearRegistroFalso() {
    return {
      info: vi.fn(async () => {}),
      error: vi.fn(async () => {}),
    };
  }

  it('registra que no hay cambios', async () => {
    const registro = crearRegistroFalso();

    await registrarResultadoSync(registro, { estado: 'sin_cambios' });

    expect(registro.info).toHaveBeenCalledWith('[sync] sin cambios');
  });

  it('registra versión y primeros siete caracteres del SHA', async () => {
    const registro = crearRegistroFalso();

    await registrarResultadoSync(registro, {
      estado: 'actualizado',
      version: 6,
      sha: '0872dc06d5b78dde',
    });

    expect(registro.info).toHaveBeenCalledWith(
      '[sync] actualizado · versión 6 · SHA 0872dc0'
    );
  });

  it('registra estado de error devuelto por Rust', async () => {
    const registro = crearRegistroFalso();

    await registrarResultadoSync(registro, {
      estado: 'error',
      detalle: 'GitHub no responde',
    });

    expect(registro.error).toHaveBeenCalledWith('[sync] error', 'GitHub no responde');
  });

  it('distingue sync desactivado en desarrollo', async () => {
    const registro = crearRegistroFalso();

    await registrarResultadoSync(registro, { estado: 'dev' });

    expect(registro.info).toHaveBeenCalledWith('[sync] omitido en desarrollo');
  });
});
