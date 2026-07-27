let rutas = [];

export function limpiarRutas() { rutas = []; }

export function registrarRuta(patron, handler) { rutas.push({ patron, handler }); }

export function navegarA(hash) { location.hash = hash; }

export function iniciarRouter(raiz) {
  const resolver = () => {
    const hash = location.hash || '#/';
    for (const { patron, handler } of rutas) {
      const m = hash.match(patron);
      if (m) { raiz.replaceChildren(handler(...m.slice(1))); return; }
    }
    location.hash = '#/';
  };
  window.addEventListener('hashchange', resolver);
  resolver();
}
