// Adaptador del puerto Notificador (ver puertos/index.js) para desarrollo. Modo "consola": no hay
// servicio de correo; el codigo se devuelve en la respuesta para poder probar. Por seguridad no se
// escribe el correo ni el codigo en el log. Un servicio real (SMTP, SES) seria otro adaptador.
const { ErrorNegocio } = require('../../dominio/errores');
const log = require('../../compartido/log');

function crearNotificadorConsola({ modo = 'consola', produccion = false } = {}) {
  return {
    async enviarCodigoRecuperacion(usuarioId) {
      if (String(modo).toLowerCase() === 'consola' && !produccion) {
        log.info('codigo_recuperacion_generado', { usuario_id: usuarioId, modo: 'consola' });
        return { devolverCodigo: true };
      }
      // Usuario-RN-7: sin servicio de correo configurado se informa el fallo
      log.error('codigo_recuperacion_sin_servicio', { usuario_id: usuarioId });
      throw new ErrorNegocio(502, 'Ocurrio un error al enviar el codigo. Por favor intenta nuevamente mas tarde.');
    },
  };
}

module.exports = { crearNotificadorConsola };
