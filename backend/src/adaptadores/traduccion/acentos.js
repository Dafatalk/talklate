// Restaura tildes y enies en el texto en espanol que sale del motor local (las tablas internas
// se escriben sin tildes para poder compararlas). Se usan escapes unicode a proposito.
const PARES = [
  ['donde esta', 'dónde está'], ['que tal', 'qué tal'], ['que mas', 'qué más'], ['que onda', 'qué onda'],
  ['que padre', 'qué padre'], ['como estas', 'cómo estás'], ['como te va', 'cómo te va'], ['cuanto cuesta', 'cuánto cuesta'],
  ['como esta usted', 'cómo está usted'], ['por que', 'por qué'], ['estas cansado', 'estás cansado'],
  ['bano', 'baño'], ['manana', 'mañana'], ['ano', 'año'], ['pequeno', 'pequeño'], ['ensenar', 'enseñar'],
  ['extrano', 'extraño'], ['espanol', 'español'], ['espana', 'España'], ['adios', 'adiós'], ['dia', 'día'], ['dias', 'días'],
  ['cafe', 'café'], ['telefono', 'teléfono'], ['tambien', 'también'], ['mas', 'más'], ['pais', 'país'], ['ingles', 'inglés'],
  ['traduccion', 'traducción'], ['conversacion', 'conversación'], ['reunion', 'reunión'], ['avion', 'avión'], ['aqui', 'aquí'],
  ['alli', 'allí'], ['ahi', 'ahí'], ['rapido', 'rápido'], ['perdon', 'perdón'], ['despues', 'después'], ['ultimo', 'último'],
  ['expresion', 'expresión'], ['region', 'región'], ['cortesia', 'cortesía'], ['verguenza', 'vergüenza'], ['ingles', 'inglés'],
  ['esta lloviendo', 'está lloviendo'], ['lloviendo a cantaros', 'lloviendo a cántaros'], ['llover a cantaros', 'llover a cántaros'],
  ['estoy de acuerdo', 'estoy de acuerdo'], ['musica', 'música'], ['numero', 'número'], ['facil', 'fácil'], ['dificil', 'difícil'],
  ['chevere', 'ch\u00e9vere'], ['padrisimo', 'padr\u00edsimo'], ['buenisimo', 'buen\u00edsimo'], ['pongamonos', 'pong\u00e1monos'], ['vamonos', 'v\u00e1monos'],
  ['estas', 'est\u00e1s'], ['mama', 'mam\u00e1'], ['papa', 'pap\u00e1'], ['telefonico', 'telef\u00f3nico'],
].sort((a, b) => b[0].length - a[0].length);

const REGEX = PARES.map(([plano, bueno]) => [new RegExp(`(?<![\\p{L}])${plano}(?![\\p{L}])`, 'giu'), bueno]);

function restaurarAcentos(texto) {
  let t = texto;
  for (const [re, bueno] of REGEX) {
    t = t.replace(re, (m) => (/^\p{Lu}/u.test(m) ? bueno.charAt(0).toUpperCase() + bueno.slice(1) : bueno));
  }
  return t;
}

module.exports = { restaurarAcentos };
