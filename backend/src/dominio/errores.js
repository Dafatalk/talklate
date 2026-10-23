// Errores con codigo HTTP segun convenciones/api-rest.md. Los mensajes salen tal cual al usuario.
class ErrorNegocio extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}
const mal = (mensaje) => new ErrorNegocio(400, mensaje); // validacion de datos
const reglaNegocio = (mensaje) => new ErrorNegocio(422, mensaje); // regla de negocio violada
const noAutorizado = (mensaje = 'Debes iniciar sesion para continuar.') => new ErrorNegocio(401, mensaje);
const prohibido = (mensaje = 'No tienes permiso para hacer esto.') => new ErrorNegocio(403, mensaje);
const noEncontrado = (mensaje = 'No encontramos lo que buscas.') => new ErrorNegocio(404, mensaje);
const conflicto = (mensaje) => new ErrorNegocio(409, mensaje);

const NOMBRES = {
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict',
  422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway',
};

// Formato de error de la convencion: statusCode, error, message, timestamp, path
function cuerpoError(estado, mensaje, ruta) {
  return { statusCode: estado, error: NOMBRES[estado] || 'Error', message: mensaje, timestamp: new Date().toISOString(), path: ruta };
}

module.exports = { ErrorNegocio, mal, reglaNegocio, noAutorizado, prohibido, noEncontrado, conflicto, cuerpoError };
