import { useEffect, useState } from 'react';

// Devuelve el valor "retrasado": solo cambia cuando pasaron `delay` ms sin nuevas actualizaciones.
// Sirve para no filtrar/pedir en cada tecla (p. ej. la busqueda de conversaciones).
export function useDebounce<T>(valor: T, delay = 250): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), delay);
    return () => clearTimeout(t);
  }, [valor, delay]);
  return retrasado;
}
