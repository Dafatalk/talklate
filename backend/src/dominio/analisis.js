// Analisis ligero del mensaje: idioma, tono (entonacion) y region/acento de origen.
// Es heuristico y funciona sin internet; con Claude (motorClaude) estas senales las da el modelo.

const quitarTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => quitarTildes(s.toLowerCase());
const palabras = (s) => normalizar(s).split(/[^a-z0-9']+/).filter(Boolean);

const STOP_ES = new Set(['el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'un', 'una', 'es', 'por', 'con', 'para', 'no', 'si', 'yo', 'tu', 'mi', 'su', 'se', 'lo', 'como', 'mas', 'pero', 'hay', 'muy', 'esta', 'estoy', 'vamos', 'hola', 'gracias', 'quiero', 'necesito', 'del', 'al', 'ya', 'bien', 'donde', 'cuando', 'porque', 'todo', 'nos', 'te', 'me', 'le', 'les', 'son', 'soy', 'eres', 'tengo', 'tiene']);
const STOP_EN = new Set(['the', 'and', 'of', 'to', 'in', 'is', 'it', 'you', 'that', 'for', 'with', 'on', 'are', 'was', 'be', 'this', 'have', 'not', 'but', 'what', 'we', 'i', 'my', 'your', 'me', 'do', 'can', 'will', 'just', 'so', 'if', 'at', 'from', 'hello', 'hi', 'thanks', 'please', 'want', 'need', "let's", "i'm", "it's", "don't", 'how', 'where', 'when', 'because', 'all', 'now', 'good', 'no', 'yes']);

// Devuelve 'es', 'en' o null si no hay suficiente informacion
function detectarIdioma(texto) {
  if (/[ñ¿¡]/i.test(texto)) return 'es';
  const ps = palabras(texto);
  let es = 0, en = 0;
  for (const p of ps) {
    if (STOP_ES.has(p)) es += 1;
    if (STOP_EN.has(p)) en += 1;
  }
  if (/[áéíóú]/i.test(texto)) es += 1;
  if (es === en) return null;
  return es > en ? 'es' : 'en';
}

const SENALES = {
  Enojado: ['idiota', 'odio', 'harto', 'mamado', 'estupido', 'maldito', 'hate', 'stupid', 'angry', 'furious', 'fed up', 'ridiculo', 'inaceptable', 'unacceptable'],
  Preocupado: ['preocup', 'urge', 'urgente', 'problema', 'hay que', 'ponerse las pilas', 'ojo', 'worried', 'urgent', 'problem', 'trouble', 'need to', 'careful', 'cuidado', 'miedo', 'afraid'],
  Alegre: ['jaja', 'jeje', 'genial', 'chimba', 'chevere', 'bacano', 'felicidades', 'haha', 'awesome', 'great', 'amazing', 'congrats', 'excelente', 'fantastic', 'que nota'],
  Amigable: ['gracias', 'por favor', 'hola', 'parce', 'amigo', 'querido', 'thanks', 'please', 'hello', 'hi ', 'dear friend', 'buddy', 'dude', 'buenos dias', 'buenas', 'good morning', 'te quiero', 'love you'],
  Formal: ['estimado', 'atentamente', 'cordialmente', 'usted', 'dear sir', 'dear madam', 'sincerely', 'regards', 'respectfully', 'would you kindly'],
};

// Devuelve el nombre de una entonacion del catalogo
function detectarTono(texto) {
  const t = ' ' + normalizar(texto) + ' ';
  const letras = texto.replace(/[^A-Za-z]/g, '');
  const mayus = letras.length > 6 && letras.replace(/[^A-Z]/g, '').length / letras.length > 0.7;
  const puntaje = {};
  for (const [tono, claves] of Object.entries(SENALES)) {
    puntaje[tono] = claves.filter((c) => t.includes(c)).length;
  }
  if (mayus || /!{2,}/.test(texto)) puntaje.Enojado += 1;
  let mejor = 'Neutral', max = 0;
  for (const tono of ['Enojado', 'Preocupado', 'Alegre', 'Amigable', 'Formal']) {
    if (puntaje[tono] > max) { mejor = tono; max = puntaje[tono]; }
  }
  return mejor;
}

// Regiones de origen segun regionalismos (nombre de la region y pais, como estan en el catalogo)
const REGIONALISMOS = [
  { region: 'Antioquia', pais: 'Colombia', claves: ['parce', 'parcero', 'paisa', 'chimba', 'bacano', 'ponerse las pilas', 'pilas', 'de una', 'que pena', 'mamado', 'a la orden', 'dar papaya', 'berraco', 'gonorrea'] },
  { region: 'Ciudad de Mexico', pais: 'Mexico', claves: ['wey', 'guey', 'chido', 'padrisimo', 'que onda', 'ahorita', 'no manches', 'neta', 'chamba', 'platicar', 'andale'] },
  { region: 'Buenos Aires', pais: 'Argentina', claves: ['che', 'boludo', 'pibe', 'laburo', 'copado', 'bondi', 'vos tenes', 'quilombo', 'guita'] },
  { region: 'Madrid', pais: 'Espana', claves: ['tio', 'tia', 'mola', 'guay', 'vale', 'flipar', 'currar', 'vosotros', 'chaval', 'ostras'] },
  { region: 'California', pais: 'Estados Unidos', claves: ["y'all", 'gonna', 'wanna', 'awesome', 'dude', 'buddy', 'for sure', 'hella'] },
  { region: 'Londres', pais: 'Reino Unido', claves: ['mate', 'cheers', 'bloody', 'innit', 'brilliant', 'quid', 'lorry', 'knackered', 'fancy a'] },
];

function detectarRegionOrigen(texto) {
  const t = ' ' + normalizar(texto).replace(/[^a-z0-9' ]+/g, ' ') + ' ';
  let mejor = null, max = 0;
  for (const r of REGIONALISMOS) {
    const n = r.claves.filter((c) => t.includes(' ' + c + ' ') || (c.includes(' ') && t.includes(c))).length;
    if (n > max) { mejor = r; max = n; }
  }
  return mejor ? { region: mejor.region, pais: mejor.pais } : null;
}

module.exports = { detectarIdioma, detectarTono, detectarRegionOrigen, normalizar, quitarTildes };
