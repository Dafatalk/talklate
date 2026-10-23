// Adaptador del puerto MotorTraduccion (ver puertos/index.js): Claude por la API de Anthropic.
// Solo esta disponible si hay clave (ANTHROPIC_API_KEY).
const { armarPrompt, leerRespuesta, paraPrompt } = require('./prompt');

function crearMotorClaude({ apiKey, modelo = 'claude-sonnet-5-5', timeoutMs = 30000, fetchFn = fetch } = {}) {
  return {
    nombre: 'claude',
    etiqueta: () => `claude:${modelo}`,
    disponible: () => !!apiKey,
    soportaPar: (origen, destino) => origen !== destino,
    async traducir(entrada) {
      const resp = await fetchFn('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: modelo, max_tokens: 1024, messages: [{ role: 'user', content: armarPrompt(paraPrompt(entrada)) }] }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`Claude respondio ${resp.status}`);
      const datos = await resp.json();
      return leerRespuesta((datos.content || []).map((b) => b.text || '').join(''), entrada.tonos);
    },
  };
}

module.exports = { crearMotorClaude };
