// Pruebas unitarias de los casos de uso (capa de aplicacion) con dobles de prueba: motores, sintetizadores
// y reloj falsos. Ningun caso toca red, base de datos ni Express; asi se prueba la logica de orquestacion
// (Circuit Breaker, cadena de respaldo, vencimientos) de forma rapida y determinista.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearServicioTraduccion } = require('../../src/aplicacion/traduccion');
const { crearServicioVoz } = require('../../src/aplicacion/voz');
const { paginar } = require('../../src/aplicacion/paginacion');
const { crearServicioProblemas } = require('../../src/aplicacion/problemas');

const silencio = { advertencia() {}, info() {}, error() {} };
const ES = { codigo: 'es', nombre: 'Espanol' };
const EN = { codigo: 'en', nombre: 'Ingles' };

function motorFalso(nombre, { pares = ['es>en', 'en>es'], falla = false, respuesta = {} } = {}) {
  const llamadas = [];
  return {
    nombre, llamadas,
    etiqueta: () => `${nombre}:falso`,
    disponible: () => true,
    soportaPar: (o, d) => pares.includes(`${o}>${d}`),
    async traducir(entrada) {
      llamadas.push(entrada);
      if (falla) throw new Error('caido');
      return { traduccion: `[${nombre}] ${entrada.texto}`, ...respuesta };
    },
  };
}

test('traduccion: el circuito de un motor caido se vuelve a cerrar despues de la espera', async () => {
  let reloj = 0;
  const primero = motorFalso('primero', { falla: true });
  const segundo = motorFalso('segundo');
  const t = crearServicioTraduccion({ motores: [primero, segundo], log: silencio, esperaTrasFalloMs: 1000, ahora: () => reloj });
  const entrada = { texto: 'hola', origen: ES, destino: EN };
  assert.equal((await t.traducir(entrada)).motor, 'segundo:falso');
  await t.traducir(entrada);
  assert.equal(primero.llamadas.length, 1); // circuito abierto: no se intenta otra vez
  reloj = 1001;
  await t.traducir(entrada);
  assert.equal(primero.llamadas.length, 2); // paso la espera: se vuelve a intentar
});

test('traduccion: el tono del motor gana; si no trae, se usa el de las palabras y la voz', async () => {
  const conTono = crearServicioTraduccion({ motores: [motorFalso('m', { respuesta: { tono: 'Formal' } })], log: silencio });
  assert.equal((await conTono.traducir({ texto: 'Estoy harto', origen: ES, destino: EN })).tono, 'Formal');
  const sinTono = crearServicioTraduccion({ motores: [motorFalso('m')], log: silencio });
  assert.equal((await sinTono.traducir({ texto: 'Estoy harto', origen: ES, destino: EN })).tono, 'Enojado');
  const porVoz = await sinTono.traducir({ texto: 'el tren sale', origen: ES, destino: EN, prosodia: { tono: 'Alegre' } });
  assert.equal(porVoz.tono, 'Alegre');
});

test('traduccion: la region de origen se detecta antes de llamar al motor', async () => {
  const m = motorFalso('m');
  const t = crearServicioTraduccion({ motores: [m], log: silencio });
  const r = await t.traducir({ texto: 'Que mas parce', origen: ES, destino: EN });
  assert.equal(m.llamadas[0].regionOrigen, 'Antioquia');
  assert.equal(r.regionOrigen, 'Antioquia');
  assert.equal(r.aproximada, false);
  assert.equal(r.nota, null);
});

test('traduccion: un motor que no soporta el par se salta; mismo idioma no es un par', async () => {
  const soloIngles = motorFalso('solo', { pares: ['en>es'] });
  const t = crearServicioTraduccion({ motores: [soloIngles], log: silencio });
  assert.equal(t.soportaPar('es', 'es'), false);
  assert.equal(t.soportaPar('en', 'es'), true);
  await assert.rejects(t.traducir({ texto: 'hola', origen: ES, destino: EN }), /Ningun motor/);
  assert.equal(soloIngles.llamadas.length, 0);
  assert.throws(() => crearServicioTraduccion({ motores: [], log: silencio }), /al menos un motor/);
});

test('voz: el audio vence despues de su tiempo de vida', async () => {
  const s = { nombre: 's', disponible: () => true, sintetizar: async () => ({ audio: Buffer.from('a'), tipo: 'audio/mpeg' }) };
  const voz = crearServicioVoz({ sintetizadores: [s], log: silencio, vidaMs: 20 });
  const { id } = await voz.sintetizar({ texto: 'hola', idioma: 'es' });
  assert.equal(voz.audio(id).tipo, 'audio/mpeg');
  await new Promise((r) => setTimeout(r, 30));
  assert.throws(() => voz.audio(id), (e) => e.estado === 404);
});

test('voz: guarda como maximo N audios y descarta los mas viejos', async () => {
  const s = { nombre: 's', disponible: () => true, sintetizar: async ({ texto }) => ({ audio: Buffer.from(texto), tipo: 'audio/mpeg' }) };
  const voz = crearServicioVoz({ sintetizadores: [s], log: silencio, maximo: 2 });
  const a = await voz.sintetizar({ texto: 'uno', idioma: 'es' });
  const b = await voz.sintetizar({ texto: 'dos', idioma: 'es' });
  const c = await voz.sintetizar({ texto: 'tres', idioma: 'es' });
  assert.throws(() => voz.audio(a.id), (e) => e.estado === 404);
  assert.equal(voz.audio(b.id).audio.toString(), 'dos');
  assert.equal(voz.audio(c.id).audio.toString(), 'tres');
  assert.match(a.id, /^[0-9a-f]{32}$/);
});

