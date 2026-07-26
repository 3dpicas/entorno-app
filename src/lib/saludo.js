export function saludo(hora) {
  if (hora >= 6 && hora < 14) return 'Buenos días, Papá';
  if (hora >= 14 && hora < 21) return 'Buenas tardes, Papá';
  return 'Buenas noches, Papá';
}
