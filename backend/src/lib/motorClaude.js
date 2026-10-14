// Motor de traduccion con Claude (API de Anthropic). Se activa si hay ANTHROPIC_API_KEY.
// Pide una traduccion que conserve intencion, tono y modismos, y devuelve JSON estructurado.
const MODELO = process.env.TALKLATE_MODEL || 'claude-sonnet-5-5';

function prompt({ texto, origen, destino, regionDestino, regionOrigen, tonos }) {
  return [
    'Eres el motor de traduccion de TalkLate. No traduzcas palabra por palabra: conserva la intencion, el tono, el estilo y los modismos del hablante.',
    'Si el mensaje tiene jerga o modismos, usa el equivalente cultural en la region destino en vez de una traduccion literal.',
    `Idioma origen: ${origen.nombre || origen.codigo}${regionOrigen ? ` (region: ${regionOrigen})` : ''}.`,
    `Idioma destino: ${destino.nombre || destino.codigo}${regionDestino ? ` (region: ${regionDestino})` : ''}.`,
    `Tonos posibles: ${tonos.join(', ')}.`,
    'Responde SOLO con un JSON: {"traduccion": string, "tono": uno de los tonos posibles, "nota_cultural": string o null (explica en espanol breve cualquier modismo adaptado), "region_origen": string o null}.',
    '',
    'Mensaje:',
    texto,
  ].join('\n');
}

async function traducirClaude(entrada, { fetchFn = fetch, apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  const resp = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELO, max_tokens: 1024, messages: [{ role: 'user', content: prompt(entrada) }] }),
  });
  if (!resp.ok) throw new Error(`Claude respondio ${resp.status}`);
  const datos = await resp.json();
  const bruto = (datos.content || []).map((b) => b.text || '').join('').trim();
  const json = JSON.parse(bruto.slice(bruto.indexOf('{'), bruto.lastIndexOf('}') + 1));
  if (typeof json.traduccion !== 'string' || !json.traduccion.trim()) throw new Error('Respuesta de Claude sin traduccion');
  return {
    traduccion: json.traduccion.trim(),
    tono: entrada.tonos.includes(json.tono) ? json.tono : null,
    nota: json.nota_cultural || null,
    regionOrigen: json.region_origen || null,
    aproximada: false,
  };
}

module.exports = { traducirClaude, MODELO };
