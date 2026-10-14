// Motor de traduccion con Claude (API de Anthropic). Se usa si hay ANTHROPIC_API_KEY.
const { armarPrompt, leerRespuesta } = require('./prompt');

const MODELO = process.env.TALKLATE_MODEL || 'claude-sonnet-5-5';

function disponible() {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function traducirClaude(entrada, { fetchFn = fetch, apiKey = process.env.ANTHROPIC_API_KEY, timeoutMs = 30000 } = {}) {
  const resp = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELO, max_tokens: 1024, messages: [{ role: 'user', content: armarPrompt(entrada) }] }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`Claude respondio ${resp.status}`);
  const datos = await resp.json();
  return leerRespuesta((datos.content || []).map((b) => b.text || '').join(''), entrada.tonos);
}

module.exports = { traducirClaude, disponible, MODELO };
