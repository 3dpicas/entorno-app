import { describe, it, expect, vi } from 'vitest';
import { crearRegistro } from '../src/lib/registro.js';

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
});
