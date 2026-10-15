// Conexion a SurrealDB por HTTP (endpoint /sql). Sin dependencias nuevas: usa el
// fetch global de Node 22. SurrealDB es la fuente de verdad del backend.
//
// Config por entorno (ver .env / .env.example):
//   SURREAL_URL   (default: la instancia REMOTA de SurrealDB Cloud; nunca local)
//   SURREAL_NS    (default talklate)
//   SURREAL_DB    (default app)
//   SURREAL_USER / SURREAL_PASS (credenciales; obligatorias, no hay fallback local)
//
// Requiere SurrealDB 3.x (el esquema usa funciones de la v3, p. ej. string::is_email).
// Se entra una sola vez con /signin y se reutiliza el token (Bearer): mandar usuario y
// clave en cada consulta obliga a SurrealDB a verificar la clave cada vez (~35 ms extra).
//
// Las sentencias se arman inlineando literales ya serializados (lit/rid) para
// evitar inyeccion y los limites del paso de variables por query-string.
const log = require('./lib/log');

// El backend trabaja SIEMPRE contra la instancia remota (SurrealDB Cloud). No se usa
// ninguna instancia local. Se puede sobreescribir con SURREAL_URL si hiciera falta.
const URL_REMOTA = 'https://talklate-06gheqc0f1ov791h9h9udu6t9c.aws-use1.surreal.cloud';

// Acepta tanto el endpoint HTTP (https://host) como el WebSocket de Cloud
// (wss://host/rpc): se normaliza al endpoint HTTP /sql.
function normalizarUrl(valor) {
  return String(valor || URL_REMOTA)
    .trim()
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/rpc\/?$/i, '')
    .replace(/\/+$/, '');
}

function config() {
  if (process.env.NODE_ENV === 'production' && (!process.env.SURREAL_USER || !process.env.SURREAL_PASS || process.env.SURREAL_PASS === 'root')) {
    throw new Error('En produccion define SURREAL_USER y SURREAL_PASS (no uses root/root).');
  }
  return {
    url: normalizarUrl(process.env.SURREAL_URL),
    ns: process.env.SURREAL_NS || 'talklate',
    db: process.env.SURREAL_DB || 'app',
    usuario: process.env.SURREAL_USER || 'root',
    password: process.env.SURREAL_PASS || 'root',
    timeoutMs: Number(process.env.SURREAL_TIMEOUT_MS) || 15000,
  };
}

// Token de sesion de SurrealDB compartido por todas las consultas
let sesion = null; // { token, vence }
let entrando = null;
const DURACION_TOKEN_MS = 50 * 60 * 1000; // SurrealDB emite tokens de 1 hora; se renueva antes

async function entrar(c, fetchFn) {
  let resp;
  try {
    resp = await fetchFn(`${c.url}/signin`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: c.usuario, pass: c.password }),
      signal: AbortSignal.timeout(c.timeoutMs),
    });
  } catch (e) {
    throw new Error(`No se pudo conectar a SurrealDB en ${c.url}: ${e.message}`);
  }
  if (!resp.ok) throw new Error(`SurrealDB rechazo las credenciales (${resp.status})`);
  const { token } = await resp.json();
  if (!token) throw new Error('SurrealDB no devolvio un token de sesion');
  sesion = { token, vence: Date.now() + DURACION_TOKEN_MS };
  return token;
}

async function token(c, fetchFn, renovar = false) {
  if (!renovar && sesion && sesion.vence > Date.now()) return sesion.token;
  if (!entrando) entrando = entrar(c, fetchFn).finally(() => { entrando = null; });
  return entrando;
}

function olvidarSesion() {
  sesion = null;
}

function cabeceras(c, nivel, tk) {
  const h = {
    Accept: 'application/json',
    'Content-Type': 'text/plain',
    Authorization: `Bearer ${tk}`,
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
  const enviar = async (tk) => {
    try {
      return await fetchFn(`${c.url}/sql`, {
        method: 'POST',
        headers: cabeceras(c, nivel, tk),
        body: surql,
        signal: AbortSignal.timeout(c.timeoutMs),
      });
    } catch (e) {
      throw new Error(`No se pudo conectar a SurrealDB en ${c.url}: ${e.message}`);
    }
  };
  let resp = await enviar(await token(c, fetchFn));
  // Token vencido o invalidado (p. ej. SurrealDB se reinicio): se entra de nuevo una vez
  if (resp.status === 401 || resp.status === 403) resp = await enviar(await token(c, fetchFn, true));
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
  await verificarVersion(c);
  await consulta(`DEFINE NAMESPACE IF NOT EXISTS ${ident(c.ns)};`, { nivel: 'root' });
  await consulta(`DEFINE DATABASE IF NOT EXISTS ${ident(c.db)};`, { nivel: 'ns' });
  await consulta('RETURN 1;');
  log.info('surreal_conectado', { url: c.url, ns: c.ns, db: c.db });
  return { url: c.url, ns: c.ns, db: c.db };
}

// El esquema usa funciones de SurrealDB 3 (string::is_email); con la 2.x falla al arrancar
async function verificarVersion(c) {
  let texto = '';
  try {
    const r = await fetch(`${c.url}/version`, { signal: AbortSignal.timeout(c.timeoutMs) });
    texto = (await r.text()).trim();
  } catch (e) {
    throw new Error(`No se pudo conectar a SurrealDB en ${c.url}: ${e.message}`);
  }
  const mayor = Number((texto.match(/(\d+)\./) || [])[1]);
  if (mayor && mayor < 3) throw new Error(`TalkLate requiere SurrealDB 3.x y el servidor es ${texto}`);
}

// Estado para /health (no lanza). /health es publico: el detalle del error va al log, no a la respuesta.
async function estado() {
  try {
    await consulta('RETURN 1;');
    return { ok: true, motor: 'surrealdb' };
  } catch (e) {
    log.error('surreal_no_disponible', { detalle: e.message });
    return { ok: false, motor: 'surrealdb' };
  }
}

module.exports = { config, olvidarSesion, consulta, filas, fila, conectar, estado, lit, rid, ident, idPlano };