test('voz: valida texto, idioma y tono antes de llamar a un motor', async () => {
  let llamadas = 0;
  const s = { nombre: 's', disponible: () => true, sintetizar: async (e) => { llamadas += 1; return { audio: Buffer.from(e.tono), tipo: 'audio/mpeg' }; } };
  const voz = crearServicioVoz({ sintetizadores: [s], log: silencio });
  await assert.rejects(voz.sintetizar({ texto: 'x'.repeat(1001), idioma: 'es' }), (e) => e.estado === 400);
  await assert.rejects(voz.sintetizar({ texto: 'hola', idioma: 'e' }), (e) => e.estado === 400);
  assert.equal(llamadas, 0);
  const r = await voz.sintetizar({ texto: 'hola', idioma: 'ES', tono: 'Furioso' });
  assert.equal(r.tono, 'Neutral');
  const apagado = { nombre: 'off', disponible: () => false, sintetizar: async () => { throw new Error('no debe llamarse'); } };
  const sinMotores = crearServicioVoz({ sintetizadores: [apagado], log: silencio });
  assert.equal(sinMotores.disponible(), false);
  assert.deepEqual(sinMotores.motores(), []);
});

function crearRepoProblemasDoble() {
  const filas = [];
  return {
    problemas: {
      async crear(p) { filas.push({ ...p, estado: p.estado || 'abierto', nota_admin: null, reportado_por: 'Test Usuario' }); },
      async listar({ estado }) { return estado ? filas.filter((f) => f.estado === estado) : [...filas]; },
      async porId(id) { return filas.find((f) => f.id === id) || null; },
      async actualizar(id, estado, nota) {
        const p = filas.find((f) => f.id === id);
        if (p) { p.estado = estado; p.nota_admin = nota ?? null; }
      },
    },
  };
}

test('problemas: reportar valida la descripcion (5-1000 chars)', async () => {
  const repo = crearRepoProblemasDoble();
  const s = crearServicioProblemas({ repo, log: silencio });
  const usuario = { id: 'u1' };
  await assert.rejects(s.reportar(usuario, { descripcion: '' }), (e) => e.estado === 400);
  await assert.rejects(s.reportar(usuario, { descripcion: 'abc' }), (e) => e.estado === 400);
  await assert.rejects(s.reportar(usuario, { descripcion: 'x'.repeat(1001) }), (e) => e.estado === 400);
  const r = await s.reportar(usuario, { descripcion: 'La app falla cuando uso voz larga' });
  assert.ok(r.id);
  assert.match(r.mensaje, /Gracias/);
});

test('problemas: reportar recorta categoria (max 60) y contacto (max 120)', async () => {
  const repo = crearRepoProblemasDoble();
  const s = crearServicioProblemas({ repo, log: silencio });
  const usuario = { id: 'u1' };
  await s.reportar(usuario, {
    descripcion: 'Error al traducir mensajes de voz en espanol',
    categoria: 'c'.repeat(80),
    contacto: 'k'.repeat(150),
  });
  const guardado = (await repo.problemas.listar({}))[0];
  assert.equal(guardado.categoria.length, 60);
  assert.equal(guardado.contacto.length, 120);
});

test('problemas: listar filtra por estado valido y descarta estados desconocidos', async () => {
  const repo = crearRepoProblemasDoble();
  const s = crearServicioProblemas({ repo, log: silencio });
  const u = { id: 'u1' };
  await s.reportar(u, { descripcion: 'Problema numero uno en la traduccion' });
  await repo.problemas.actualizar((await repo.problemas.listar({}))[0].id, 'revisado', null);
  await s.reportar(u, { descripcion: 'Problema numero dos en la traduccion' });
  const todos = await s.listar(u, undefined);
  assert.equal(todos.length, 2);
  const abiertos = await s.listar(u, 'abierto');
  assert.equal(abiertos.length, 1);
  const revisados = await s.listar(u, 'revisado');
  assert.equal(revisados.length, 1);
  // estado desconocido -> sin filtro
  const sinFiltro = await s.listar(u, 'inventado');
  assert.equal(sinFiltro.length, 2);
});

test('problemas: actualizar valida estado y lanza 404 si no existe', async () => {
  const repo = crearRepoProblemasDoble();
  const s = crearServicioProblemas({ repo, log: silencio });
  const u = { id: 'u1' };
  const { id } = await s.reportar(u, { descripcion: 'Problema para actualizar en este test' });
  await assert.rejects(s.actualizar(u, id, { estado: 'invalido' }), (e) => e.estado === 400);
  await assert.rejects(s.actualizar(u, 'no-existe', { estado: 'revisado' }), (e) => e.estado === 404);
  const r = await s.actualizar(u, id, { estado: 'descartado', nota_admin: 'No es un problema' });
  assert.equal(r.estado, 'descartado');
  assert.equal(r.nota_admin, 'No es un problema');
});

test('paginacion: limites por defecto, maximo de 100 y paginas fuera de rango', () => {
  const lista = Array.from({ length: 45 }, (_, i) => i);
  assert.deepEqual(paginar(lista).pagination, { page: 1, limit: 20, total: 45, totalPages: 3 });
  assert.deepEqual(paginar(lista, { page: '3' }).data, [40, 41, 42, 43, 44]);
  assert.equal(paginar(lista, { limit: '500' }).pagination.limit, 100);
  assert.equal(paginar(lista, { limit: '0' }).pagination.limit, 20);
  assert.equal(paginar(lista, { page: '99' }).pagination.page, 3);
  assert.deepEqual(paginar([], {}).pagination, { page: 1, limit: 20, total: 0, totalPages: 1 });
});
