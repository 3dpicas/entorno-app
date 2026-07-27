import { describe, it, expect, beforeEach } from 'vitest';
import { registrarRuta, iniciarRouter, limpiarRutas } from '../src/lib/router.js';

describe('router', () => {
  beforeEach(() => { limpiarRutas(); location.hash = ''; });

  it('renderiza la ruta que coincide', () => {
    const raiz = document.createElement('div');
    registrarRuta(/^#\/$/, () => Object.assign(document.createElement('p'), { textContent: 'inicio' }));
    iniciarRouter(raiz);
    expect(raiz.textContent).toBe('inicio');
  });

  it('pasa grupos capturados al handler', () => {
    const raiz = document.createElement('div');
    location.hash = '#/seccion/prensa';
    registrarRuta(/^#\/$/, () => document.createElement('p'));
    registrarRuta(/^#\/seccion\/([a-z0-9-]+)$/, (id) =>
      Object.assign(document.createElement('p'), { textContent: id }));
    iniciarRouter(raiz);
    expect(raiz.textContent).toBe('prensa');
  });

  it('hash desconocido redirige a inicio', () => {
    const raiz = document.createElement('div');
    location.hash = '#/nada';
    registrarRuta(/^#\/$/, () => Object.assign(document.createElement('p'), { textContent: 'inicio' }));
    iniciarRouter(raiz);
    expect(location.hash).toBe('#/');
  });
});
