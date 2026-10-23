// Adaptador del puerto MotorTraduccion (ver puertos/index.js): Qwen corriendo local en Ollama
// (https://ollama.com). Es el primero que se intenta.   ollama pull qwen2.5:7b
const { armarPrompt, leerRespuesta, paraPrompt } = require('./prompt');

function crearMotorQwen({ url = 'http://localhost:11434', modelo = 'qwen2.5:7b', timeoutMs = 60000, fetchFn = fetch } = {}) {
  const base = String(url).replace(/\/$/, '');
  return {
    nombre: 'qwen',
    etiqueta: () => `qwen:${modelo}`,
    disponible: () => true,
    soportaPar: (origen, destino) => origen !== destino, // un modelo de lenguaje entiende cualquier par
    async traducir(entrada) {
      const resp = await fetchFn(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: modelo,
          stream: false,
          format: 'json', // pide salida JSON valida
          think: false, // modelos Qwen3: sin modo de razonamiento, que rompe el JSON y es lento
          options: { temperature: 0.2 },
          messages: [{ role: 'user', content: armarPrompt(paraPrompt(entrada)) }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`Ollama respondio ${resp.status}`);
      const datos = await resp.json();
      return leerRespuesta(datos.message && datos.message.content, entrada.tonos);
    },
  };
}

module.exports = { crearMotorQwen };
