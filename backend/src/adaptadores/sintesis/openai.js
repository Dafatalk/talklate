// Adaptador del puerto Sintetizador con la API compatible con OpenAI (POST .../audio/speech).
// Con gpt-4o-mini-tts la emocion va como instruccion en lenguaje natural; tambien sirve un servidor
// local compatible (Kokoro-FastAPI, openedai-speech), que ignora la instruccion pero suena natural.
const { expresionPara, localeVoz } = require('../../dominio/voz');

const ACENTO = { 'es-CO': 'con acento colombiano', 'es-MX': 'con acento mexicano', 'es-ES': 'con acento de Espana', 'es-AR': 'con acento argentino', 'en-US': 'with an American accent', 'en-GB': 'with a British accent' };

function crearSintetizadorOpenAI({ url, modelo = 'gpt-4o-mini-tts', voz = 'coral', apiKey, timeoutMs = 20000, fetchFn = fetch } = {}) {
  return {
    nombre: 'openai',
    disponible: () => !!url,
    async sintetizar({ texto, idioma, pais, tono, ritmo }) {
      const e = expresionPara(tono, ritmo);
      const acento = ACENTO[localeVoz(idioma, pais)];
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ model: modelo, voice: voz, input: texto, response_format: 'mp3', speed: e.velocidad, instructions: `${e.instruccion}${acento ? ` Habla ${acento}.` : ''}` }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`El servicio de voz respondio ${resp.status}`);
      return { audio: Buffer.from(await resp.arrayBuffer()), tipo: 'audio/mpeg', voz };
    },
  };
}

module.exports = { crearSintetizadorOpenAI };
