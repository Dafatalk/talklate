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
const { analizarProsodia, combinarTono } = require('../src/dominio/prosodia');
const { crearTranscriptorWhisper } = require('../src/adaptadores/transcripcion/whisper');

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

test('prosodia: la voz se traduce en intensidad, ritmo y tono; el texto manda si no es neutro', () => {
  const fuertePareja = analizarProsodia({ duracion_ms: 2000, volumen_promedio_db: -12, volumen_max_db: -3, variacion_db: 3 }, 'uno dos tres cuatro cinco seis siete');
  assert.equal(fuertePareja.intensidad, 'alta');
  assert.equal(fuertePareja.ritmo, 'rapido');
  assert.equal(fuertePareja.tono, 'Enojado');
  assert.ok(fuertePareja.ritmoSalida > 1); // la voz de salida tambien va rapido
  assert.equal(analizarProsodia({ duracion_ms: 2000, volumen_promedio_db: -15, variacion_db: 12 }, 'que bien').tono, 'Alegre');
  const bajita = analizarProsodia({ duracion_ms: 4000, volumen_promedio_db: -45, variacion_db: 2 }, 'no se que hacer');
  assert.equal(bajita.tono, 'Preocupado');
  assert.equal(bajita.ritmo, 'lento');
  assert.ok(bajita.ritmoSalida < 1);
  assert.equal(analizarProsodia(null, 'hola'), null);
  assert.equal(analizarProsodia({ duracion_ms: 100 }, 'hola'), null);
  assert.equal(combinarTono('Neutral', fuertePareja), 'Enojado');
  assert.equal(combinarTono('Amigable', fuertePareja), 'Amigable');
  assert.equal(combinarTono('Neutral', null), 'Neutral');
});

test('adaptador Whisper: envia el audio como multipart (API compatible con OpenAI) y lee el texto', async () => {
  let enviado;
  const t = crearTranscriptorWhisper({ url: 'http://localhost:9000/v1/audio/transcriptions', modelo: 'small', apiKey: 'k', fetchFn: async (url, op) => { enviado = { url, op }; return { ok: true, json: async () => ({ text: ' hola parce ' }) }; } });
  assert.equal(t.disponible(), true);
  const r = await t.transcribir({ audio: Buffer.from('abc'), tipo: 'audio/m4a', idioma: 'es' });
  assert.equal(r.texto, 'hola parce');
  assert.equal(enviado.op.headers.Authorization, 'Bearer k');
  assert.equal(enviado.op.body.get('model'), 'small');
  assert.equal(enviado.op.body.get('language'), 'es');
  assert.equal(enviado.op.body.get('file').name, 'mensaje.m4a');
  const sinUrl = crearTranscriptorWhisper({});
  assert.equal(sinUrl.disponible(), false);
  await assert.rejects(sinUrl.transcribir({ audio: Buffer.from('a') }), (e) => e.estado === 503);
  const falla = crearTranscriptorWhisper({ url: 'http://x', fetchFn: async () => ({ ok: false, status: 500 }) });
  await assert.rejects(falla.transcribir({ audio: Buffer.from('a') }), /500/);
});

