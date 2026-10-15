// Conexion a SurrealDB por HTTP (endpoint /sql). Sin dependencias nuevas: usa el
// fetch global de Node 22. SurrealDB es la fuente de verdad del backend.
//
// Config por entorno (ver .env.example):
//   SURREAL_URL   (default http://127.0.0.1:8000)
//   SURREAL_NS    (default talklate)
//   SURREAL_DB    (default app)
//   SURREAL_USER / SURREAL_PASS (default root / root)
//
// Las sentencias se arman inlineando literales ya serializados (lit/rid) para
// evitar inyeccion y los limites del paso de variables por query-string.
const log = require('./lib/log');

function config() {
  return {
    url: (process.env.SURREAL_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
    ns: process.env.SURREAL_NS || 'talklate',
    db: process.env.SURREAL_DB || 'app',
    usuario: process.env.SURREAL_USER || 'root',
    password: process.env.SURREAL_PASS || 'root',
    timeoutMs: Number(process.env.SURREAL_TIMEOUT_MS) || 15000,
  };
}

function cabeceras(c, nivel) {
  const h = {
    Accept: 'application/json',
    'Content-Type': 'text/plain',
    Authorization: 'Basic ' + Buffer.from(`${c.usuario}:${c.password}`).toString('base64'),
  };
  if (nivel === 'ns' || nivel === 'db') h['surreal-ns'] = c.ns;
  if (nivel === 'db') h['surreal-db'] = c.db;
  return h;
}

// Serializa un valor JS a un literal SurrealQL seguro.
function lit(v) {
  if (v === null || v === undefined) return 'NONE';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NONE';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v && typeof v === 'object' && typeof v.__raw === 'string') return v.__raw; // literal crudo
  return JSON.stringify(String(v)); // string con escapes estilo JSON (valido en SurrealQL)
}

// Record id seguro a partir de un id de negocio (uuid): type::record("tabla", "id")
function rid(tabla, id) {
  return { __raw: `type::record(${JSON.stringify(String(tabla))}, ${JSON.stringify(String(id))})` };
}

// Identificador de tabla/ns/db: se usa crudo si es simple; si no, entre backticks.
function ident(nombre) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(nombre) ? nombre : '`' + String(nombre).replace(/`/g, '') + '`';
}

// De un record id serializado ("tabla:`uuid`") devuelve el id de negocio ("uuid").
function idPlano(thing) {
  if (thing === null || thing === undefined) return null;
  const s = String(thing);
  const i = s.indexOf(':');
  let id = i >= 0 ? s.slice(i + 1) : s;
  if ((id.startsWith('`') && id.endsWith('`')) || (id.startsWith('⟨') && id.endsWith('⟩'))) id = id.slice(1, -1);
  return id;
}

async function crudo(surql, { nivel = 'db', fetchFn = fetch } = {}) {
  const c = config();
  let resp;
  try {
    resp = await fetchFn(`${c.url}/sql`, {
      method: 'POST',
      headers: cabeceras(c, nivel),
      body: surql,
      signal: AbortSignal.timeout(c.timeoutMs),
    });
  } catch (e) {
    throw new Error(`No se pudo conectar a SurrealDB en ${c.url}: ${e.message}`);
  }
  if (!resp.ok) throw new Error(`SurrealDB respondio ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const cuerpo = await resp.json();
  if (!Array.isArray(cuerpo)) throw new Error(`Respuesta inesperada de SurrealDB: ${JSON.stringify(cuerpo).slice(0, 300)}`);
  return cuerpo;
}

// Ejecuta una o varias sentencias y valida que todas terminen OK.
// Devuelve el arreglo de `result` (uno por sentencia).
async function consulta(surql, opciones = {}) {
  const partes = await crudo(surql, opciones);
  for (const p of partes) {
    if (p.status !== 'OK') throw new Error(typeof p.result === 'string' ? p.result : `SurrealDB: ${p.status}`);
  }
  return partes.map((p) => p.result);
}

// Resultado (array de filas) de una sentencia simple.
async function filas(surql, opciones) {
  const r = await consulta(surql, opciones);
  const ultimo = r[r.length - 1];
  return Array.isArray(ultimo) ? ultimo : ultimo == null ? [] : [ultimo];
}

// Primera fila (o null) de una sentencia simple.
async function fila(surql, opciones) {
  return (await filas(surql, opciones))[0] ?? null;
}

// Asegura namespace/base (modo estricto) y verifica conectividad + credenciales.
async function conectar() {
  const c = config();
  await consulta(`DEFINE NAMESPACE IF NOT EXISTS ${ident(c.ns)};`, { nivel: 'root' });
  await consulta(`DEFINE DATABASE IF NOT EXISTS ${ident(c.db)};`, { nivel: 'ns' });
  await consulta('RETURN 1;');
  log.info('surreal_conectado', { url: c.url, ns: c.ns, db: c.db });
  return { url: c.url, ns: c.ns, db: c.db };
}

// Estado para /health (no lanza; informa ok:false con el detalle).
async function estado() {
  const c = config();
  try {
    await consulta('RETURN 1;');
    return { ok: true, url: c.url, ns: c.ns, db: c.db };
  } catch (e) {
    return { ok: false, url: c.url, ns: c.ns, db: c.db, error: e.message };
  }
}

module.exports = { config, consulta, filas, fila, conectar, estado, lit, rid, ident, idPlano };
