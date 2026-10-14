// Logs estructurados en JSON (regla transversal 7 y convenciones/seguridad.md seccion 8).
// Nunca se registran contrasenas, tokens, correos ni el contenido de los mensajes: solo identificadores.
const CAMPOS_PROHIBIDOS = ['password', 'contrasena', 'token', 'token_refresco', 'correo', 'contenido', 'texto', 'codigo'];

function limpiar(datos = {}) {
  const out = {};
  for (const [k, v] of Object.entries(datos)) {
    if (CAMPOS_PROHIBIDOS.includes(k)) continue;
    out[k] = v instanceof Error ? v.message : v;
  }
  return out;
}

function escribir(nivel, evento, datos) {
  if (process.env.TALKLATE_LOGS === 'silencio') return;
  const linea = JSON.stringify({ momento: new Date().toISOString(), nivel, evento, ...limpiar(datos) });
  (nivel === 'error' ? process.stderr : process.stdout).write(linea + '\n');
}

module.exports = {
  info: (evento, datos) => escribir('info', evento, datos),
  advertencia: (evento, datos) => escribir('advertencia', evento, datos),
  error: (evento, datos) => escribir('error', evento, datos),
  limpiar,
};
