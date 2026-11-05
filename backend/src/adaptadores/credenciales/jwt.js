// Adaptador del puerto FirmadorTokens (ver puertos/index.js) con JSON Web Tokens (HS256): firma el token
// de acceso corto y lo verifica (firma y vencimiento). El secreto solo lo conoce este adaptador (ADR-006).
const jwt = require('jsonwebtoken');

function crearFirmadorJwt({ secreto }) {
  if (!secreto) throw new Error('El firmador de tokens necesita un secreto');
  return {
    firmar: (datos, duracionSeg) => jwt.sign(datos, secreto, { expiresIn: duracionSeg, algorithm: 'HS256' }),
    verificar: (token) => jwt.verify(token, secreto, { algorithms: ['HS256'] }),
  };
}

module.exports = { crearFirmadorJwt };
