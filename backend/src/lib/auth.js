// Autenticacion: token de acceso corto (JWT) + token de refresco largo y rotativo (convenciones/seguridad.md seccion 3)
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
function emitirSesion(db, usuario) {
  const refresco = crypto.randomBytes(48).toString('base64url');
  db.prepare('INSERT INTO token_refresco (id, usuario_id, hash, expira, revocado) VALUES (?,?,?,?,0)')
    .run(crypto.randomUUID(), usuario.id, hash(refresco), Date.now() + DURACION_REFRESCO_MS);
  return { token: firmarAcceso(usuario), token_refresco: refresco, expira_en: DURACION_ACCESO_SEG };
}

// Rota el token de refresco: el usado queda revocado y se entrega uno nuevo
function refrescarSesion(db, refresco) {
  const fila = typeof refresco === 'string' && db.prepare('SELECT * FROM token_refresco WHERE hash = ?').get(hash(refresco));
  if (!fila || fila.revocado || fila.expira < Date.now()) throw noAutorizado('La sesion ya ha expirado. Inicia sesion de nuevo.');
  db.prepare('UPDATE token_refresco SET revocado = 1 WHERE id = ?').run(fila.id);
  const usuario = db.prepare('SELECT * FROM usuario WHERE id = ?').get(fila.usuario_id);
  if (!usuario) throw noAutorizado('La sesion ya ha expirado. Inicia sesion de nuevo.');
  return { usuario, sesion: emitirSesion(db, usuario) };
}

function revocarRefresco(db, refresco) {
  if (typeof refresco === 'string') db.prepare('UPDATE token_refresco SET revocado = 1 WHERE hash = ?').run(hash(refresco));
}

// Middleware: exige un token de acceso valido y no revocado (Usuario-RN-10)
function requerirSesion(db) {
  return (req, _res, next) => {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
    if (!token) return next(noAutorizado());
    try {
      const datos = jwt.verify(token, SECRETO);
      const revocada = db.prepare('SELECT 1 FROM sesion_revocada WHERE jti = ?').get(datos.jti);
      if (revocada) return next(noAutorizado('La sesion ya ha expirado o no es valida.'));
      const usuario = db.prepare('SELECT id, nombre, apellido, correo, fecha_nacimiento, rol FROM usuario WHERE id = ?').get(datos.sub);
      if (!usuario) return next(noAutorizado('La sesion ya ha expirado o no es valida.'));
      req.usuario = usuario;
      req.sesion = { jti: datos.jti, exp: datos.exp };
      next();
    } catch {
      log.info('autenticacion_rechazada', { ruta: req.originalUrl });
      next(noAutorizado('La sesion ya ha expirado o no es valida.'));
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
