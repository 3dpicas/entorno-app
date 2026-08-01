import { describe, it, expect, vi } from 'vitest';
import { renderInicio } from '../src/ui/inicio.js';

const manifest = {
  version: 1,
  secciones: [
    { id: 'aprender', titulo: 'Aprender', color: '#2E7D32', tarjetas: [] },
    { id: 'prensa', titulo: 'Prensa', color: '#1565C0', grupos: [] },
  ],
};

function opciones(cambios = {}) {
  return {
    navegarA: vi.fn(),
    alBuscarInternet: vi.fn(),
    ...cambios,
  };
}

describe('renderInicio', () => {
  it('pinta una tarjeta por sección con su título', () => {
    const el = renderInicio(manifest, opciones());
    const botones = el.querySelectorAll('button.tarjeta-seccion');
    expect(botones).toHaveLength(2);
    expect(botones[0].textContent).toContain('Aprender');
  });

  it('clic en sección navega a su ruta', () => {
    const navegarA = vi.fn();
    const el = renderInicio(manifest, opciones({ navegarA }));
    el.querySelectorAll('button.tarjeta-seccion')[1].click();
    expect(navegarA).toHaveBeenCalledWith('#/seccion/prensa');
  });

  it('incluye saludo y reloj', () => {
    const el = renderInicio(manifest, opciones());
    expect(el.querySelector('.saludo').textContent).toMatch(/Buen[oa]s/);
    expect(el.querySelector('.reloj')).toBeTruthy();
  });

  it('buscar aparece primero y ejecuta su callback con un clic', () => {
    const alBuscarInternet = vi.fn();
    const el = renderInicio(manifest, opciones({ alBuscarInternet }));
    const boton = el.querySelector('button.boton-buscar-internet');

    expect(boton).toBeTruthy();
    expect(boton.textContent).toContain('BUSCAR EN INTERNET');
    expect(el.firstElementChild).toBe(boton);

    boton.click();
    expect(alBuscarInternet).toHaveBeenCalledOnce();
  });
});
