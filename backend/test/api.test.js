process.env.TRADUCTOR = 'local';
process.env.JWT_SECRET = 'prueba';
process.env.CORREO_MODO = 'consola';
process.env.TALKLATE_LOGS = 'silencio';
process.env.LIMITE_MENSAJES_POR_MINUTO = '1000';
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearApp } = require('../src/app');

// TEST_DB_DRIVER=surreal corre la misma suite contra un SurrealDB real (ver npm run test:surreal);
// por defecto usa SQLite en memoria. Cada corrida en SurrealDB usa un namespace nuevo.
const DRIVER = (process.env.TEST_DB_DRIVER || 'sqlite').toLowerCase();
function crearRepo() {
  if (DRIVER === 'surreal') {
    // Las pruebas crean y borran datos: sin SURREAL_URL explicita usan un SurrealDB local, no el remoto
    process.env.SURREAL_URL = process.env.SURREAL_URL || 'http://127.0.0.1:8000';
    process.env.SURREAL_NS = process.env.SURREAL_NS || `prueba_${Date.now()}`;
    return require('../src/repos/surreal')();
  }
  const { abrir } = require('../src/db');
  return require('../src/repos/sqlite')(abrir(':memory:'));
}

const ADMIN = { correo: 'dafa123.daf@gmail.com', password: 'Admin123!' };
let servidor, raiz, base, repo;
test.before(async () => {
  repo = crearRepo();
  await repo.inicializar();
  servidor = crearApp(repo).listen(0);
  await new Promise((r) => servidor.once('listening', r));
  raiz = `http://127.0.0.1:${servidor.address().port}`;
  base = `${raiz}/api/v1`;
});
test.after(() => servidor.close());

async function api(metodo, ruta, cuerpo, token, cabeceras = {}) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...cabeceras },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  return { estado: r.status, datos: texto ? JSON.parse(texto) : null, cabeceras: r.headers };
}

const usuarioBase = { nombre: 'Julian', apellido: 'Diaz', correo: 'julian@correo.com', password: 'Clave123!', fecha_nacimiento: '2002-04-16', acepta_tratamiento_datos: true };
let token, refresco, catalogoDatos, conversacion;

test('health, documentacion y formato de error de la convencion', async () => {
  const h = await fetch(`${raiz}/health`);
  assert.equal(h.status, 200);
  assert.equal((await h.json()).ok, true);
  const docs = await fetch(`${base}/openapi.yaml`);
  assert.match(await docs.text(), /openapi: 3/);
  const e = await api('GET', '/no-existe');
  assert.equal(e.estado, 404);
  assert.deepEqual(Object.keys(e.datos).sort(), ['error', 'message', 'path', 'statusCode', 'timestamp']);
  assert.equal(e.datos.path, '/api/v1/no-existe');
});

test('CORS solo para origenes permitidos', async () => {
  const ok = await fetch(`${raiz}/health`, { headers: { origin: 'http://localhost:8081' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const no = await fetch(`${raiz}/health`, { headers: { origin: 'http://sitio-malo.com' } });
  assert.equal(no.headers.get('access-control-allow-origin'), null);
});

test('registro: validaciones, consentimiento y edad (Usuario-RN-1 a RN-4, Ley 1581)', async () => {
  assert.equal((await api('POST', '/auth/registro', { ...usuarioBase, correo: 'malo' })).estado, 400);
  assert.equal((await api('POST', '/auth/registro', { ...usuarioBase, password: 'debil' })).estado, 400);
  const sinConsentimiento = await api('POST', '/auth/registro', { ...usuarioBase, acepta_tratamiento_datos: false });
  assert.equal(sinConsentimiento.estado, 422);
  assert.match(sinConsentimiento.datos.message, /tratamiento de datos/);
  const menor = await api('POST', '/auth/registro', { ...usuarioBase, fecha_nacimiento: `${new Date().getFullYear() - 10}-01-01` });
  assert.equal(menor.estado, 422);
  assert.match(menor.datos.message, /13 anos/);
  const ok = await api('POST', '/auth/registro', usuarioBase);
  assert.equal(ok.estado, 201);
  assert.equal(ok.cabeceras.get('location'), '/api/v1/usuarios/yo');
  assert.ok(ok.datos.token && ok.datos.token_refresco);
  assert.equal((await repo.usuarios.porCorreo(usuarioBase.correo)).consentimiento_datos.length > 0, true);
  assert.equal((await api('POST', '/auth/registro', usuarioBase)).estado, 409);
});

test('login, usuario autenticado y token de refresco que se rota', async () => {
  assert.equal((await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'otra' })).estado, 401);
  const ok = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: usuarioBase.password });
  assert.equal(ok.estado, 200);
  assert.equal((await api('GET', '/usuarios/yo', null, ok.datos.token)).datos.correo, usuarioBase.correo);
  assert.equal((await api('GET', '/conversaciones')).estado, 401);
  const nuevo = await api('POST', '/auth/refrescar', { token_refresco: ok.datos.token_refresco });
  assert.equal(nuevo.estado, 200);
  assert.notEqual(nuevo.datos.token_refresco, ok.datos.token_refresco);
  assert.equal((await api('POST', '/auth/refrescar', { token_refresco: ok.datos.token_refresco })).estado, 401); // el usado ya no sirve
  // Dos pedidos al mismo tiempo con el mismo token: solo uno obtiene sesion nueva
  const otra = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: usuarioBase.password });
  const dobles = await Promise.all([1, 2].map(() => api('POST', '/auth/refrescar', { token_refresco: otra.datos.token_refresco })));
  assert.deepEqual(dobles.map((d) => d.estado).sort(), [200, 401]);
  token = nuevo.datos.token;
  refresco = nuevo.datos.token_refresco;
});

