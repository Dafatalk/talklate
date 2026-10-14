process.env.TALKLATE_LOGS = 'silencio';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cifrar, descifrar, reiniciarClave } = require('../src/lib/cifrado');
const { crearLimite } = require('../src/lib/limites');
const log = require('../src/lib/log');
const { cuerpoError } = require('../src/lib/errores');

test('cifrado AES-256-GCM: ida y vuelta, textos viejos sin cifrar y clave distinta', () => {
  const c = cifrar('Hay que ponerse las pilas');
  assert.match(c, /^enc:v1:/);
  assert.notEqual(cifrar('hola'), cifrar('hola')); // vector aleatorio
  assert.equal(descifrar(c), 'Hay que ponerse las pilas');
  assert.equal(descifrar('texto sin cifrar'), 'texto sin cifrar');
  assert.equal(cifrar(null), null);
  process.env.TALKLATE_CLAVE_CIFRADO = 'otra-clave';
  reiniciarClave();
  assert.throws(() => descifrar(c)); // con otra clave no se puede leer
  delete process.env.TALKLATE_CLAVE_CIFRADO;
  reiniciarClave();
});

test('limite de uso responde 429 al pasar el maximo', () => {
  const limite = crearLimite({ maximo: 2, ventanaMs: 60000, clave: () => 'x', mensaje: 'Muy rapido' });
  const errores = [];
  for (let i = 0; i < 3; i += 1) limite({}, {}, (e) => errores.push(e));
  assert.equal(errores[0], undefined);
  assert.equal(errores[1], undefined);
  assert.equal(errores[2].estado, 429);
});

test('los logs nunca llevan datos personales ni secretos', () => {
  const limpio = log.limpiar({ usuario_id: 'u1', correo: 'a@b.com', password: 'x', token: 't', contenido: 'mensaje', codigo: '123456', detalle: new Error('falla') });
  assert.deepEqual(limpio, { usuario_id: 'u1', detalle: 'falla' });
});

test('formato de error de la convencion', () => {
  const e = cuerpoError(422, 'Regla', '/api/v1/x');
  assert.equal(e.statusCode, 422);
  assert.equal(e.error, 'Unprocessable Entity');
  assert.equal(e.path, '/api/v1/x');
  assert.ok(e.timestamp);
});

test('en produccion sin servicio de correo se informa el fallo (Usuario-RN-7)', async () => {
  const { enviarCodigo } = require('../src/lib/correo');
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(enviarCodigo('u1'), (e) => e.estado === 502);
  } finally {
    delete process.env.NODE_ENV;
  }
});
