process.env.TRADUCTOR = 'local';
process.env.JWT_SECRET = 'prueba';
process.env.CORREO_MODO = 'consola';
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrir } = require('../src/db');
const { crearApp } = require('../src/app');

let servidor, base, db;
test.before(async () => {
  db = abrir(':memory:');
  servidor = crearApp(db).listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
test.after(() => servidor.close());

async function api(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, datos: await r.json() };
}

const usuarioBase = { nombre: 'Julian', apellido: 'Diaz', correo: 'julian@correo.com', password: 'Clave123!', fecha_nacimiento: '2002-04-16' };
let token, catalogoDatos, conversacion;

test('registro valida correo, edad y contrasena (Usuario-RN-2 a RN-4)', async () => {
  assert.equal((await api('POST', '/auth/registro', { ...usuarioBase, correo: 'malo' })).estado, 400);
  assert.equal((await api('POST', '/auth/registro', { ...usuarioBase, password: 'debil' })).estado, 400);
  const menor = await api('POST', '/auth/registro', { ...usuarioBase, fecha_nacimiento: `${new Date().getFullYear() - 10}-01-01` });
  assert.equal(menor.estado, 400);
  assert.match(menor.datos.error, /13 anos/);
  const ok = await api('POST', '/auth/registro', usuarioBase);
  assert.equal(ok.estado, 201);
  assert.ok(ok.datos.token);
  token = ok.datos.token;
  assert.equal((await api('POST', '/auth/registro', usuarioBase)).estado, 409); // Usuario-RN-1
});

test('login y sesion', async () => {
  assert.equal((await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'otra' })).estado, 401);
  const ok = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: usuarioBase.password });
  assert.equal(ok.estado, 200);
  assert.equal((await api('GET', '/auth/yo', null, ok.datos.token)).datos.usuario.correo, usuarioBase.correo);
  assert.equal((await api('GET', '/conversaciones')).estado, 401);
});

test('recuperar contrasena con codigo (Usuario-RN-6 a RN-9)', async () => {
  assert.equal((await api('POST', '/auth/recuperar', { correo: 'nadie@correo.com' })).estado, 404);
  const rec = await api('POST', '/auth/recuperar', { correo: usuarioBase.correo });
  assert.equal(rec.estado, 200);
  assert.match(rec.datos.codigo_dev, /^\d{6}$/);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: '000000', password: 'Nueva123!' })).estado, 400);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'floja' })).estado, 400);
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'Nueva123!' })).estado, 200);
  // el codigo ya no sirve y la nueva contrasena si
  assert.equal((await api('POST', '/auth/restablecer', { correo: usuarioBase.correo, codigo: rec.datos.codigo_dev, password: 'Otra1234!' })).estado, 400);
  const login = await api('POST', '/auth/login', { correo: usuarioBase.correo, password: 'Nueva123!' });
  assert.equal(login.estado, 200);
  token = login.datos.token;
});

test('catalogo: solo idiomas activos con sus regiones', async () => {
  const r = await api('GET', '/catalogo', null, token);
  assert.deepEqual(r.datos.idiomas.map((i) => i.codigo).sort(), ['en', 'es']);
  assert.ok(r.datos.idiomas.find((i) => i.codigo === 'es').regiones.some((x) => x.nombre === 'Antioquia'));
  assert.ok(r.datos.entonaciones.length >= 5);
  catalogoDatos = r.datos;
});

test('crear conversacion valida la region del idioma (Conversacion-RN-1) y el nombre (RN-4)', async () => {
  const en = catalogoDatos.idiomas.find((i) => i.codigo === 'en');
  const es = catalogoDatos.idiomas.find((i) => i.codigo === 'es');
  const antioquia = es.regiones.find((x) => x.nombre === 'Antioquia');
  const california = en.regiones.find((x) => x.nombre === 'California');
  assert.equal((await api('POST', '/conversaciones', { idioma_destino_id: en.id, region_destino_id: antioquia.id }, token)).estado, 400);
  assert.equal((await api('POST', '/conversaciones', { nombre: 'ab', idioma_destino_id: en.id, region_destino_id: california.id }, token)).estado, 400);
  assert.equal((await api('POST', '/conversaciones', { nombre: 'Hola @#$', idioma_destino_id: en.id, region_destino_id: california.id }, token)).estado, 400);
  const ok = await api('POST', '/conversaciones', { idioma_destino_id: en.id, region_destino_id: california.id }, token);
  assert.equal(ok.estado, 201);
  assert.equal(ok.datos.conversacion.nombre, 'Nueva Conversacion');
  assert.equal(ok.datos.conversacion.configuracion.origen, null);
  conversacion = ok.datos.conversacion;
});

test('mensaje por voz: detecta el idioma origen, adapta el modismo y entrega por el mismo canal', async () => {
  const r = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'Hay que ponerse las pilas con el trabajo', canal: 'voz' }, token);
  assert.equal(r.estado, 201);
  assert.equal(r.datos.mensaje.traduccion.contenido, 'We need to get cracking on the work');
  assert.match(r.datos.mensaje.traduccion.nota_cultural, /ponerse las pilas/);
  assert.equal(r.datos.mensaje.tono, 'Preocupado');
  assert.equal(r.datos.entrega.reproducir_audio, true);
  assert.equal(r.datos.entrega.idioma_codigo, 'en');
  assert.equal(r.datos.configuracion.origen.codigo, 'es'); // Conversacion-RN-2
});

