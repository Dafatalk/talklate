process.env.TALKLATE_LOGS = 'silencio';
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearCifradorAesGcm } = require('../../src/adaptadores/cifrado/aesGcm');
const { crearLimite } = require('../../src/adaptadores/http/limites');
const log = require('../../src/compartido/log');
const { cuerpoError } = require('../../src/dominio/errores');

test('cifrado AES-256-GCM: ida y vuelta, textos viejos sin cifrar y clave distinta', () => {
  const { cifrar, descifrar } = crearCifradorAesGcm({ secreto: 'clave-de-prueba' });
  const c = cifrar('Hay que ponerse las pilas');
  assert.match(c, /^enc:v1:/);
  assert.notEqual(cifrar('hola'), cifrar('hola')); // vector aleatorio
  assert.equal(descifrar(c), 'Hay que ponerse las pilas');
  assert.equal(descifrar('texto sin cifrar'), 'texto sin cifrar');
  assert.equal(cifrar(null), null);
  assert.throws(() => crearCifradorAesGcm({ secreto: 'otra-clave' }).descifrar(c)); // con otra clave no se puede leer
  assert.throws(() => crearCifradorAesGcm({ produccion: true }), /TALKLATE_CLAVE_CIFRADO/); // en produccion la clave es obligatoria
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
  const { crearNotificadorConsola } = require('../../src/adaptadores/correo/consola');
  await assert.rejects(crearNotificadorConsola({ produccion: true }).enviarCodigoRecuperacion('u1', '123456'), (e) => e.estado === 502);
  assert.deepEqual(await crearNotificadorConsola().enviarCodigoRecuperacion('u1', '123456'), { devolverCodigo: true });
});

test('hasheador bcrypt: no guarda el valor original y solo acepta el correcto', () => {
  const { crearHasheadorBcrypt } = require('../../src/adaptadores/credenciales/bcrypt');
  const h = crearHasheadorBcrypt();
  const hash = h.hashear('Clave123!', 4);
  assert.ok(!hash.includes('Clave123!'));
  assert.notEqual(h.hashear('Clave123!', 4), hash); // sal distinta en cada hash
  assert.equal(h.comparar('Clave123!', hash), true);
  assert.equal(h.comparar('Otra123!', hash), false);
  assert.equal(h.comparar(undefined, hash), false);
});

test('firmador JWT: firma, verifica, rechaza tokens alterados, vencidos o de otro secreto', () => {
  const { crearFirmadorJwt } = require('../../src/adaptadores/credenciales/jwt');
  const f = crearFirmadorJwt({ secreto: 'uno' });
  const token = f.firmar({ sub: 'u1', rol: 'cliente' }, 60);
  assert.equal(f.verificar(token).sub, 'u1');
  assert.throws(() => f.verificar(token.slice(0, -2) + 'xx'));
  assert.throws(() => crearFirmadorJwt({ secreto: 'dos' }).verificar(token));
  assert.throws(() => f.verificar(f.firmar({ sub: 'u1' }, -1)), /expired/);
  assert.throws(() => crearFirmadorJwt({}), /secreto/);
});

test('salida del modelo: la nota y la region solo se aceptan como texto y con largo acotado', () => {
  const { leerRespuesta } = require('../../src/adaptadores/traduccion/prompt');
  const tonos = ['Neutral', 'Alegre'];
  const r = leerRespuesta(JSON.stringify({ traduccion: 'Hello', tono: 'Alegre', nota_cultural: 'x'.repeat(900), region_origen: { raro: true } }), tonos);
  assert.equal(r.nota.length, 500);
  assert.equal(r.regionOrigen, null); // un objeto no es una region valida
  assert.equal(leerRespuesta(JSON.stringify({ traduccion: 'Hello', nota_cultural: ['a'] }), tonos).nota, null);
  assert.equal(leerRespuesta(JSON.stringify({ traduccion: 'Hello', nota_cultural: '  ' }), tonos).nota, null);
});

test('reportar un problema tiene limite de uso por usuario (429)', async () => {
  process.env.LIMITE_PROBLEMAS_POR_HORA = '2';
  const express = require('express');
  const { ErrorNegocio } = require('../../src/dominio/errores');
  const rutas = require('../../src/adaptadores/http/rutas/problemas');
  let n = 0;
  const app = express();
  app.use(express.json());
  app.use(rutas({ problemas: { reportar: async () => ({ id: String(++n) }) }, sesiones: { verificarAcceso: async () => ({ usuario: { id: 'u1', rol: 'cliente' }, sesion: {} }) } }));
  app.use((e, _req, res, _n) => res.status(e instanceof ErrorNegocio ? e.estado : 500).json({ message: e.message }));
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  try {
    const url = `http://127.0.0.1:${srv.address().port}/problemas`;
    const pedir = () => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).then((r) => r.status);
    assert.deepEqual([await pedir(), await pedir(), await pedir()], [201, 201, 429]);
  } finally {
    srv.close();
    delete process.env.LIMITE_PROBLEMAS_POR_HORA;
  }
});

test('en produccion no se crea el administrador con la contrasena de desarrollo', () => {
  const { abrir } = require('../../src/adaptadores/persistencia/sqlite/esquema');
  const previo = { env: process.env.NODE_ENV, pass: process.env.ADMIN_PASSWORD };
  process.env.NODE_ENV = 'production';
  delete process.env.ADMIN_PASSWORD;
  try {
    assert.throws(() => abrir(':memory:'), /ADMIN_PASSWORD/);
    process.env.ADMIN_PASSWORD = 'Clave-De-Produccion-1!';
    assert.doesNotThrow(() => abrir(':memory:'));
  } finally {
    if (previo.env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previo.env;
    if (previo.pass === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previo.pass;
  }
});
