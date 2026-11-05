// Pruebas unitarias del dominio (base de la piramide): funciones puras, sin red, sin base de datos
// y sin Express. Cada regla de negocio del modelo de datos tiene aqui su caso feliz y sus bordes.
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../../src/dominio/validaciones');
const { detectarIdioma, detectarTono, detectarRegionOrigen, normalizar } = require('../../src/dominio/analisis');
const { analizarProsodia, combinarTono } = require('../../src/dominio/prosodia');
const { localeVoz, vozPara, expresionPara, EXPRESION } = require('../../src/dominio/voz');
const E = require('../../src/dominio/errores');

const HOY = new Date('2026-11-05T12:00:00');
const estado = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.estado; } };

test('Usuario-RN-3: el correo se normaliza y se rechaza si no tiene formato valido', () => {
  assert.equal(V.validarCorreo('  Julian@Correo.COM '), 'julian@correo.com');
  for (const malo of ['', 'sin-arroba', 'a@b', 'a b@c.com', `${'x'.repeat(320)}@c.com`, null]) assert.equal(estado(() => V.validarCorreo(malo)), 400, String(malo).slice(0, 20));
});

test('Usuario-RN-4: la contrasena exige 8 caracteres, mayuscula, numero y simbolo', () => {
  assert.equal(V.validarPassword('Clave123!'), 'Clave123!');
  for (const debil of ['Corta1!', 'sinmayuscula1!', 'SinNumero!', 'SinSimbolo123', 12345678, undefined]) assert.equal(estado(() => V.validarPassword(debil)), 400);
});

test('Usuario-RN-2: edad minima de 13 anos, sin fechas futuras ni formatos invalidos', () => {
  assert.equal(V.calcularEdad('2000-11-05', HOY), 26);
  assert.equal(V.calcularEdad('2000-11-06', HOY), 25); // aun no cumple
  assert.equal(V.calcularEdad('no-es-fecha', HOY), null);
  assert.equal(V.validarFechaNacimiento('2013-11-05', HOY), '2013-11-05'); // cumple 13 hoy
  assert.equal(estado(() => V.validarFechaNacimiento('2013-11-06', HOY)), 422); // le falta un dia
  assert.equal(estado(() => V.validarFechaNacimiento('2030-01-01', HOY)), 400);
  assert.equal(estado(() => V.validarFechaNacimiento('05/11/2000', HOY)), 400);
});

test('nombres de persona: obligatorios y de maximo 50 caracteres', () => {
  assert.equal(V.validarNombrePersona('  Diego ', 'nombre'), 'Diego');
  assert.equal(estado(() => V.validarNombrePersona('', 'nombre')), 400);
  assert.equal(estado(() => V.validarNombrePersona('x'.repeat(51), 'apellido')), 400);
});

test('Conversacion-RN-4: nombre de 3 a 80 caracteres, sin simbolos ni palabras ofensivas', () => {
  assert.equal(V.validarNombreConversacion('  Viaje   a   Miami '), 'Viaje a Miami');
  assert.equal(V.validarNombreConversacion('Reunion con Ana, parte 2'), 'Reunion con Ana, parte 2');
  assert.equal(estado(() => V.validarNombreConversacion('ab')), 400);
  assert.equal(estado(() => V.validarNombreConversacion('x'.repeat(81))), 400);
  assert.equal(estado(() => V.validarNombreConversacion('Hola <script>')), 400);
  assert.equal(estado(() => V.validarNombreConversacion('Chat con el idiota')), 400);
  assert.equal(estado(() => V.validarNombreConversacion('Chat con el IDIÓTA')), 400); // tilde y mayusculas
});

test('contenido del mensaje: de 1 a 5000 caracteres', () => {
  assert.equal(V.validarContenidoMensaje('  hola  '), 'hola');
  assert.equal(V.validarContenidoMensaje('x'.repeat(5000)).length, 5000);
  assert.equal(estado(() => V.validarContenidoMensaje('   ')), 400);
  assert.equal(estado(() => V.validarContenidoMensaje('x'.repeat(5001))), 400);
});

test('deteccion de idioma: senales del espanol y del ingles; empate = no se sabe', () => {
  assert.equal(detectarIdioma('¿Donde queda la estacion?'), 'es');
  assert.equal(detectarIdioma('Mañana'), 'es');
  assert.equal(detectarIdioma('Where is the train station?'), 'en');
  assert.equal(detectarIdioma('Toronto'), null);
  assert.equal(normalizar('ÁRBOL Ñandú'), 'arbol nandu');
});

test('deteccion de tono: cada entonacion del catalogo y el enojo por mayusculas o signos', () => {
  assert.equal(detectarTono('Estoy harto de esto'), 'Enojado');
  assert.equal(detectarTono('ESTO NO PUEDE SER ASI'), 'Enojado');
  assert.equal(detectarTono('No me respondes!!'), 'Enojado');
  assert.equal(detectarTono('Hay un problema urgente'), 'Preocupado');
  assert.equal(detectarTono('Que genial, felicidades'), 'Alegre');
  assert.equal(detectarTono('Hola parce, gracias'), 'Amigable');
  assert.equal(detectarTono('Estimado senor, cordialmente'), 'Formal');
  assert.equal(detectarTono('El tren sale a las cinco'), 'Neutral');
});

