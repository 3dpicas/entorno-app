import { describe, it, expect } from 'vitest';
import { saludo } from '../src/lib/saludo.js';

describe('saludo', () => {
  it('mañana', () => expect(saludo(9)).toBe('Buenos días, Papá'));
  it('límite mañana', () => expect(saludo(6)).toBe('Buenos días, Papá'));
  it('tarde', () => expect(saludo(14)).toBe('Buenas tardes, Papá'));
  it('noche', () => expect(saludo(21)).toBe('Buenas noches, Papá'));
  it('madrugada', () => expect(saludo(3)).toBe('Buenas noches, Papá'));
});
