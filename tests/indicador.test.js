import { describe, it, expect } from 'vitest';
import { renderIndicador } from '../src/ui/indicador.js';

describe('renderIndicador', () => {
  it('muestra versión y fecha', () => {
    const el = renderIndicador({ estado: 'sin_cambios', version: 7, fecha: '2026-07-26T10:00:00Z' });
    expect(el.textContent).toContain('v7');
    expect(el.textContent).toContain('26/07/2026');
  });

  it('sin datos no muestra nada raro', () => {
    const el = renderIndicador({ estado: 'sin_datos' });
    expect(el.textContent).toBe('');
  });
});
