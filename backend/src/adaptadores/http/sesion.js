// Adaptador HTTP de las sesiones: lee la cabecera Authorization y delega en el caso de uso
// (aplicacion/sesiones.js). Tambien exige el rol de administrador donde corresponde.
const { prohibido } = require('../../dominio/errores');
const log = require('../../compartido/log');

function requerirSesion(sesiones) {
  return async (req, _res, next) => {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
    try {
      const { usuario, sesion } = await sesiones.verificarAcceso(token);
      req.usuario = usuario;
      req.sesion = sesion;
      next();
    } catch (e) {
      if (token) log.info('autenticacion_rechazada', { ruta: req.originalUrl });
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

// Envuelve un manejador async para que los errores lleguen al manejador central de Express
const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { requerirSesion, requerirAdmin, ruta };
