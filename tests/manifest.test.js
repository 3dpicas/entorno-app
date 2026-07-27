import { describe, it, expect } from 'vitest';
import { parsearManifest, TIPOS_CONOCIDOS } from '../src/lib/manifest.js';

const valido = JSON.stringify({
  version: 1,
  secciones: [
    { id: 'a', titulo: 'A', tarjetas: [{ tipo: 'enlace', titulo: 'X', url: 'https://x.com' }] },
    { id: 'b', titulo: 'B', grupos: [{ titulo: 'G', tarjetas: [{ tipo: 'guia', titulo: 'Y', guia: 'guias/y.md' }] }] },
  ],
});

describe('parsearManifest', () => {
  it('parsea manifest válido', () => {
    const m = parsearManifest(valido);
    expect(m.version).toBe(1);
    expect(m.secciones).toHaveLength(2);
  });
  it('rechaza JSON roto', () => {
    expect(() => parsearManifest('{oops')).toThrow(/JSON/);
  });
  it('rechaza manifest sin secciones', () => {
    expect(() => parsearManifest('{"version":1,"secciones":[]}')).toThrow(/secciones/);
  });
  it('rechaza sección con tarjetas y grupos a la vez', () => {
    const malo = JSON.stringify({ version: 1, secciones: [{ id: 'a', titulo: 'A', tarjetas: [], grupos: [] }] });
    expect(() => parsearManifest(malo)).toThrow(/a la vez/);
  });
  it('ignora tipos de tarjeta desconocidos', () => {
    const conFuturo = JSON.stringify({
      version: 2,
      secciones: [{ id: 'a', titulo: 'A', tarjetas: [
        { tipo: 'holograma3d', titulo: 'Futuro' },
        { tipo: 'enlace', titulo: 'X', url: 'https://x.com' },
      ] }],
    });
    const m = parsearManifest(conFuturo);
    expect(m.secciones[0].tarjetas).toHaveLength(1);
    expect(m.secciones[0].tarjetas[0].tipo).toBe('enlace');
  });
  it('expone los tipos conocidos', () => {
    expect(TIPOS_CONOCIDOS).toEqual(['enlace', 'guia']);
  });
});
