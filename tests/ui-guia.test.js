import { describe, it, expect, vi } from 'vitest';
import { renderGuia } from '../src/ui/guia.js';

const guia = {
  titulo: 'Enviar un correo',
  pasos: [
    { titulo: 'Paso 1: Abre Gmail', html: '<p>Pulsa el botón azul.</p>' },
    { titulo: 'Paso 2: Redactar', html: '<p>Pulsa Redactar.</p>' },
    { titulo: 'Paso 3: Enviar', html: '<p>Pulsa Enviar.</p>' },
  ],
};

const deps = () => ({ navegarA: vi.fn(), resolverImagen: vi.fn(async (rel) => `asset://${rel}`) });

describe('renderGuia', () => {
  it('muestra el primer paso y el indicador', () => {
    const el = renderGuia(guia, deps());
    expect(el.querySelector('.titulo-paso').textContent).toBe('Paso 1: Abre Gmail');
    expect(el.querySelector('.indicador-paso').textContent).toBe('Paso 1 de 3');
  });

  it('Siguiente avanza y Anterior retrocede', () => {
    const el = renderGuia(guia, deps());
    el.querySelector('.boton-siguiente').click();
    expect(el.querySelector('.indicador-paso').textContent).toBe('Paso 2 de 3');
    el.querySelector('.boton-anterior').click();
    expect(el.querySelector('.indicador-paso').textContent).toBe('Paso 1 de 3');
  });

  it('Anterior oculto en el primer paso; en el último, Siguiente dice Terminar y va a inicio', () => {
    const d = deps();
    const el = renderGuia(guia, d);
    expect(el.querySelector('.boton-anterior').hidden).toBe(true);
    el.querySelector('.boton-siguiente').click();
    el.querySelector('.boton-siguiente').click();
    const siguiente = el.querySelector('.boton-siguiente');
    expect(siguiente.textContent).toContain('Terminar');
    siguiente.click();
    expect(d.navegarA).toHaveBeenCalledWith('#/');
  });

  it('botón Inicio siempre visible', () => {
    const d = deps();
    const el = renderGuia(guia, d);
    el.querySelector('.boton-inicio').click();
    expect(d.navegarA).toHaveBeenCalledWith('#/');
  });

  it('resuelve los src de las imágenes', async () => {
    const conImagen = {
      titulo: 'G', pasos: [{ titulo: 'Paso 1: X', html: '<img src="img/a.png">' }],
    };
    const d = deps();
    const el = renderGuia(conImagen, d);
    await Promise.resolve();
    expect(d.resolverImagen).toHaveBeenCalledWith('img/a.png');
  });
});