test('recuperar contrasena con codigo (Usuario-RN-6 a RN-9)', async () => {
  assert.equal((await api('POST', '/auth/recuperar', { correo: 'nadie@correo.com' })).estado, 404);
  const rec = await api('POST', '/auth/recuperar', { correo: usuarioBase.correo });
  assert.equal(rec.estado, 200);
  assert.match(rec.datos.codigo_dev, /^\d{6}$/);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: '000000', password: 'Nueva123!' })).estado, 422);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'floja' })).estado, 400);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'Nueva123!' })).estado, 200);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'Otra1234!' })).estado, 422);
  assert.equal((await api('POST', '/auth/refrescar', { token_refresco: refresco })).estado, 401); // cambiar la clave cierra otras sesiones
  const login = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'Nueva123!' });
  assert.equal(login.estado, 200);
  token = login.datos.token;
  refresco = login.datos.token_refresco;
});

test('catalogo: solo idiomas activos con sus regiones', async () => {
  const r = await api('GET', '/catalogo', null, token);
  assert.deepEqual(r.datos.idiomas.map((i) => i.codigo).sort(), ['en', 'es']);
  assert.ok(r.datos.idiomas.find((i) => i.codigo === 'es').regiones.some((x) => x.nombre === 'Antioquia'));
  assert.ok(r.datos.entonaciones.length >= 5);
  catalogoDatos = r.datos;
});

test('crear conversacion: region valida (Conversacion-RN-1, 422), nombre (RN-4, 400) y Location', async () => {
  const en = catalogoDatos.idiomas.find((i) => i.codigo === 'en');
  const es = catalogoDatos.idiomas.find((i) => i.codigo === 'es');
  const antioquia = es.regiones.find((x) => x.nombre === 'Antioquia');
  const miami = en.regiones.find((x) => x.nombre === 'Miami');
  assert.equal((await api('POST', '/conversaciones', { idioma_destino_id: en.id, region_destino_id: antioquia.id }, token)).estado, 422);
  assert.equal((await api('POST', '/conversaciones', { nombre: 'ab', idioma_destino_id: en.id, region_destino_id: miami.id }, token)).estado, 400);
  assert.equal((await api('POST', '/conversaciones', { nombre: 'Hola @#$', idioma_destino_id: en.id, region_destino_id: miami.id }, token)).estado, 400);
  const ok = await api('POST', '/conversaciones', { idioma_destino_id: en.id, region_destino_id: miami.id }, token);
  assert.equal(ok.estado, 201);
  assert.equal(ok.cabeceras.get('location'), `/api/v1/conversaciones/${ok.datos.id}`);
  assert.equal(ok.datos.nombre, 'Nueva Conversacion');
  assert.equal(ok.datos.configuracion.origen, null);
  conversacion = ok.datos;
});

test('el interlocutor no puede hablar antes de que se reconozca el idioma del usuario (422)', async () => {
  assert.equal((await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'Hello', remitente: 'interlocutor' }, token)).estado, 422);
});

