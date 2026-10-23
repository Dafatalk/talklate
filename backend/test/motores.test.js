const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TALKLATE_LOGS = 'silencio';
const { traducirLocal } = require('../src/adaptadores/traduccion/reglas');
const { crearMotorClaude } = require('../src/adaptadores/traduccion/claude');
const { crearMotorQwen } = require('../src/adaptadores/traduccion/qwen');
const { crearServicioTraduccion } = require('../src/aplicacion/traduccion');
const { crearMotores, crearTraduccion } = require('../src/composicion');
const { detectarIdioma, detectarTono, detectarRegionOrigen } = require('../src/dominio/analisis');
const V = require('../src/dominio/validaciones');
const log = require('../src/compartido/log');

test('el motor local adapta modismos con variantes por pais destino', () => {
  assert.equal(traducirLocal('Hay que ponerse las pilas con el trabajo', 'es', 'en', 'US').traduccion, 'We need to get cracking on the work');
  assert.equal(traducirLocal('Hey dude, cool!', 'en', 'es', 'CO').traduccion, '¡Oye parce, chévere!');
  assert.equal(traducirLocal('Hey dude, cool!', 'en', 'es', 'MX').traduccion, '¡Oye wey, padre!');
  assert.equal(traducirLocal('Where is the bathroom?', 'en', 'es', 'ES').traduccion, '¿Dónde está el baño?');
  assert.match(traducirLocal('It costs an arm and a leg', 'en', 'es', 'CO').traduccion, /ojo de la cara/);
});

test('el motor local marca como aproximada la traduccion con palabras desconocidas', () => {
  assert.equal(traducirLocal('Hola zzzzz', 'es', 'en', 'US').aproximada, true);
});

test('deteccion de idioma, tono y region', () => {
  assert.equal(detectarIdioma('Quiero ir a la casa de mi amigo'), 'es');
  assert.equal(detectarIdioma('I want to go to my friend house'), 'en');
  assert.equal(detectarIdioma('ok'), null);
  assert.equal(detectarTono('Gracias por todo, parce!'), 'Amigable');
  assert.equal(detectarTono('ESTO ES INACEPTABLE!!'), 'Enojado');
  assert.equal(detectarTono('La mesa es de madera'), 'Neutral');
  assert.equal(detectarRegionOrigen('Parce, que chimba').region, 'Antioquia');
  assert.equal(detectarRegionOrigen('No manches wey').region, 'Ciudad de Mexico');
  assert.equal(detectarRegionOrigen('La mesa es de madera'), null);
});

test('validaciones de usuario y conversacion', () => {
  assert.throws(() => V.validarPassword('abc'));
  assert.equal(V.validarPassword('Abcdef1!'), 'Abcdef1!');
  assert.throws(() => V.validarFechaNacimiento('2999-01-01'));
  assert.throws(() => V.validarFechaNacimiento('2018-01-01', new Date(2026, 9, 1)));
  assert.equal(V.validarFechaNacimiento('2013-10-01', new Date(2026, 9, 1)), '2013-10-01'); // cumple 13 ese dia
  assert.throws(() => V.validarFechaNacimiento('2013-10-02', new Date(2026, 9, 1)));
  assert.equal(V.validarNombreConversacion('  Familia   Medellin '), 'Familia Medellin');
  assert.throws(() => V.validarNombreConversacion('Hola!!'));
});

test('adaptador Claude arma la peticion y lee el JSON de respuesta', async () => {
  let enviado;
  const fetchFalso = async (url, op) => {
    enviado = { url, op };
    return { ok: true, json: async () => ({ content: [{ text: '{"traduccion":"Hey buddy","tono":"Amigable","nota_cultural":"parce se adapta a buddy","region_origen":"Antioquia"}' }] }) };
  };
  const motor = crearMotorClaude({ apiKey: 'clave-falsa', fetchFn: fetchFalso });
  const r = await motor.traducir({ texto: 'Parce', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'California', paisCodigo: 'US' }, tonos: ['Neutral', 'Amigable'] });
  assert.equal(r.traduccion, 'Hey buddy');
  assert.equal(r.tono, 'Amigable');
  assert.equal(enviado.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(enviado.op.headers['x-api-key'], 'clave-falsa');
  assert.match(JSON.parse(enviado.op.body).messages[0].content, /California/);
  assert.equal(crearMotorClaude({}).disponible(), false); // sin clave no se usa
});

test('adaptador Qwen (Ollama) arma la peticion y lee la respuesta', async () => {
  let enviado;
  const fetchFalso = async (url, op) => {
    enviado = { url, body: JSON.parse(op.body) };
    return { ok: true, json: async () => ({ message: { content: '```json\n{"traduccion":"We need to get cracking","tono":"Preocupado","nota_cultural":"ponerse las pilas es darse prisa","region_origen":"Antioquia"}\n```' } }) };
  };
  const motor = crearMotorQwen({ modelo: 'qwen2.5:7b', fetchFn: fetchFalso });
  const r = await motor.traducir({ texto: 'Hay que ponerse las pilas', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'California', paisCodigo: 'US' }, tonos: ['Neutral', 'Preocupado'] });
  assert.equal(r.traduccion, 'We need to get cracking');
  assert.equal(r.tono, 'Preocupado');
  assert.match(enviado.url, /\/api\/chat$/);
  assert.equal(enviado.body.format, 'json');
  assert.equal(enviado.body.stream, false);
  assert.match(enviado.body.messages[0].content, /California/);
  assert.equal(motor.etiqueta(), 'qwen:qwen2.5:7b');
});

