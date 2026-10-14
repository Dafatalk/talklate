// Limites de uso en memoria (convenciones/seguridad.md seccion 7: rate limiting, en especial sobre la traduccion)
const { ErrorNegocio } = require('./errores');

function crearLimite({ maximo, ventanaMs, mensaje, clave }) {
  const registros = new Map();
  return (req, _res, next) => {
    const k = clave(req);
    const ahora = Date.now();
    const lista = (registros.get(k) || []).filter((t) => ahora - t < ventanaMs);
    if (lista.length >= maximo) {
      registros.set(k, lista);
      return next(new ErrorNegocio(429, mensaje));
    }
    lista.push(ahora);
    registros.set(k, lista);
    if (registros.size > 10000) registros.clear(); // evita crecer sin limite
    next();
  };
}

const porIp = (req) => req.ip || 'desconocida';
const porUsuario = (req) => (req.usuario ? req.usuario.id : porIp(req));

module.exports = { crearLimite, porIp, porUsuario };