test('mensaje por voz: reconoce el idioma, adapta el modismo, entrega por el mismo canal y guarda cifrado', async () => {
  const r = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'Hay que ponerse las pilas con el trabajo', canal: 'voz' }, token);
  assert.equal(r.estado, 201);
  assert.match(r.cabeceras.get('location'), new RegExp(`/conversaciones/${conversacion.id}/mensajes/`));
  assert.equal(r.datos.mensaje.traduccion.contenido, 'We need to get cracking on the work');
  assert.match(r.datos.mensaje.traduccion.nota_cultural, /ponerse las pilas/);
  assert.equal(r.datos.mensaje.tono, 'Preocupado');
  assert.equal(r.datos.entrega.reproducir_audio, true);
  assert.equal(r.datos.configuracion.origen.codigo, 'es'); // Conversacion-RN-2
  const crudo = (await repo.mensajes.deConversacion(conversacion.id)).find((m) => m.id === r.datos.mensaje.id).contenido;
  assert.match(crudo, /^enc:v1:/);
  assert.ok(!crudo.includes('pilas'));
  const uno = await api('GET', `/conversaciones/${conversacion.id}/mensajes/${r.datos.mensaje.id}`, null, token);
  assert.equal(uno.datos.contenido, 'Hay que ponerse las pilas con el trabajo');
});

test('mensaje por texto y respuesta del interlocutor en su idioma', async () => {
  const t = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'Hola, buenos dias', canal: 'texto' }, token);
  assert.equal(t.datos.entrega.reproducir_audio, false);
  assert.equal(t.datos.mensaje.traduccion.contenido, 'Hello, good morning');
  assert.equal((await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'x', canal: 'fax' }, token)).estado, 400);
  const resp = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: "Let's start now", remitente: 'interlocutor' }, token);
  assert.equal(resp.estado, 201);
  assert.match(resp.datos.mensaje.traduccion.contenido, /Empecemos de una/i);
  assert.equal(resp.datos.entrega.idioma_codigo, 'es');
});

test('historial paginado, abrir y renombrar', async () => {
  const lista = await api('GET', '/conversaciones?page=1&limit=10', null, token);
  assert.equal(lista.datos.pagination.total, 1);
  assert.equal(lista.datos.data[0].total_mensajes, 3);
  assert.equal(lista.datos.data[0].ultimo_mensaje.contenido, "Let's start now");
  const abierta = await api('GET', `/conversaciones/${conversacion.id}`, null, token);
  assert.equal(abierta.datos.mensajes.length, 3);
  assert.equal((await api('PATCH', `/conversaciones/${conversacion.id}`, { nombre: 'idiota total' }, token)).estado, 400);
  const ok = await api('PATCH', `/conversaciones/${conversacion.id}`, { nombre: 'Equipo de trabajo' }, token);
  assert.equal(ok.datos.nombre, 'Equipo de trabajo');
});

test('una persona no puede ver conversaciones de otra', async () => {
  const otro = await api('POST', '/auth/registro', { ...usuarioBase, correo: 'otro@correo.com' });
  assert.equal((await api('GET', `/conversaciones/${conversacion.id}`, null, otro.datos.token)).estado, 404);
  assert.equal((await api('GET', '/conversaciones', null, otro.datos.token)).datos.pagination.total, 0);
});

test('reportar una mala traduccion y revisarla como administrador', async () => {
  const abierta = await api('GET', `/conversaciones/${conversacion.id}`, null, token);
  const destinoId = abierta.datos.mensajes[0].traduccion.id;
  assert.equal((await api('POST', '/reportes', { mensaje_destino_id: destinoId, motivo: 'x' }, token)).estado, 400);
  const rep = await api('POST', '/reportes', { mensaje_destino_id: destinoId, motivo: 'Suena muy formal', sugerencia: 'We need to hustle' }, token);
  assert.equal(rep.estado, 201);
  assert.equal(rep.cabeceras.get('location'), `/api/v1/admin/reportes/${rep.datos.id}`);
  assert.equal((await api('POST', '/reportes', { mensaje_destino_id: destinoId, motivo: 'Suena muy formal' }, token)).estado, 409);
  assert.equal((await api('GET', '/admin/reportes', null, token)).estado, 403);
  const admin = await api('POST', '/auth/login', ADMIN);
  const lista = await api('GET', '/admin/reportes?estado=abierto', null, admin.datos.token);
  assert.equal(lista.datos.pagination.total, 1);
  assert.equal(lista.datos.data[0].original, 'Hay que ponerse las pilas con el trabajo');
  assert.equal((await api('GET', `/admin/reportes/${rep.datos.id}`, null, admin.datos.token)).datos.motivo, 'Suena muy formal');
  const cambio = await api('PATCH', `/admin/reportes/${rep.datos.id}`, { estado: 'revisado', nota_admin: 'Se agrega al glosario' }, admin.datos.token);
  assert.equal(cambio.datos.estado, 'revisado');
  assert.equal((await api('PATCH', `/admin/reportes/${rep.datos.id}`, { estado: 'otro' }, admin.datos.token)).estado, 400);
});

