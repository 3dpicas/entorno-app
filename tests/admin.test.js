import { describe, it, expect, vi } from 'vitest';
import { renderAdmin } from '../src/ui/admin.js';

const datos = {
  versionApp: '0.1.0',
  estado: { estado: 'sin_cambios', version: 7, sha: 'abc123', fecha: '2026-07-26T10:00:00Z' },
  lineasLog: ['linea 1', 'linea 2'],
  alForzarSync: vi.fn(),
  alCerrar: vi.fn(),
};

describe('renderAdmin', () => {
  it('muestra versiones, sha y log', () => {
    const el = renderAdmin(datos);
    expect(el.textContent).toContain('0.1.0');
    expect(el.textContent).toContain('v7');
    expect(el.textContent).toContain('abc123');
    expect(el.textContent).toContain('linea 2');
  });

  it('botón de forzar sync llama al callback', () => {
    const el = renderAdmin(datos);
    el.querySelector('.boton-forzar-sync').click();
    expect(datos.alForzarSync).toHaveBeenCalled();
  });

  it('botón cerrar llama al callback', () => {
    const el = renderAdmin(datos);
    el.querySelector('.boton-cerrar-admin').click();
    expect(datos.alCerrar).toHaveBeenCalled();
  });
});
