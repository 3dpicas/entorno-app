import { describe, it, expect, vi } from 'vitest';
import { ejecutarTarjeta } from '../src/lib/acciones.js';

describe('ejecutarTarjeta', () => {
  it('enlace abre la URL', () => {
    const abrirUrl = vi.fn();
    ejecutarTarjeta({ tipo: 'enlace', titulo: 'X', url: 'https://x.com' }, { abrirUrl, navegarA: () => {} });
    expect(abrirUrl).toHaveBeenCalledWith('https://x.com');
  });

  it('guia navega al visor con la ruta codificada', () => {
    const navegarA = vi.fn();
    ejecutarTarjeta({ tipo: 'guia', titulo: 'Y', guia: 'guias/mi guía.md' }, { abrirUrl: () => {}, navegarA });
    expect(navegarA).toHaveBeenCalledWith(`#/guia/${encodeURIComponent('guias/mi guía.md')}`);
  });

  it('tipo desconocido no hace nada ni lanza', () => {
    expect(() =>
      ejecutarTarjeta({ tipo: 'holograma3d', titulo: 'Z' }, { abrirUrl: () => {}, navegarA: () => {} })
    ).not.toThrow();
  });
});
