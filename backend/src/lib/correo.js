// Envio del codigo de recuperacion. Modo "consola" (solo desarrollo): no hay servicio de correo; el codigo
// se devuelve en la respuesta para poder probar. Por seguridad no se escribe el correo ni el codigo en el log.
const { ErrorNegocio } = require('./errores');
const log = require('./log');

async function enviarCodigo(usuarioId) {
  const modo = (process.env.CORREO_MODO || 'consola').toLowerCase();
  if (modo === 'consola' && process.env.NODE_ENV !== 'production') {
    log.info('codigo_recuperacion_generado', { usuario_id: usuarioId, modo: 'consola' });
    return { devolverCodigo: true };
  }
  // Usuario-RN-7: sin servicio de correo configurado se informa el fallo
  log.error('codigo_recuperacion_sin_servicio', { usuario_id: usuarioId });
  throw new ErrorNegocio(502, 'Ocurrio un error al enviar el codigo. Por favor intenta nuevamente mas tarde.');
}

module.exports = { enviarCodigo };
