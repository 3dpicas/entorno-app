import { describe, it, expect, vi } from 'vitest';
import { abrirBusquedaInternet, URL_BUSQUEDA } from '../src/lib/busqueda.js';

function crearRegistroFalso() {
  return {
    info: vi.fn(async () => {}),
    error: vi.fn(async () => {}),
  };
}

describe('abrirBusquedaInternet', () => {
  it('si Rust abre Brave no usa respaldo', async () => {
    const invocar = vi.fn(async () => 'abierto');
    const abrirUrl = vi.fn(async () => {});
    const registro = crearRegistroFalso();

    await abrirBusquedaInternet({ invocar, abrirUrl, registro });

    expect(invocar).toHaveBeenCalledWith('abrir_busqueda_brave');
    expect(abrirUrl).not.toHaveBeenCalled();
    expect(registro.info).toHaveBeenCalledWith('[busqueda] Brave abierto');
  });

  it('si Brave no está disponible abre URL fija con navegador predeterminado', async () => {
    const abrirUrl = vi.fn(async () => {});
    const registro = crearRegistroFalso();

    await abrirBusquedaInternet({
      invocar: async () => 'no_disponible',
      abrirUrl,
      registro,
    });

    expect(abrirUrl).toHaveBeenCalledWith(URL_BUSQUEDA);
    expect(registro.info).toHaveBeenCalledWith(
      '[busqueda] Brave no disponible; usando navegador predeterminado'
    );
  });

  it('si invoke falla registra error y usa respaldo', async () => {
    const causa = new Error('comando ausente');
    const abrirUrl = vi.fn(async () => {});
    const registro = crearRegistroFalso();

    await abrirBusquedaInternet({
      invocar: async () => { throw causa; },
      abrirUrl,
      registro,
    });

    expect(registro.error).toHaveBeenCalledWith('[busqueda] error al abrir Brave', causa);
    expect(abrirUrl).toHaveBeenCalledWith(URL_BUSQUEDA);
  });

  it('si respaldo falla registra error y nunca rechaza', async () => {
    const causa = new Error('sin navegador');
    const registro = crearRegistroFalso();

    await expect(abrirBusquedaInternet({
      invocar: async () => 'no_disponible',
      abrirUrl: async () => { throw causa; },
      registro,
    })).resolves.toBeUndefined();

    expect(registro.error).toHaveBeenCalledWith(
      '[busqueda] error en navegador predeterminado',
      causa
    );
  });
});
