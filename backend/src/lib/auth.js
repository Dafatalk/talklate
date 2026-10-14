const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { noAutorizado, prohibido } = require('./errores');

const SECRETO = process.env.JWT_SECRET || 'secreto-solo-desarrollo';
if (!process.env.JWT_SECRET) console.warn('[talklate] JWT_SECRET no esta definido: usando un secreto de desarrollo.');
const DURACION_SEG = 60 * 60 * 24 * 7;

function firmar(usuario) {
  const jti = randomUUID();
  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol, jti }, SECRETO, { expiresIn: DURACION_SEG });
  return token;
}

// Middleware: exige token valido y no revocado (Usuario-RN-10)
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
      next(noAutorizado('La sesion ya ha expirado o no es valida.'));
    }
  };
}

function requerirAdmin(req, _res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') return next(prohibido('Solo un administrador puede hacer esto.'));
  next();
}

module.exports = { firmar, requerirSesion, requerirAdmin };
