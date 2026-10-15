// Conexion a SurrealDB sin servidor: se simula fetch para revisar el manejo del token de sesion
process.env.TALKLATE_LOGS = 'silencio';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/surreal');

function falso({ rechazarPrimera = false } = {}) {
  const llamadas = { signin: 0, sql: 0, auth: [] };
  let rechazada = false;
  const fetchFn = async (url, opciones) => {
    if (url.endsWith('/signin')) {
      llamadas.signin += 1;
      return new Response(JSON.stringify({ token: `tk${llamadas.signin}` }), { status: 200 });
    }
    llamadas.sql += 1;
    llamadas.auth.push(opciones.headers.Authorization);
    if (rechazarPrimera && !rechazada) {
      rechazada = true;
      return new Response('token vencido', { status: 401 });
    }
    return new Response(JSON.stringify([{ status: 'OK', result: [{ n: 1 }] }]), { status: 200 });
  };
  return { fetchFn, llamadas };
}

test('surreal: entra una sola vez y reutiliza el token', async () => {
  S.olvidarSesion();
  const { fetchFn, llamadas } = falso();
  await Promise.all([S.consulta('RETURN 1;', { fetchFn }), S.consulta('RETURN 1;', { fetchFn })]);
  await S.consulta('RETURN 1;', { fetchFn });
  assert.equal(llamadas.signin, 1);
  assert.equal(llamadas.sql, 3);
  assert.ok(llamadas.auth.every((a) => a === 'Bearer tk1'));
});

test('surreal: si el token vence entra de nuevo y repite la consulta', async () => {
  S.olvidarSesion();
  const { fetchFn, llamadas } = falso({ rechazarPrimera: true });
  assert.deepEqual(await S.filas('SELECT 1;', { fetchFn }), [{ n: 1 }]);
  assert.equal(llamadas.signin, 2);
  assert.deepEqual(llamadas.auth, ['Bearer tk1', 'Bearer tk2']);
});

test('surreal: literales seguros y ids de negocio', () => {
  assert.equal(S.lit('a"b'), '"a\\"b"');
  assert.equal(S.lit(null), 'NONE');
  assert.equal(S.lit(true), 'true');
  assert.equal(S.lit(S.rid('usuario', 'x')), 'type::record("usuario", "x")');
  assert.equal(S.idPlano('usuario:`abc-1`'), 'abc-1');
  assert.equal(S.idPlano('usuario:⟨abc-1⟩'), 'abc-1');
});

test('surreal: en produccion no acepta root/root', () => {
  const antes = { ...process.env };
  process.env.NODE_ENV = 'production';
  delete process.env.SURREAL_PASS;
  assert.throws(() => S.config(), /SURREAL_PASS/);
  process.env.SURREAL_USER = 'talklate';
  process.env.SURREAL_PASS = 'clave-larga';
  assert.equal(S.config().usuario, 'talklate');
  process.env = antes;
});