test('el administrador agrega un idioma + region, lo activa/desactiva; el cliente no puede', async () => {
  const admin = await api('POST', '/auth/login', ADMIN);
  // Fixture propio del test: un idioma inactivo con su region (no depende del seed)
  const nuevo = await api('POST', '/admin/idiomas', { nombre: 'Italiano', codigo: 'it', activo: false }, admin.datos.token);
  assert.equal(nuevo.estado, 201);
  assert.equal(nuevo.cabeceras.get('location'), `/api/v1/admin/idiomas/${nuevo.datos.id}`);
  assert.equal((await api('GET', `/admin/idiomas/${nuevo.datos.id}`, null, admin.datos.token)).datos.codigo, 'it');
  assert.equal((await api('POST', '/admin/idiomas', { nombre: 'Italiano', codigo: 'it' }, admin.datos.token)).estado, 409);
  const reg = await api('POST', '/admin/regiones', { nombre: 'Lombardia', pais: 'Italia', pais_codigo: 'IT', idiomas: [nuevo.datos.id] }, admin.datos.token);
  assert.equal(reg.estado, 201);
  assert.equal((await api('GET', `/admin/regiones/${reg.datos.id}`, null, admin.datos.token)).datos.pais.nombre, 'Italia');
  assert.equal((await api('POST', '/admin/regiones', { nombre: 'Lombardia', pais: 'Italia', idiomas: [] }, admin.datos.token)).estado, 409);
  // El cliente no puede activar un idioma; el administrador si
  assert.equal((await api('PATCH', `/admin/idiomas/${nuevo.datos.id}`, { activo: true }, token)).estado, 403);
  assert.equal((await api('PATCH', `/admin/idiomas/${nuevo.datos.id}`, { activo: true }, admin.datos.token)).datos.activo, true);
  // con solo el motor de reglas, un par que no soporta se rechaza (Conversacion-RN-3, 422)
  const catAct = await api('GET', '/catalogo', null, token);
  const itAct = catAct.datos.idiomas.find((i) => i.codigo === 'it');
  const es = catAct.datos.idiomas.find((i) => i.codigo === 'es');
  assert.equal((await api('POST', '/conversaciones', { idioma_destino_id: itAct.id, region_destino_id: itAct.regiones[0].id, idioma_origen_id: es.id }, token)).estado, 422);
  await api('PATCH', `/admin/idiomas/${nuevo.datos.id}`, { activo: false }, admin.datos.token);
  assert.ok(!(await api('GET', '/catalogo', null, token)).datos.idiomas.some((i) => i.codigo === 'it'));
});

test('eliminar conversacion (204) y cerrar sesion invalida los tokens (Usuario-RN-10)', async () => {
  const del = await api('DELETE', `/conversaciones/${conversacion.id}`, null, token);
  assert.equal(del.estado, 204);
  assert.equal((await api('GET', `/conversaciones/${conversacion.id}`, null, token)).estado, 404);
  assert.equal((await api('POST', '/auth/logout', { token_refresco: refresco }, token)).estado, 204);
  assert.equal((await api('GET', '/usuarios/yo', null, token)).estado, 401);
  assert.equal((await api('POST', '/auth/refrescar', { token_refresco: refresco })).estado, 401);
});

test('eliminar mi cuenta borra todos mis datos (derecho al olvido)', async () => {
  const s = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'Nueva123!' });
  const cat = await api('GET', '/catalogo', null, s.datos.token);
  const en = cat.datos.idiomas.find((i) => i.codigo === 'en');
  const c = await api('POST', '/conversaciones', { idioma_destino_id: en.id, region_destino_id: en.regiones[0].id }, s.datos.token);
  await api('POST', `/conversaciones/${c.datos.id}/mensajes`, { contenido: 'Hola amigo' }, s.datos.token);
  assert.equal((await api('DELETE', '/usuarios/yo', { password: 'mala' }, s.datos.token)).estado, 401);
  assert.equal((await api('DELETE', '/usuarios/yo', { password: 'Nueva123!' }, s.datos.token)).estado, 204);
  assert.equal(await repo.usuarios.porCorreo(usuarioBase.correo), null);
  assert.equal(await repo.conversaciones.porId(c.datos.id), null);
  assert.equal((await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'Nueva123!' })).estado, 401);
  const admin = await api('POST', '/auth/login', ADMIN);
  assert.equal((await api('DELETE', '/usuarios/yo', { password: ADMIN.password }, admin.datos.token)).estado, 409); // unico admin
});
