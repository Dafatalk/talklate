// Busqueda tolerante para el listado de conversaciones: insensible a mayusculas, tildes y puntuacion,
// y con tolerancia a errores ortograficos (distancia de edicion acotada). Todo en el cliente, sobre la
// lista ya cargada; no pega al servidor.

// Minusculas, sin tildes/diacriticos, sin puntuacion y con espacios colapsados.
export function normalizar(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // marcas combinantes (tildes, dieresis, etc.)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // puntuacion y simbolos -> espacio
    .replace(/\s+/g, ' ')
    .trim();
}

// Distancia de Levenshtein con poda: si supera `max`, corta temprano y devuelve max+1.
function distancia(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = fila[0];
    fila[0] = i;
    let mejorEnFila = fila[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = fila[j];
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diag + costo);
      diag = tmp;
      if (fila[j] < mejorEnFila) mejorEnFila = fila[j];
    }
    if (mejorEnFila > max) return max + 1; // ninguna celda de la fila mejora el umbral
  }
  return fila[b.length];
}

// Cuantos typos se toleran segun el largo de la palabra buscada.
function umbral(largo: number): number {
  if (largo <= 3) return 0;
  if (largo <= 6) return 1;
  return 2;
}

// true si cada palabra de la consulta aparece en el texto: como subcadena directa o con pocos typos
// contra alguna palabra del texto. Consulta vacia => coincide con todo.
export function coincide(consulta: string, texto: string): boolean {
  const q = normalizar(consulta);
  if (!q) return true;
  const t = normalizar(texto);
  if (!t) return false;
  const palabrasTexto = t.split(' ');
  return q.split(' ').every((palabra) => {
    if (!palabra) return true;
    if (t.includes(palabra)) return true;
    const max = umbral(palabra.length);
    if (max === 0) return false;
    return palabrasTexto.some((w) => distancia(palabra, w, max) <= max);
  });
}