test('mensaje por texto devuelve texto y el interlocutor responde en su idioma', async () => {
  const t = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: 'Hola, buenos dias', canal: 'texto' }, token);
  assert.equal(t.datos.entrega.reproducir_audio, false);
  assert.equal(t.datos.mensaje.traduccion.contenido, 'Hello, good morning');
  const resp = await api('POST', `/conversaciones/${conversacion.id}/mensajes`, { contenido: "Let's start now", remitente: 'interlocutor' }, token);
  assert.equal(resp.estado, 201);
  assert.match(resp.datos.mensaje.traduccion.contenido, /Empecemos de una/i);
  assert.equal(resp.datos.entrega.idioma_codigo, 'es');
});

test('historial: lista, abre, renombra y valida el nombre', async () => {
  const lista = await api('GET', '/conversaciones', null, token);
  assert.equal(lista.datos.conversaciones.length, 1);
  assert.equal(lista.datos.conversaciones[0].total_mensajes, 3);
  const abierta = await api('GET', `/conversaciones/${conversacion.id}`, null, token);
  assert.equal(abierta.datos.mensajes.length, 3);
  assert.equal(abierta.datos.mensajes[0].contenido, 'Hay que ponerse las pilas con el trabajo');
  assert.equal((await api('PATCH', `/conversaciones/${conversacion.id}`, { nombre: 'idiota total' }, token)).estado, 400);
  const ok = await api('PATCH', `/conversaciones/${conversacion.id}`, { nombre: 'Equipo de trabajo' }, token);
  assert.equal(ok.datos.conversacion.nombre, 'Equipo de trabajo');
});

test('una persona no puede ver conversaciones de otra', async () => {
  const otro = await api('POST', '/auth/registro', { ...usuarioBase, correo: 'otro@correo.com' });
  assert.equal((await api('GET', `/conversaciones/${conversacion.id}`, null, otro.datos.token)).estado, 404);
});

test('reportar mala traduccion y revisarla como administrador', async () => {
  const abierta = await api('GET', `/conversaciones/${conversacion.id}`, null, token);
  const destinoId = abierta.datos.mensajes[0].traduccion.id;
  assert.equal((await api('POST', `/mensajes/${destinoId}/reportar`, { motivo: 'x' }, token)).estado, 400);
  const rep = await api('POST', `/mensajes/${destinoId}/reportar`, { motivo: 'Suena muy formal', sugerencia: "We need to hustle" }, token);
  assert.equal(rep.estado, 201);
  assert.equal((await api('POST', `/mensajes/${destinoId}/reportar`, { motivo: 'Suena muy formal' }, token)).estado, 409);
  assert.equal((await api('GET', '/admin/reportes', null, token)).estado, 403);
  const admin = await api('POST', '/auth/login', { correo: 'dafa123.daf@gmail.com', password: 'Admin123!' });
  const lista = await api('GET', '/admin/reportes?estado=abierto', null, admin.datos.token);
  assert.equal(lista.datos.reportes.length, 1);
  assert.equal(lista.datos.reportes[0].original, 'Hay que ponerse las pilas con el trabajo');
  assert.equal((await api('PATCH', `/admin/reportes/${lista.datos.reportes[0].id}`, { estado: 'revisado', nota_admin: 'Se agrega al glosario' }, admin.datos.token)).estado, 200);
});

test('el administrador activa un idioma y agrega una region; el cliente no puede', async () => {
  const admin = await api('POST', '/auth/login', { correo: 'dafa123.daf@gmail.com', password: 'Admin123!' });
  const todos = await api('GET', '/catalogo?todos=1', null, admin.datos.token);
  const fr = todos.datos.idiomas.find((i) => i.codigo === 'fr');
  assert.equal(fr.activo, false);
  assert.equal((await api('PATCH', `/admin/idiomas/${fr.id}`, { activo: true }, token)).estado, 403);
  assert.equal((await api('PATCH', `/admin/idiomas/${fr.id}`, { activo: true }, admin.datos.token)).estado, 200);
  const nuevo = await api('POST', '/admin/idiomas', { nombre: 'Italiano', codigo: 'it', activo: false }, admin.datos.token);
  assert.equal(nuevo.estado, 201);
  assert.equal((await api('POST', '/admin/idiomas', { nombre: 'Italiano', codigo: 'it' }, admin.datos.token)).estado, 409);
  const reg = await api('POST', '/admin/regiones', { nombre: 'Lombardia', pais: 'Italia', pais_codigo: 'IT', idiomas: [nuevo.datos.idioma.id] }, admin.datos.token);
  assert.equal(reg.estado, 201);
  // con el motor local, un par que no soporta (fr) se rechaza al crear la conversacion (Conversacion-RN-3)
  const catAct = await api('GET', '/catalogo', null, token);
  const frAct = catAct.datos.idiomas.find((i) => i.codigo === 'fr');
  const es = catAct.datos.idiomas.find((i) => i.codigo === 'es');
  const r = await api('POST', '/conversaciones', { idioma_destino_id: frAct.id, region_destino_id: frAct.regiones[0].id, idioma_origen_id: es.id }, token);
  assert.equal(r.estado, 400);
  // desactivar vuelve a ocultarlo
  await api('PATCH', `/admin/idiomas/${fr.id}`, { activo: false }, admin.datos.token);
  assert.ok(!(await api('GET', '/catalogo', null, token)).datos.idiomas.some((i) => i.codigo === 'fr'));
});

test('cerrar sesion invalida el token (Usuario-RN-10) y eliminar borra la conversacion', async () => {
  assert.equal((await api('DELETE', `/conversaciones/${conversacion.id}`, null, token)).estado, 200);
  assert.equal((await api('GET', `/conversaciones/${conversacion.id}`, null, token)).estado, 404);
  assert.equal((await api('POST', '/auth/logout', null, token)).estado, 200);
  assert.equal((await api('GET', '/auth/yo', null, token)).estado, 401);
});