test('deteccion de region de origen por regionalismos', () => {
  assert.deepEqual(detectarRegionOrigen('Que mas parce, de una'), { region: 'Antioquia', pais: 'Colombia' });
  assert.deepEqual(detectarRegionOrigen('No manches wey, que chido'), { region: 'Ciudad de Mexico', pais: 'Mexico' });
  assert.deepEqual(detectarRegionOrigen('Che boludo, tengo laburo'), { region: 'Buenos Aires', pais: 'Argentina' });
  assert.deepEqual(detectarRegionOrigen('Cheers mate, that was brilliant'), { region: 'Londres', pais: 'Reino Unido' });
  assert.equal(detectarRegionOrigen('El tren sale a las cinco'), null);
});

test('prosodia: bordes de intensidad, ritmo y expresividad', () => {
  const base = { duracion_ms: 2000, volumen_promedio_db: -30, variacion_db: 4 };
  assert.equal(analizarProsodia({ ...base, volumen_promedio_db: -21 }, 'uno dos tres cuatro').intensidad, 'alta');
  assert.equal(analizarProsodia({ ...base, volumen_max_db: -5 }, 'uno dos tres cuatro').intensidad, 'alta'); // un pico fuerte
  assert.equal(analizarProsodia({ ...base, volumen_promedio_db: -41 }, 'uno dos tres cuatro').intensidad, 'baja');
  assert.equal(analizarProsodia({ duracion_ms: 2000 }, 'uno dos tres cuatro').intensidad, 'media'); // sin medidas de volumen
  assert.equal(analizarProsodia(base, 'a b c d e f g').ritmo, 'rapido'); // 3.5 palabras por segundo
  assert.equal(analizarProsodia(base, 'uno dos tres').ritmo, 'lento'); // 1.5 palabras por segundo
  assert.equal(analizarProsodia(base, 'uno dos tres').tono, 'Formal'); // lento y parejo
  assert.equal(analizarProsodia({ ...base, variacion_db: 9 }, 'uno dos tres cuatro cinco').tono, 'Amigable');
  assert.equal(analizarProsodia({ duracion_ms: 299 }, 'hola'), null); // demasiado corto
  assert.equal(analizarProsodia('no es objeto', 'hola'), null);
});

test('prosodia: la velocidad de salida imita al hablante dentro de un rango natural', () => {
  assert.equal(analizarProsodia({ duracion_ms: 1000 }, 'a b c d e f g h i j').ritmoSalida, 1.2); // tope superior
  assert.equal(analizarProsodia({ duracion_ms: 4000 }, 'uno').ritmoSalida, 0.85); // tope inferior
  assert.equal(analizarProsodia({ duracion_ms: 1000 }, '').ritmoSalida, 1); // sin palabras
  assert.equal(combinarTono(undefined, null), 'Neutral');
  assert.equal(combinarTono('Neutral', { tono: null }), 'Neutral');
});

test('voz de salida: voz por idioma y pais, con respaldo por idioma', () => {
  assert.equal(localeVoz('es', 'Colombia'), 'es-CO');
  assert.equal(localeVoz('en', 'Reino Unido'), 'en-GB');
  assert.equal(localeVoz('es', 'Pais Inventado'), 'es-CO');
  assert.equal(localeVoz('de', null), 'de');
  assert.equal(vozPara('es', 'Mexico'), 'es-MX-DaliaNeural');
  assert.equal(vozPara('fr', null), 'fr-FR-DeniseNeural');
  assert.equal(vozPara('xx', null), 'en-US-JennyNeural');
});

test('voz de salida: cada tono tiene su expresion y la velocidad queda acotada', () => {
  for (const tono of Object.keys(EXPRESION)) {
    const e = expresionPara(tono);
    assert.ok(e.instruccion.length > 10, tono);
    if (tono !== 'Neutral') assert.equal(e.vector.length, 8, tono);
  }
  assert.equal(expresionPara('Enojado').estilo, 'angry');
  assert.equal(expresionPara('Inventado').estilo, null); // cae en Neutral
  assert.equal(expresionPara('Neutral', 5).velocidad, 1.35);
  assert.equal(expresionPara('Neutral', 0.1).velocidad, 0.75);
  assert.equal(expresionPara('Neutral', 'abc').velocidad, 1);
});

test('errores de negocio: cada fabrica da su codigo HTTP y el cuerpo sigue la convencion', () => {
  assert.deepEqual([E.mal('x'), E.reglaNegocio('x'), E.noAutorizado(), E.prohibido(), E.noEncontrado(), E.conflicto('x')].map((e) => e.estado), [400, 422, 401, 403, 404, 409]);
  assert.ok(E.mal('x') instanceof E.ErrorNegocio);
  const cuerpo = E.cuerpoError(404, 'No existe', '/api/v1/x');
  assert.equal(cuerpo.statusCode, 404);
  assert.equal(cuerpo.message, 'No existe');
});
