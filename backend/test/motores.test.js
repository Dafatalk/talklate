const test = require('node:test');
const assert = require('node:assert/strict');
const { traducirLocal } = require('../src/lib/motorLocal');
const { traducirClaude } = require('../src/lib/motorClaude');
const { detectarIdioma, detectarTono, detectarRegionOrigen } = require('../src/lib/analisis');
const V = require('../src/lib/validaciones');

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

test('motor Claude arma la peticion y lee el JSON de respuesta', async () => {
  let enviado;
  const fetchFalso = async (url, op) => {
    enviado = { url, op };
    return { ok: true, json: async () => ({ content: [{ text: '{"traduccion":"Hey buddy","tono":"Amigable","nota_cultural":"parce se adapta a buddy","region_origen":"Antioquia"}' }] }) };
  };
  const r = await traducirClaude(
    { texto: 'Parce', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: 'California', tonos: ['Neutral', 'Amigable'] },
    { fetchFn: fetchFalso, apiKey: 'clave-falsa' }
  );
  assert.equal(r.traduccion, 'Hey buddy');
  assert.equal(r.tono, 'Amigable');
  assert.equal(enviado.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(enviado.op.headers['x-api-key'], 'clave-falsa');
  assert.match(JSON.parse(enviado.op.body).messages[0].content, /California/);
});

test('motor Qwen (Ollama) arma la peticion y lee la respuesta', async () => {
  const { traducirQwen } = require('../src/lib/motorQwen');
  let enviado;
  const fetchFalso = async (url, op) => {
    enviado = { url, body: JSON.parse(op.body) };
    return { ok: true, json: async () => ({ message: { content: '```json\n{"traduccion":"We need to get cracking","tono":"Preocupado","nota_cultural":"ponerse las pilas es darse prisa","region_origen":"Antioquia"}\n```' } }) };
  };
  const r = await traducirQwen(
    { texto: 'Hay que ponerse las pilas', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: 'California', tonos: ['Neutral', 'Preocupado'] },
    { fetchFn: fetchFalso }
  );
  assert.equal(r.traduccion, 'We need to get cracking');
  assert.equal(r.tono, 'Preocupado');
  assert.match(enviado.url, /\/api\/chat$/);
  assert.equal(enviado.body.format, 'json');
  assert.equal(enviado.body.stream, false);
  assert.match(enviado.body.messages[0].content, /California/);
});

test('la cadena de motores: Qwen, luego Claude, luego reglas', async () => {
  const antes = { T: process.env.TRADUCTOR, K: process.env.ANTHROPIC_API_KEY };
  process.env.TRADUCTOR = 'auto';
  process.env.ANTHROPIC_API_KEY = 'clave-falsa';
  const traductor = require('../src/lib/traductor');
  const entrada = { texto: 'Hay que ponerse las pilas con el trabajo', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'California', paisCodigo: 'US' }, tonos: ['Neutral', 'Preocupado'] };
  const respuesta = (texto) => ({ ok: true, json: async () => ({ message: { content: texto }, content: [{ text: texto }] }) });
  const llamadas = [];
  try {
    assert.deepEqual(traductor.cadena(), ['qwen', 'claude', 'local']);

    // 1. Qwen responde: no se llama a Claude
    traductor.reiniciarEstado();
    let r = await traductor.traducir(entrada, { fetchFn: async (url) => { llamadas.push(url); return respuesta('{"traduccion":"Qwen dice hola","tono":"Neutral"}'); } });
    assert.equal(r.traduccion, 'Qwen dice hola');
    assert.match(r.motor, /^qwen:/);
    assert.ok(llamadas.every((u) => u.includes('11434')));

    // 2. Qwen esta apagado: responde Claude
    traductor.reiniciarEstado();
    r = await traductor.traducir(entrada, { fetchFn: async (url) => { if (url.includes('11434')) throw new Error('ECONNREFUSED'); return respuesta('{"traduccion":"Claude dice hola","tono":"Neutral"}'); } });
    assert.equal(r.traduccion, 'Claude dice hola');
    assert.match(r.motor, /^claude:/);

    // 3. Ninguno responde: motor de reglas
    traductor.reiniciarEstado();
    r = await traductor.traducir(entrada, { fetchFn: async () => { throw new Error('sin red'); } });
    assert.equal(r.traduccion, 'We need to get cracking on the work');
    assert.equal(r.motor, 'local');

    // 4. Tras un fallo no se espera de nuevo a Qwen (se salta por un minuto)
    const intentos = [];
    r = await traductor.traducir(entrada, { fetchFn: async (url) => { intentos.push(url); throw new Error('sin red'); } });
    assert.equal(intentos.length, 0);

    // un idioma que solo entiende la IA no se puede traducir con reglas
    traductor.reiniciarEstado();
    await assert.rejects(traductor.traducir({ ...entrada, destino: { codigo: 'fr', nombre: 'Frances' } }, { fetchFn: async () => { throw new Error('sin red'); } }));
  } finally {
    traductor.reiniciarEstado();
    if (antes.T === undefined) delete process.env.TRADUCTOR; else process.env.TRADUCTOR = antes.T;
    if (antes.K === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = antes.K;
  }
});
