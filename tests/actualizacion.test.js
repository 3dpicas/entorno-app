import { describe, it, expect, vi } from 'vitest';
import { actualizarApp } from '../src/lib/actualizacion.js';

describe('actualizarApp', () => {
  it('sin actualización disponible no instala ni relanza', async () => {
    const relanzar = vi.fn();
    await actualizarApp({ comprobar: async () => null, relanzar });
    expect(relanzar).not.toHaveBeenCalled();
  });

  it('con actualización disponible la instala y relanza', async () => {
    const descargarEInstalar = vi.fn(async () => {});
    const relanzar = vi.fn(async () => {});
    await actualizarApp({
      comprobar: async () => ({ version: '0.1.1', downloadAndInstall: descargarEInstalar }),
      relanzar,
    });
    expect(descargarEInstalar).toHaveBeenCalled();
    expect(relanzar).toHaveBeenCalled();
  });

  it('si la comprobación falla no lanza: el padre nunca ve el error', async () => {
    const relanzar = vi.fn();
    await expect(
      actualizarApp({ comprobar: async () => { throw new Error('sin red'); }, relanzar })
    ).resolves.toBeUndefined();
    expect(relanzar).not.toHaveBeenCalled();
  });

  it('si la instalación falla tampoco lanza ni relanza', async () => {
    const relanzar = vi.fn();
    await expect(
      actualizarApp({
        comprobar: async () => ({
          version: '0.1.1',
          downloadAndInstall: async () => { throw new Error('descarga rota'); },
        }),
        relanzar,
      })
    ).resolves.toBeUndefined();
    expect(relanzar).not.toHaveBeenCalled();
  });
});
