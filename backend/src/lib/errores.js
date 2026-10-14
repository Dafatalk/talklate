// Error de negocio con codigo HTTP; los mensajes salen tal cual al usuario.
class ErrorNegocio extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}
const mal = (mensaje) => new ErrorNegocio(400, mensaje);
const noAutorizado = (mensaje = 'Debes iniciar sesion para continuar.') => new ErrorNegocio(401, mensaje);
const prohibido = (mensaje = 'No tienes permiso para hacer esto.') => new ErrorNegocio(403, mensaje);
const noEncontrado = (mensaje = 'No encontramos lo que buscas.') => new ErrorNegocio(404, mensaje);
const conflicto = (mensaje) => new ErrorNegocio(409, mensaje);

module.exports = { ErrorNegocio, mal, noAutorizado, prohibido, noEncontrado, conflicto };
