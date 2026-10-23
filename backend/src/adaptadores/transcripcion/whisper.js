// Adaptador del puerto Transcriptor (ver puertos/index.js): pasa el audio a texto con Whisper por la API
// compatible con OpenAI (POST multipart a .../audio/transcriptions). Sirve con un Whisper local
// (speaches / faster-whisper-server, o whisper.cpp con --inference-path) o con un proveedor en la nube.
const { ErrorNegocio } = require('../../dominio/errores');

const EXTENSION = { 'audio/m4a': 'm4a', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3', 'audio/3gpp': '3gp' };

function crearTranscriptorWhisper({ url, modelo = 'whisper-1', apiKey, timeoutMs = 30000, fetchFn = fetch } = {}) {
  return {
    disponible: () => !!url,
    async transcribir({ audio, tipo = 'audio/m4a', idioma }) {
      if (!url) throw new ErrorNegocio(503, 'La transcripcion de voz no esta configurada en el servidor. Escribe tu mensaje por ahora.');
      const tipoBase = String(tipo).split(';')[0].trim().toLowerCase();
      const formulario = new FormData();
      formulario.append('file', new Blob([audio], { type: tipoBase }), `mensaje.${EXTENSION[tipoBase] || 'm4a'}`);
      formulario.append('model', modelo);
      formulario.append('response_format', 'json');
      if (idioma) formulario.append('language', idioma);
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        body: formulario,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`Whisper respondio ${resp.status}`);
      const datos = await resp.json();
      return { texto: String(datos.text || '').trim() };
    },
  };
}

module.exports = { crearTranscriptorWhisper };
