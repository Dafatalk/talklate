// Adaptador del puerto Hasheador (ver puertos/index.js) con bcrypt: guarda contrasenas y codigos de
// recuperacion como hash con sal, y los compara sin revelar el valor original (ADR-006, ADR-010).
const bcrypt = require('bcryptjs');

function crearHasheadorBcrypt() {
  return {
    hashear: (valor, costo = 10) => bcrypt.hashSync(String(valor), costo),
    comparar: (valor, hash) => typeof valor === 'string' && typeof hash === 'string' && bcrypt.compareSync(valor, hash),
  };
}

module.exports = { crearHasheadorBcrypt };
