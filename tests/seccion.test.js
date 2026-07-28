import { describe, it, expect, vi } from 'vitest';
import { renderSeccion } from '../src/ui/seccion.js';

const conGrupos = {
  id: 'prensa', titulo: 'Prensa', color: '#1565C0',
  grupos: [
    { titulo: 'Deportes', tarjetas: [{ tipo: 'enlace', titulo: 'Marca', url: 'https://www.marca.com' }] },
    { titulo: 'Bolsa', tarjetas: [{ tipo: 'enlace', titulo: 'Expansión', url: 'https://www.expansion.com' }] },
  ],
};

describe('renderSeccion', () => {
  it('pinta encabezados de grupo y tarjetas', () => {
    const el = renderSeccion(conGrupos, { alPulsarTarjeta: () => {}, navegarA: () => {} });
    const grupos = [...el.querySelectorAll('h2.titulo-grupo')].map((h) => h.textContent);
    expect(grupos).toEqual(['Deportes', 'Bolsa']);
    expect(el.querySelectorAll('button.tarjeta')).toHaveLength(2);
  });

  it('clic en tarjeta llama a alPulsarTarjeta con la tarjeta', () => {
    const alPulsarTarjeta = vi.fn();
    const el = renderSeccion(conGrupos, { alPulsarTarjeta, navegarA: () => {} });
    el.querySelector('button.tarjeta').click();
    expect(alPulsarTarjeta).toHaveBeenCalledWith(conGrupos.grupos[0].tarjetas[0]);
  });

  it('botón Inicio navega a #/', () => {
    const navegarA = vi.fn();
    const el = renderSeccion(conGrupos, { alPulsarTarjeta: () => {}, navegarA });
    el.querySelector('button.boton-inicio').click();
    expect(navegarA).toHaveBeenCalledWith('#/');
  });

  it('sección con tarjetas directas (sin grupos)', () => {
    const simple = { id: 'jugar', titulo: 'Jugar', tarjetas: [{ tipo: 'enlace', titulo: 'Solitario', url: 'https://s.com' }] };
    const el = renderSeccion(simple, { alPulsarTarjeta: () => {}, navegarA: () => {} });
    expect(el.querySelectorAll('button.tarjeta')).toHaveLength(1);
    expect(el.querySelectorAll('h2.titulo-grupo')).toHaveLength(0);
  });

  it('tarjeta con icono pinta la imagen y conserva el título', async () => {
    const conIcono = {
      id: 'p', titulo: 'P',
      tarjetas: [{ tipo: 'enlace', titulo: 'X', url: 'https://x.com', icono: 'x.png' }],
    };
    const resolverImagen = vi.fn(async () => 'asset://x.png');
    const el = renderSeccion(conIcono, { alPulsarTarjeta: () => {}, navegarA: () => {}, resolverImagen });
    await Promise.resolve();
    expect(resolverImagen).toHaveBeenCalledWith('iconos/x.png');
    expect(el.querySelector('img.icono-tarjeta')).toBeTruthy();
    expect(el.querySelector('button.tarjeta').textContent).toContain('X');
  });

  it('tarjeta sin icono no pide ninguna imagen', () => {
    const resolverImagen = vi.fn();
    renderSeccion(conGrupos, { alPulsarTarjeta: () => {}, navegarA: () => {}, resolverImagen });
    expect(resolverImagen).not.toHaveBeenCalled();
  });

  it('si el icono no carga, la imagen desaparece y la tarjeta sigue usable', async () => {
    const conIcono = {
      id: 'p', titulo: 'P',
      tarjetas: [{ tipo: 'enlace', titulo: 'X', url: 'https://x.com', icono: 'roto.png' }],
    };
    const el = renderSeccion(conIcono, {
      alPulsarTarjeta: () => {}, navegarA: () => {}, resolverImagen: async () => 'asset://roto.png',
    });
    await Promise.resolve();
    const img = el.querySelector('img.icono-tarjeta');
    img.dispatchEvent(new Event('error'));
    expect(el.querySelector('img.icono-tarjeta')).toBeNull();
    expect(el.querySelector('button.tarjeta').textContent).toContain('X');
  });

  it('tarjeta con icono pero sin resolverImagen no rompe el render', () => {
    const conIcono = {
      id: 'p', titulo: 'P',
      tarjetas: [{ tipo: 'enlace', titulo: 'X', url: 'https://x.com', icono: 'x.png' }],
    };
    expect(() => renderSeccion(conIcono, { alPulsarTarjeta: () => {}, navegarA: () => {} })).not.toThrow();
  });
});
