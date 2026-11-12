const test = require('node:test');
const assert = require('node:assert/strict');
const { buscarTerminos, localeDe, GLOSARIO } = require('../../src/adaptadores/traduccion/glosario');
const { armarPrompt } = require('../../src/adaptadores/traduccion/prompt');

test('el glosario carga entradas de ambos locales', () => {
  assert.ok(GLOSARIO.length > 100, 'deberia tener una base extensa');
  assert.ok(GLOSARIO.some((e) => e.locale === 'es-CO'));
  assert.ok(GLOSARIO.some((e) => e.locale === 'en-US'));
  // Invariante del dato: nada se marca como validado por nativo todavia.
  assert.ok(GLOSARIO.every((e) => e.native_validated === false));
});

test('localeDe mapea los idiomas del proyecto', () => {
  assert.equal(localeDe('es'), 'es-CO');
  assert.equal(localeDe('en'), 'en-US');
  assert.equal(localeDe('fr'), null);
});

test('encuentra modismos paisa como palabra completa, sin tildes ni mayusculas', () => {
  const r = buscarTerminos('Quiubo parce, nos tomamos unas polas', 'es-CO');
  const terms = r.map((e) => e.term);
  assert.ok(terms.some((t) => t.includes('parce')));
  assert.ok(terms.some((t) => t.includes('pola')));
});

test('encuentra modismos neoyorquinos', () => {
  const r = buscarTerminos("Yo son, I deadass forgot my keys at the crib", 'en-US');
  const terms = r.map((e) => e.term);
  assert.ok(terms.includes('deadass'));
  assert.ok(terms.includes('crib'));
});

test('no trae modismos del locale equivocado ni falsos positivos por subcadena', () => {
  // "parce" no debe aparecer buscando en en-US; "son" no debe matchear dentro de "person".
  assert.equal(buscarTerminos('Quiubo parce', 'en-US').length, 0);
  assert.ok(!buscarTerminos('That person left', 'en-US').some((e) => e.term === 'son'));
});

test('respeta el limite para no inflar el prompt', () => {
  const texto = 'parce llave bacano chevere berraco camellar pola rumba parche guayabo tinto pilas plata lucas farra';
  assert.ok(buscarTerminos(texto, 'es-CO', { limite: 5 }).length <= 5);
});

test('armarPrompt inyecta el bloque de glosario cuando hay coincidencias', () => {
  const prompt = armarPrompt({
    texto: 'Quiubo parce',
    origen: { codigo: 'es', nombre: 'Espanol' },
    destino: { codigo: 'en', nombre: 'Ingles' },
    tonos: ['Neutral', 'Amigable'],
  });
  assert.match(prompt, /Modismos detectados en el mensaje/);
  assert.match(prompt, /parce/);
});

test('armarPrompt no agrega el bloque si no hay modismos', () => {
  const prompt = armarPrompt({
    texto: 'La mesa es de madera',
    origen: { codigo: 'es', nombre: 'Espanol' },
    destino: { codigo: 'en', nombre: 'Ingles' },
    tonos: ['Neutral'],
  });
  assert.doesNotMatch(prompt, /Modismos detectados en el mensaje/);
});