test('voz natural: Azure pone la emocion en SSML y OpenAI la pide como instruccion', async () => {
  const { crearSintetizadorAzure, ssml } = require('../src/adaptadores/sintesis/azure');
  const { crearSintetizadorOpenAI } = require('../src/adaptadores/sintesis/openai');
  const { crearServicioVoz } = require('../src/aplicacion/voz');
  const enojo = ssml({ texto: 'No <puedo> creerlo', idioma: 'en', pais: 'Estados Unidos', tono: 'Enojado', ritmo: 1 });
  assert.equal(enojo.voz, 'en-US-JennyNeural');
  assert.match(enojo.xml, /style="angry"/);
  assert.match(enojo.xml, /No &lt;puedo&gt; creerlo/);
  assert.match(enojo.xml, /rate="\+12%"/);
  const neutral = ssml({ texto: 'hola', idioma: 'es', pais: 'Colombia', tono: 'Neutral' });
  assert.equal(neutral.voz, 'es-CO-SalomeNeural');
  assert.doesNotMatch(neutral.xml, /express-as/);
  let pedido;
  const az = crearSintetizadorAzure({ clave: 'k', region: 'eastus', fetchFn: async (url, op) => { pedido = { url, op }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(3) }; } });
  const r = await az.sintetizar({ texto: 'que bien', idioma: 'es', pais: 'Mexico', tono: 'Alegre' });
  assert.equal(r.audio.length, 3);
  assert.match(pedido.url, /eastus\.tts\.speech\.microsoft\.com/);
  assert.match(pedido.op.body, /cheerful/);
  assert.equal(crearSintetizadorAzure({}).disponible(), false);
  let cuerpo;
  const oa = crearSintetizadorOpenAI({ url: 'http://x/v1/audio/speech', apiKey: 'k', fetchFn: async (_u, op) => { cuerpo = JSON.parse(op.body); return { ok: true, arrayBuffer: async () => new ArrayBuffer(2) }; } });
  await oa.sintetizar({ texto: 'hola', idioma: 'es', pais: 'Colombia', tono: 'Alegre', ritmo: 1 });
  assert.equal(cuerpo.model, 'gpt-4o-mini-tts');
  assert.match(cuerpo.instructions, /alegria/);
  assert.match(cuerpo.instructions, /colombiano/);
  // el servicio pasa al siguiente motor si uno falla, y sin motores responde 503
  const avisos = [];
  const voz = crearServicioVoz({ log: { advertencia: (e) => avisos.push(e) }, sintetizadores: [
    { nombre: 'malo', disponible: () => true, sintetizar: async () => { throw new Error('caido'); } },
    { nombre: 'bueno', disponible: () => true, sintetizar: async () => ({ audio: Buffer.from('a'), tipo: 'audio/mpeg' }) },
  ] });
  assert.equal((await voz.sintetizar({ texto: 'hola', idioma: 'es' })).motor, 'bueno');
  assert.deepEqual(avisos, ['sintesis_fallida']);
  await assert.rejects(crearServicioVoz({ log: {} }).sintetizar({ texto: 'hola', idioma: 'es' }), (e) => e.estado === 503);
});

test('voz natural: VoiceStudio manda el vector de emocion a IndexTTS 2 y la instruccion a otros motores', async () => {
  const { crearSintetizadorVoiceStudio } = require('../src/adaptadores/sintesis/voicestudio');
  let pedido;
  const fetchFn = async (url, op) => { pedido = { url, op }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const idx = crearSintetizadorVoiceStudio({ url: 'http://127.0.0.1:3900/', perfil: 'demo', apiKey: 'k', fetchFn });
  assert.equal(idx.disponible(), true);
  const r = await idx.sintetizar({ texto: 'Estoy furioso', idioma: 'es', tono: 'Enojado', ritmo: 1 });
  assert.equal(pedido.url, 'http://127.0.0.1:3900/generate');
  assert.equal(r.tipo, 'audio/wav');
  assert.equal(pedido.op.headers.Authorization, 'Bearer k');
  assert.equal(pedido.op.body.get('engine'), 'indextts2');
  assert.equal(pedido.op.body.get('language'), 'es');
  assert.equal(pedido.op.body.get('profile_id'), 'demo');
  assert.deepEqual(JSON.parse(pedido.op.body.get('emo_vector')), [0, 0.85, 0, 0, 0.1, 0, 0, 0]);
  await idx.sintetizar({ texto: 'hola', idioma: 'es', tono: 'Neutral' });
  assert.equal(pedido.op.body.get('emo_vector'), null); // neutral: sin emocion forzada
  const cosy = crearSintetizadorVoiceStudio({ url: 'http://127.0.0.1:3900', motor: 'cosyvoice', fetchFn });
  const c = await cosy.sintetizar({ texto: 'que bien', idioma: 'es', tono: 'Alegre' });
  assert.equal(pedido.url, 'http://127.0.0.1:3900/v1/audio/speech');
  assert.equal(c.tipo, 'audio/mpeg');
  const cuerpo = JSON.parse(pedido.op.body);
  assert.equal(cuerpo.model, 'cosyvoice');
  assert.match(cuerpo.instruct, /alegria/);
  assert.equal(crearSintetizadorVoiceStudio({}).disponible(), false);
  const malo = crearSintetizadorVoiceStudio({ url: 'http://x', fetchFn: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(malo.sintetizar({ texto: 'a', idioma: 'es', tono: 'Neutral' }), /503/);
});
