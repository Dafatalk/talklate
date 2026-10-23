// Reglas que la app revisa antes de llamar al servidor (las mismas de Usuario-RN-2 a RN-4) y textos derivados.
// No dependen de React Native, por eso se prueban con node (test/reglas.test.ts).

export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function edad(fechaIso: string, hoy: Date = new Date()): number {
  const f = new Date(fechaIso + 'T00:00:00');
  let e = hoy.getFullYear() - f.getFullYear();
  if (hoy.getMonth() < f.getMonth() || (hoy.getMonth() === f.getMonth() && hoy.getDate() < f.getDate())) e -= 1;
  return e;
}

export function passwordSegura(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
}

export type FormRegistro = { nombre: string; apellido: string; correo: string; fecha: string; password: string; acepta: boolean };

export function validarRegistro(f: FormRegistro, hoy: Date = new Date()): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nombre.trim()) e.nombre = 'Ingresa tu nombre';
  if (!f.apellido.trim()) e.apellido = 'Ingresa tu apellido';
  if (!REGEX_CORREO.test(f.correo.trim())) e.correo = 'El formato del correo es invalido';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha) || Number.isNaN(Date.parse(f.fecha))) e.fecha = 'Usa el formato AAAA-MM-DD';
  else if (edad(f.fecha, hoy) < 13) e.fecha = 'Debes tener al menos 13 anos para crear una cuenta';
  if (!passwordSegura(f.password)) e.password = 'Minimo 8 caracteres, una mayuscula, un numero y un simbolo';
  if (!f.acepta) e.acepta = 'Debes aceptar la politica de tratamiento de datos';
  return e;
}

type Config = { origen: { idioma: string } | null; destino: { idioma: string; region: string | null } };

export function etiquetaConfig(c: Config): string {
  return `${c.origen ? c.origen.idioma : 'Idioma por detectar'} → ${c.destino.idioma}${c.destino.region ? ` (${c.destino.region})` : ''}`;
}

// La traduccion se escucha en el idioma al que se tradujo: el del destino si hablo el usuario, el de origen si hablo la otra persona
export function idiomaDeEntrega<T>(remitente: 'usuario' | 'interlocutor', config: { origen: T | null; destino: T }): T | null {
  return remitente === 'usuario' ? config.destino : config.origen;
}

// Resume el volumen medido mientras se grababa (dB entre -160 y 0, una muestra cada 100 ms) para que el
// servidor estime COMO se dijo el mensaje. Ignora el silencio (por debajo de -60 dB).
export function resumirVolumen(muestrasDb: number[]): { volumen_promedio_db: number; volumen_max_db: number; variacion_db: number } | null {
  const voz = muestrasDb.filter((x) => Number.isFinite(x) && x > -60);
  if (voz.length < 3) return null;
  const promedio = voz.reduce((a, b) => a + b, 0) / voz.length;
  const variacion = Math.sqrt(voz.reduce((a, b) => a + (b - promedio) ** 2, 0) / voz.length);
  const r = (x: number) => Math.round(x * 10) / 10;
  return { volumen_promedio_db: r(promedio), volumen_max_db: r(Math.max(...voz)), variacion_db: r(variacion) };
}