// Un motor falso que cumple el puerto MotorTraduccion: el caso de uso se prueba sin red ni HTTP
function motorFalso(nombre, comportamiento, pares = null) {
  const motor = {
    nombre, llamadas: 0,
    etiqueta: () => `falso:${nombre}`,
    disponible: () => true,
    soportaPar: (o, d) => o !== d && (!pares || pares.includes(`${o}>${d}`)),
    async traducir(entrada) { motor.llamadas += 1; return comportamiento(entrada); },
  };
  return motor;
}
const ENTRADA = { texto: 'Hay que ponerse las pilas con el trabajo', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'Miami', paisCodigo: 'US' }, tonos: ['Neutral', 'Preocupado'] };
const falla = () => { throw new Error('sin red'); };

test('caso de uso de traduccion: usa el primer motor que responde y salta los caidos (Circuit Breaker)', async () => {
  let reloj = 1000;
  const a = motorFalso('a', falla);
  const b = motorFalso('b', () => ({ traduccion: 'desde b', nota: null, aproximada: false }));
  const s = crearServicioTraduccion({ motores: [a, b], log, esperaTrasFalloMs: 60000, ahora: () => reloj });
  let r = await s.traducir(ENTRADA);
  assert.equal(r.traduccion, 'desde b');
  assert.equal(r.motor, 'falso:b');
  assert.equal(r.tono, 'Preocupado'); // si el motor no da tono se usa el detectado en el dominio
  assert.equal(a.llamadas, 1);
  r = await s.traducir(ENTRADA); // dentro del minuto no se vuelve a esperar al motor caido
  assert.equal(a.llamadas, 1);
  reloj += 60001; // pasado el minuto se vuelve a intentar
  await s.traducir(ENTRADA);
  assert.equal(a.llamadas, 2);
});

test('caso de uso de traduccion: pares soportados y error cuando ningun motor puede', async () => {
  const soloEsEn = motorFalso('reglas', () => ({ traduccion: 'ok', nota: null, aproximada: true }), ['es>en', 'en>es']);
  const s = crearServicioTraduccion({ motores: [motorFalso('ia', falla), soloEsEn], log });
  assert.equal(s.soportaPar('es', 'fr'), true); // la IA entiende cualquier par
  assert.equal(s.soportaPar('es', 'es'), false);
  await assert.rejects(s.traducir({ ...ENTRADA, destino: { codigo: 'fr', nombre: 'Frances' } }), /Ningun motor/);
  assert.equal((await s.traducir(ENTRADA)).aproximada, true);
  assert.throws(() => crearServicioTraduccion({ motores: [{ nombre: 'roto' }], log }), /no cumple el puerto/);
});

test('composicion: la cadena de motores sale de TRADUCTOR (Qwen, luego Claude, luego reglas)', async () => {
  const conClave = { TRADUCTOR: 'auto', ANTHROPIC_API_KEY: 'clave-falsa' };
  assert.deepEqual(crearMotores(conClave).map((m) => m.nombre), ['qwen', 'claude', 'local']);
  assert.deepEqual(crearTraduccion({ TRADUCTOR: 'auto' }).cadena(), ['qwen', 'local']); // sin clave no hay Claude
  assert.deepEqual(crearTraduccion({ TRADUCTOR: 'local' }).cadena(), ['local']);
  assert.deepEqual(crearTraduccion({ TRADUCTOR: 'qwen' }).cadena(), ['qwen', 'local']);

  const respuesta = (texto) => ({ ok: true, json: async () => ({ message: { content: texto }, content: [{ text: texto }] }) });
  // Qwen responde: no se llama a Claude
  let llamadas = [];
  let s = crearTraduccion(conClave, { fetchFn: async (url) => { llamadas.push(url); return respuesta('{"traduccion":"Qwen dice hola","tono":"Neutral"}'); } });
  let r = await s.traducir(ENTRADA);
  assert.equal(r.traduccion, 'Qwen dice hola');
  assert.match(r.motor, /^qwen:/);
  assert.ok(llamadas.every((u) => u.includes('11434')));
  // Qwen esta apagado: responde Claude
  s = crearTraduccion(conClave, { fetchFn: async (url) => { if (url.includes('11434')) throw new Error('ECONNREFUSED'); return respuesta('{"traduccion":"Claude dice hola","tono":"Neutral"}'); } });
  r = await s.traducir(ENTRADA);
  assert.match(r.motor, /^claude:/);
  // Ninguno responde: motor de reglas
  s = crearTraduccion(conClave, { fetchFn: async () => { throw new Error('sin red'); } });
  r = await s.traducir(ENTRADA);
  assert.equal(r.traduccion, 'We need to get cracking on the work');
  assert.equal(r.motor, 'local');
});
