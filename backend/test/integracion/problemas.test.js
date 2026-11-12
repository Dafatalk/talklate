process.env.TRADUCTOR = 'local';
process.env.JWT_SECRET = 'prueba';
process.env.CORREO_MODO = 'consola';
process.env.TALKLATE_LOGS = 'silencio';
process.env.LIMITE_MENSAJES_POR_MINUTO = '1000';
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearApp } = require('../../src/adaptadores/http/app');
const { componer } = require('../../src/composicion');

const DRIVER = (process.env.TEST_DB_DRIVER || 'sqlite').toLowerCase();
function crearRepo() {
  if (DRIVER === 'surreal') {
    process.env.SURREAL_URL = process.env.SURREAL_URL || 'http://127.0.0.1:8000';
    process.env.SURREAL_NS = process.env.SURREAL_NS || `prueba_problemas_${Date.now()}`;
    return require('../../src/adaptadores/persistencia/surreal/repositorio')();
  }
  const { abrir } = require('../../src/adaptadores/persistencia/sqlite/esquema');
  return require('../../src/adaptadores/persistencia/sqlite/repositorio')(abrir(':memory:'));
}

const ADMIN = { correo: 'dafa123.daf@gmail.com', password: 'Admin123!' };
let servidor, raiz, base, tokenCliente, tokenAdmin;

test.before(async () => {
  const repo = crearRepo();
  await repo.inicializar();
  const transcriptor = { disponible: () => false, transcribir: async () => ({ texto: '' }) };
  const sintetizadores = [{ nombre: 'falso', disponible: () => true, sintetizar: async () => ({ audio: Buffer.from('a'), tipo: 'audio/mpeg', voz: 'voz-falsa' }) }];
  servidor = crearApp(componer({ repo, adaptadores: { transcriptor, sintetizadores } })).listen(0);
  await new Promise((r) => servidor.once('listening', r));
  raiz = `http://127.0.0.1:${servidor.address().port}`;
  base = `${raiz}/api/v1`;

  // Registrar un cliente de prueba
  const reg = await api('POST', '/auth/registro', {
    nombre: 'Test', apellido: 'Problema', correo: 'test-problema@correo.com',
    password: 'Clave123!', fecha_nacimiento: '2000-01-01', acepta_tratamiento_datos: true,
  });
  tokenCliente = reg.datos.token;

  // Login como admin
  const admin = await api('POST', '/auth/login', ADMIN);
  tokenAdmin = admin.datos.token;
});
test.after(() => servidor.close());

async function api(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  return { estado: r.status, datos: texto ? JSON.parse(texto) : null, cabeceras: r.headers };
}

test('problemas: sin autenticacion da 401', async () => {
  assert.equal((await api('POST', '/problemas', { descripcion: 'La app se traba al traducir audio' })).estado, 401);
});

test('problemas: validaciones de descripcion (400)', async () => {
  // sin descripcion
  assert.equal((await api('POST', '/problemas', {}, tokenCliente)).estado, 400);
  // descripcion muy corta (menor a 5 chars tras trim)
  assert.equal((await api('POST', '/problemas', { descripcion: 'abc' }, tokenCliente)).estado, 400);
  // descripcion solo espacios
  assert.equal((await api('POST', '/problemas', { descripcion: '    ' }, tokenCliente)).estado, 400);
});

let problemaId;
test('problemas: crear problema valido (201) con campos opcionales', async () => {
  const r = await api('POST', '/problemas', {
    descripcion: 'La app se traba al traducir audio de larga duracion',
    categoria: 'Error de traduccion',
    contacto: 'yo@mail.com',
  }, tokenCliente);
  assert.equal(r.estado, 201);
  assert.ok(r.datos.id);
  assert.match(r.datos.mensaje, /Gracias/);
  problemaId = r.datos.id;
});

test('problemas: crear problema sin campos opcionales (201)', async () => {
  const r = await api('POST', '/problemas', { descripcion: 'El microfono no funciona bien' }, tokenCliente);
  assert.equal(r.estado, 201);
  assert.ok(r.datos.id);
});

test('problemas: cliente no puede listar /admin/problemas (403)', async () => {
  assert.equal((await api('GET', '/admin/problemas', null, tokenCliente)).estado, 403);
});

test('problemas: admin lista problemas paginados con datos correctos', async () => {
  const r = await api('GET', '/admin/problemas?limit=100', null, tokenAdmin);
  assert.equal(r.estado, 200);
  assert.ok(Array.isArray(r.datos.data));
  assert.ok(r.datos.data.length >= 2);
  assert.ok(r.datos.pagination);
  assert.equal(typeof r.datos.pagination.total, 'number');
  const p = r.datos.data.find((x) => x.id === problemaId);
  assert.ok(p);
  assert.equal(p.descripcion, 'La app se traba al traducir audio de larga duracion');
  assert.equal(p.categoria, 'Error de traduccion');
  assert.equal(p.contacto, 'yo@mail.com');
  assert.equal(p.estado, 'abierto');
  assert.ok(p.reportado_por);
  assert.ok(p.fecha);
});

test('problemas: admin filtra por estado', async () => {
  const r = await api('GET', '/admin/problemas?estado=abierto', null, tokenAdmin);
  assert.equal(r.estado, 200);
  assert.ok(r.datos.data.every((p) => p.estado === 'abierto'));
});

test('problemas: admin resuelve un problema con PATCH (estado valido)', async () => {
  const r = await api('PATCH', `/admin/problemas/${problemaId}`, { estado: 'revisado', nota_admin: 'Se tomo nota del problema' }, tokenAdmin);
  assert.equal(r.estado, 200);
  assert.equal(r.datos.estado, 'revisado');
  assert.equal(r.datos.nota_admin, 'Se tomo nota del problema');
  assert.equal(r.datos.id, problemaId);
});

test('problemas: PATCH con estado invalido da 400', async () => {
  const r = await api('PATCH', `/admin/problemas/${problemaId}`, { estado: 'invalido' }, tokenAdmin);
  assert.equal(r.estado, 400);
  assert.match(r.datos.message, /estado/);
});

test('problemas: PATCH a problema inexistente da 404', async () => {
  const r = await api('PATCH', '/admin/problemas/no-existe-este-id', { estado: 'revisado' }, tokenAdmin);
  assert.equal(r.estado, 404);
});

test('problemas: cliente no puede hacer PATCH en /admin/problemas (403)', async () => {
  const r = await api('PATCH', `/admin/problemas/${problemaId}`, { estado: 'descartado' }, tokenCliente);
  assert.equal(r.estado, 403);
});
