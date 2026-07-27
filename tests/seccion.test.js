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
});
