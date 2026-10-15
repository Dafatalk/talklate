// Autenticacion: token de acceso corto (JWT) + token de refresco largo y rotativo
// (convenciones/seguridad.md seccion 3). Usa el repositorio async (SurrealDB/SQLite).
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { noAutorizado, prohibido } = require('./errores');
const log = require('./log');

const SECRETO = process.env.JWT_SECRET || 'secreto-solo-desarrollo';
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') throw new Error('Falta JWT_SECRET en produccion');
  log.advertencia('jwt_secreto_desarrollo', { detalle: 'JWT_SECRET no esta definido; se usa un secreto de desarrollo.' });
}
const DURACION_ACCESO_SEG = Number(process.env.DURACION_ACCESO_SEG) || 15 * 60;
const DURACION_REFRESCO_MS = (Number(process.env.DURACION_REFRESCO_DIAS) || 30) * 24 * 60 * 60 * 1000;

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

function firmarAcceso(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol, jti: crypto.randomUUID() }, SECRETO, { expiresIn: DURACION_ACCESO_SEG });
}

// Crea el par de tokens. El de refresco solo se guarda como hash.
async function emitirSesion(repo, usuario) {
  const refresco = crypto.randomBytes(48).toString('base64url');
  await repo.tokens.crear({ id: crypto.randomUUID(), usuario_id: usuario.id, hash: hash(refresco), expira: Date.now() + DURACION_REFRESCO_MS });
  return { token: firmarAcceso(usuario), token_refresco: refresco, expira_en: DURACION_ACCESO_SEG };
}

// Rota el token de refresco: el usado queda revocado y se entrega uno nuevo.
// consumir() revoca y lee en un solo paso, asi un mismo token no sirve para dos sesiones.
async function refrescarSesion(repo, refresco) {
  const fila = typeof refresco === 'string' ? await repo.tokens.consumir(hash(refresco), Date.now()) : null;
  if (!fila) throw noAutorizado('La sesion ya ha expirado. Inicia sesion de nuevo.');
  const usuario = await repo.usuarios.porId(fila.usuario_id);
  if (!usuario) throw noAutorizado('La sesion ya ha expirado. Inicia sesion de nuevo.');
  return { usuario, sesion: await emitirSesion(repo, usuario) };
}

async function revocarRefresco(repo, refresco) {
  if (typeof refresco === 'string') await repo.tokens.revocarHash(hash(refresco));
}

// Middleware: exige un token de acceso valido y no revocado (Usuario-RN-10)
function requerirSesion(repo) {
  return async (req, _res, next) => {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
    if (!token) return next(noAutorizado());
    let datos;
    try {
      datos = jwt.verify(token, SECRETO);
    } catch {
      log.info('autenticacion_rechazada', { ruta: req.originalUrl });
      return next(noAutorizado('La sesion ya ha expirado o no es valida.'));
    }
    try {
      if (await repo.sesiones.tiene(datos.jti)) return next(noAutorizado('La sesion ya ha expirado o no es valida.'));
      const usuario = await repo.usuarios.paraSesion(datos.sub);
      if (!usuario) return next(noAutorizado('La sesion ya ha expirado o no es valida.'));
      req.usuario = usuario;
      req.sesion = { jti: datos.jti, exp: datos.exp };
      next();
    } catch (e) {
      next(e);
    }
  };
}

function requerirAdmin(req, _res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    log.advertencia('autorizacion_rechazada', { usuario_id: req.usuario && req.usuario.id, ruta: req.originalUrl });
    return next(prohibido('Solo un administrador puede hacer esto.'));
  }
  next();
}

module.exports = { emitirSesion, refrescarSesion, revocarRefresco, requerirSesion, requerirAdmin, DURACION_ACCESO_SEG };
