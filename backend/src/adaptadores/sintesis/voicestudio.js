// Adaptador del puerto Sintetizador con VoiceStudio (github.com/debpalash/VoiceStudio): voz local, sin
// costo y con emocion (ADR-016). Con IndexTTS 2 la emocion va como vector de 8 pesos en POST /generate
// (espanol, ingles, chino, japones y arabe). Con otros motores (cosyvoice, omnivoice, mlx-audio...) usa la
// ruta compatible con OpenAI POST /v1/audio/speech y la emocion va como instruccion en texto.
const { expresionPara } = require('../../dominio/voz');

const usaVector = (motor) => /^indextts/i.test(motor);

function crearSintetizadorVoiceStudio({ url, motor = 'indextts2', perfil, apiKey, timeoutMs = 60000, fetchFn = fetch } = {}) {
  const base = url ? url.replace(/\/$/, '') : '';
  const auth = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  async function porGenerate({ texto, idioma, e }) {
    const f = new FormData();
    f.append('text', texto);
    f.append('engine', motor);
    f.append('language', idioma);
    f.append('speed', String(e.velocidad));
    f.append('effect_preset', 'raw');
    if (e.vector) f.append('emo_vector', JSON.stringify(e.vector));
    if (perfil) f.append('profile_id', perfil);
    const resp = await fetchFn(`${base}/generate`, { method: 'POST', headers: auth, body: f, signal: AbortSignal.timeout(timeoutMs) });
    if (!resp.ok) throw new Error(`VoiceStudio /generate respondio ${resp.status}`);
    return { audio: Buffer.from(await resp.arrayBuffer()), tipo: 'audio/wav', voz: `${motor}${perfil ? `:${perfil}` : ''}` };
  }

  async function porOpenAI({ texto, idioma, e }) {
    const resp = await fetchFn(`${base}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ model: motor, input: texto, voice: perfil || 'default', instruct: e.instruccion, language: idioma, speed: e.velocidad, response_format: 'mp3' }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!resp.ok) throw new Error(`VoiceStudio /v1/audio/speech respondio ${resp.status}`);
    return { audio: Buffer.from(await resp.arrayBuffer()), tipo: 'audio/mpeg', voz: `${motor}${perfil ? `:${perfil}` : ''}` };
  }

  return {
    nombre: 'voicestudio',
    disponible: () => !!base,
    async sintetizar({ texto, idioma, tono, ritmo }) {
      const e = expresionPara(tono, ritmo);
      return usaVector(motor) ? porGenerate({ texto, idioma, e }) : porOpenAI({ texto, idioma, e });
    },
  };
}

module.exports = { crearSintetizadorVoiceStudio };
