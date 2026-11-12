const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TALKLATE_LOGS = 'silencio';
const { traducirLocal } = require('../../src/adaptadores/traduccion/reglas');
const { crearMotorClaude } = require('../../src/adaptadores/traduccion/claude');
const { crearMotorVertex } = require('../../src/adaptadores/traduccion/vertex');
const { crearMotorQwen } = require('../../src/adaptadores/traduccion/qwen');
const { crearServicioTraduccion } = require('../../src/aplicacion/traduccion');
const { crearMotores, crearTraduccion } = require('../../src/composicion');
const { detectarIdioma, detectarTono, detectarRegionOrigen } = require('../../src/dominio/analisis');
const V = require('../../src/dominio/validaciones');
const log = require('../../src/compartido/log');
const { analizarProsodia, combinarTono } = require('../../src/dominio/prosodia');
const { crearTranscriptorWhisper } = require('../../src/adaptadores/transcripcion/whisper');

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

test('motor de reglas: solo adapta modismos del diccionario; sin coincidencias falla honesto (no "¿eat go?")', async () => {
  const { crearMotorReglas } = require('../../src/adaptadores/traduccion/reglas');
  const motor = crearMotorReglas();
  const base = { origen: { codigo: 'es' }, destino: { codigo: 'en' }, regionDestino: { paisCodigo: 'US' }, tonos: ['Neutral'] };
  // con un modismo ("ponerse las pilas") responde normalmente
  const r = await motor.traducir({ ...base, texto: 'Hay que ponerse las pilas con el trabajo' });
  assert.equal(r.traduccion, 'We need to get cracking on the work');
  // sin ningun modismo seria palabra-por-palabra: falla honesto en vez de entregar basura
  await assert.rejects(motor.traducir({ ...base, texto: 'Hola, ¿cómo vas? ¿Cómo vas a ir?' }), /solo adapta modismos/);
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

test('adaptador Vertex traduce con Sonnet por el SDK de Google (ADC) y lee el JSON de respuesta', async () => {
  let enviado, opcionesEnviadas;
  const clienteFalso = {
    messages: {
      create: async (op, opciones) => {
        enviado = op;
        opcionesEnviadas = opciones;
        return { content: [{ text: '{"traduccion":"Hey buddy","tono":"Amigable","nota_cultural":"parce se adapta a buddy","region_origen":"Antioquia"}' }] };
      },
    },
  };
  const motor = crearMotorVertex({ cliente: clienteFalso, modelo: 'claude-sonnet-4-6' });
  assert.equal(motor.disponible(), true);
  const r = await motor.traducir({ texto: 'Parce', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'California', paisCodigo: 'US' }, tonos: ['Neutral', 'Amigable'] });
  assert.equal(r.traduccion, 'Hey buddy');
  assert.equal(r.tono, 'Amigable');
  assert.equal(enviado.model, 'claude-sonnet-4-6');
  assert.deepEqual(opcionesEnviadas, { timeout: 30000, maxRetries: 0 }); // acotado y sin reintentos del SDK
  assert.match(enviado.messages[0].content, /California/);
  assert.equal(motor.etiqueta(), 'vertex:claude-sonnet-4-6');
  assert.equal(crearMotorVertex({}).disponible(), false); // sin proyecto ni cliente no se usa
  // el cliente del SDK se construye perezosamente: nunca en el factory, solo cuando hace falta traducir
  let construido = 0;
  const perezoso = crearMotorVertex({ proyecto: 'cerebro-481401', crearCliente: () => { construido += 1; return clienteFalso; } });
  assert.equal(construido, 0);
  await perezoso.traducir({ texto: 'Parce', origen: { codigo: 'es' }, destino: { codigo: 'en' }, tonos: ['Neutral', 'Amigable'] });
  assert.equal(construido, 1);
});

test('composicion: con ANTHROPIC_USE_VERTEX el motor Claude se sirve por Vertex (ADC, sin API key)', () => {
  const env = { TRADUCTOR: 'claude', ANTHROPIC_USE_VERTEX: '1', ANTHROPIC_VERTEX_PROJECT_ID: 'cerebro-481401', ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4-6' };
  const [claude] = crearMotores(env);
  assert.equal(claude.nombre, 'claude');
  assert.equal(claude.disponible(), true);
  assert.equal(claude.etiqueta(), 'vertex:claude-sonnet-4-6');
  // sin la bandera sigue siendo la API directa de Anthropic (que necesita ANTHROPIC_API_KEY)
  const [claudeApi] = crearMotores({ TRADUCTOR: 'claude', ANTHROPIC_API_KEY: 'k' });
  assert.match(claudeApi.etiqueta(), /^claude:/);
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
const ENTRADA = { texto: 'Hay que ponerse las pilas con el trabajo', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'New York', paisCodigo: 'US' }, tonos: ['Neutral', 'Preocupado'] };
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

test('caso de uso de traduccion: pasa el genero que detecta el motor (no lo descarta)', async () => {
  const conGenero = motorFalso('ia', () => ({ traduccion: 'done', nota: null, aproximada: false, tono: 'Neutral', genero: 'mujer' }));
  assert.equal((await crearServicioTraduccion({ motores: [conGenero], log }).traducir(ENTRADA)).genero, 'mujer');
  const sinGenero = motorFalso('ia2', () => ({ traduccion: 'done', nota: null, aproximada: false }));
  assert.equal((await crearServicioTraduccion({ motores: [sinGenero], log }).traducir(ENTRADA)).genero, null);
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
  const { crearSintetizadorAzure, ssml } = require('../../src/adaptadores/sintesis/azure');
  const { crearSintetizadorOpenAI } = require('../../src/adaptadores/sintesis/openai');
  const { crearServicioVoz } = require('../../src/aplicacion/voz');
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

test('voz natural: OpenAI-compat manda la instruccion de emocion en el cuerpo', async () => {
  const { crearSintetizadorOpenAI } = require('../../src/adaptadores/sintesis/openai');
  let pedido;
  const fetchFn = async (url, op) => { pedido = { url, op }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const s = crearSintetizadorOpenAI({ url: 'http://127.0.0.1:8880/v1', apiKey: 'k', fetchFn });
  assert.equal(s.disponible(), true);
  const r = await s.sintetizar({ texto: 'que bien', idioma: 'es', tono: 'Alegre', ritmo: 1 });
  assert.equal(r.tipo, 'audio/mpeg');
  assert.equal(pedido.op.headers.Authorization, 'Bearer k');
  const cuerpo = JSON.parse(pedido.op.body);
  assert.match(cuerpo.instructions || cuerpo.instruct || '', /alegria/);
  assert.equal(crearSintetizadorOpenAI({}).disponible(), false);
});

test('voz natural: ElevenLabs elige el voice_id por locale y manda la emocion en voice_settings', async () => {
  const { crearSintetizadorElevenLabs } = require('../../src/adaptadores/sintesis/elevenlabs');
  let pedido;
  const fetchFn = async (url, op) => { pedido = { url, op }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const voces = { 'es-CO': 'paisa123', 'en-US': 'miami456', default: 'def' };
  const s = crearSintetizadorElevenLabs({ apiKey: 'k', voces, fetchFn });
  assert.equal(s.disponible(), true);
  const r = await s.sintetizar({ texto: 'que rabia', idioma: 'es', pais: 'Colombia', tono: 'Enojado', ritmo: 1 });
  assert.match(pedido.url, /\/text-to-speech\/paisa123\?/);
  assert.equal(pedido.op.headers['xi-api-key'], 'k');
  assert.equal(r.tipo, 'audio/mpeg');
  const cuerpo = JSON.parse(pedido.op.body);
  assert.equal(cuerpo.model_id, 'eleven_multilingual_v2');
  assert.ok(cuerpo.voice_settings.stability < 0.5); // tono expresivo baja la estabilidad
  await s.sintetizar({ texto: 'hi', idioma: 'en', pais: 'Estados Unidos', tono: 'Neutral' });
  assert.match(pedido.url, /\/text-to-speech\/miami456\?/);
  assert.equal(crearSintetizadorElevenLabs({ voces }).disponible(), false); // sin api key
  assert.equal(crearSintetizadorElevenLabs({ apiKey: 'k' }).disponible(), false); // sin voces
  const malo = crearSintetizadorElevenLabs({ apiKey: 'k', voces, fetchFn: async () => ({ ok: false, status: 401 }) });
  await assert.rejects(malo.sintetizar({ texto: 'a', idioma: 'es', pais: 'Colombia', tono: 'Neutral' }), /401/);
});

test('voz natural: ElevenLabs elige la voz por genero del hablante y cae al default', async () => {
  const { crearSintetizadorElevenLabs } = require('../../src/adaptadores/sintesis/elevenlabs');
  let pedido;
  const fetchFn = async (url, op) => { pedido = { url, op }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const voces = { 'es-CO': { hombre: 'paisaH', mujer: 'paisaM' }, 'en-US': { hombre: 'nyH', mujer: 'nyM' } };
  const s = crearSintetizadorElevenLabs({ apiKey: 'k', voces, generoDefault: 'hombre', fetchFn });
  assert.equal(s.disponible(), true);
  await s.sintetizar({ texto: 'estoy cansada', idioma: 'es', pais: 'Colombia', tono: 'Neutral', genero: 'mujer' });
  assert.match(pedido.url, /\/text-to-speech\/paisaM\?/);
  await s.sintetizar({ texto: 'estoy cansado', idioma: 'es', pais: 'Colombia', tono: 'Neutral', genero: 'hombre' });
  assert.match(pedido.url, /\/text-to-speech\/paisaH\?/);
  await s.sintetizar({ texto: 'hola', idioma: 'es', pais: 'Colombia', tono: 'Neutral' }); // sin genero -> default hombre
  assert.match(pedido.url, /\/text-to-speech\/paisaH\?/);
});
