// Motor de traduccion con Qwen corriendo local en Ollama (https://ollama.com). Es el primero que se intenta.
//   ollama pull qwen2.5:7b      (o el modelo que prefieras con QWEN_MODEL)
const { armarPrompt, leerRespuesta } = require('./prompt');

const URL_OLLAMA = () => (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const MODELO = () => process.env.QWEN_MODEL || 'qwen2.5:7b';

async function traducirQwen(entrada, { fetchFn = fetch, timeoutMs = Number(process.env.QWEN_TIMEOUT_MS) || 60000 } = {}) {
  const resp = await fetchFn(`${URL_OLLAMA()}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODELO(),
      stream: false,
      format: 'json', // pide salida JSON valida
      think: false, // modelos Qwen3: sin modo de razonamiento, que rompe el JSON y es lento
      options: { temperature: 0.2 },
      messages: [{ role: 'user', content: armarPrompt(entrada) }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`Ollama respondio ${resp.status}`);
  const datos = await resp.json();
  return leerRespuesta(datos.message && datos.message.content, entrada.tonos);
}

module.exports = { traducirQwen, MODELO };
