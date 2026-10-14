// Envio del codigo de recuperacion. Modo "consola": lo imprime en el log (solo desarrollo).
const { ErrorNegocio } = require('./errores');

async function enviarCodigo(correo, codigo) {
  const modo = (process.env.CORREO_MODO || 'consola').toLowerCase();
  if (modo === 'consola') {
    console.log(`[talklate] Codigo de recuperacion para ${correo}: ${codigo}`);
    return { devolverCodigo: process.env.NODE_ENV !== 'production' };
  }
  // Usuario-RN-7: si no hay servicio de correo configurado, se informa el fallo
  throw new ErrorNegocio(502, 'Ocurrio un error al enviar el codigo. Por favor intenta nuevamente mas tarde.');
}

module.exports = { enviarCodigo };
