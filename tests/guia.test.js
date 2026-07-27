import { describe, it, expect } from 'vitest';
import { parsearGuia } from '../src/lib/guia.js';

const md = `---
titulo: Enviar un correo
icono: sobre.svg
---

Texto introductorio que no es un paso.

## Paso 1: Abre Gmail
Pulsa el botón azul.

![captura](img/correo-01.png)

## Paso 2: Redactar
Pulsa **Redactar**.
`;

describe('parsearGuia', () => {
  it('extrae frontmatter', () => {
    const g = parsearGuia(md);
    expect(g.titulo).toBe('Enviar un correo');
    expect(g.icono).toBe('sobre.svg');
  });

  it('trocea por ## Paso', () => {
    const g = parsearGuia(md);
    expect(g.pasos).toHaveLength(2);
    expect(g.pasos[0].titulo).toBe('Paso 1: Abre Gmail');
    expect(g.pasos[1].titulo).toBe('Paso 2: Redactar');
  });

  it('convierte el cuerpo de cada paso a HTML', () => {
    const g = parsearGuia(md);
    expect(g.pasos[0].html).toContain('<img');
    expect(g.pasos[0].html).toContain('img/correo-01.png');
    expect(g.pasos[1].html).toContain('<strong>Redactar</strong>');
  });

  it('funciona sin frontmatter', () => {
    const g = parsearGuia('## Paso 1: Hola\nTexto.');
    expect(g.titulo).toBeUndefined();
    expect(g.pasos).toHaveLength(1);
  });

  it('lanza si no hay pasos', () => {
    expect(() => parsearGuia('# Título\nSin pasos.')).toThrow(/pasos/);
  });
});
