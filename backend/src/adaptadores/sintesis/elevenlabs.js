// Adaptador del puerto Sintetizador con ElevenLabs (nube): TTS multilingue con voces clonadas/disenadas
// que preservan acentos regionales (ej. paisa, New York). La emocion va en voice_settings: menos estabilidad
// = mas expresividad; mas estilo = exagera modismos. La velocidad sale del tono/ritmo (ADR-015).
// Las voces se eligen por locale: voces = { 'es-CO': id_paisa, 'en-US': id_newyork, es: ..., en: ..., default: ... }.
const { expresionPara, localeVoz } = require('../../dominio/voz');

// voice_settings por tono. stability baja da variacion tonal (el "cantado" regional); style exagera.
const AJUSTE = {
  Enojado: { stability: 0.32, style: 0.45 },
  Alegre: { stability: 0.35, style: 0.40 },
  Amigable: { stability: 0.45, style: 0.20 },
  Preocupado: { stability: 0.40, style: 0.30 },
  Formal: { stability: 0.60, style: 0.05 },
  Neutral: { stability: 0.50, style: 0.10 },
};

function crearSintetizadorElevenLabs({
  apiKey,
  voces = {},
  generoDefault = 'hombre',
  modelo = 'eleven_multilingual_v2',
  formato = 'mp3_44100_128',
  timeoutMs = 20000,
  fetchFn = fetch,
} = {}) {
  const defecto = generoDefault === 'mujer' ? 'mujer' : 'hombre';
  const tieneVoz = (v) => !!v && (typeof v === 'string' ? true : Object.values(v).some(Boolean));
  // Cada voz puede ser un id (string) o un par { hombre, mujer }; se elige por locale y genero del hablante.
  function voiceIdPara(idioma, pais, genero) {
    const set = voces[localeVoz(idioma, pais)] || voces[idioma];
    if (set && typeof set === 'object') {
      const g = genero === 'mujer' || genero === 'hombre' ? genero : defecto;
      return set[g] || set.hombre || set.mujer || null;
    }
    return (typeof set === 'string' ? set : null) || voces.default || null;
  }

  return {
    nombre: 'elevenlabs',
    disponible: () => !!(apiKey && Object.values(voces).some(tieneVoz)),
    async sintetizar({ texto, idioma, pais, tono, ritmo, genero }) {
      const voiceId = voiceIdPara(idioma, pais, genero);
      if (!voiceId) throw new Error(`ElevenLabs no tiene voz configurada para ${idioma}${pais ? `/${pais}` : ''}`);
      const e = expresionPara(tono, ritmo);
      const a = AJUSTE[tono] || AJUSTE.Neutral;
      const resp = await fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${formato}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text: texto,
          model_id: modelo,
          voice_settings: {
            stability: a.stability,
            similarity_boost: 0.75,
            style: a.style,
            use_speaker_boost: true,
            speed: Math.min(1.2, Math.max(0.7, e.velocidad)),
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`ElevenLabs respondio ${resp.status}`);
      return { audio: Buffer.from(await resp.arrayBuffer()), tipo: 'audio/mpeg', voz: voiceId };
    },
  };
}

module.exports = { crearSintetizadorElevenLabs };
