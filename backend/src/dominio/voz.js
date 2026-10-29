// Como debe sonar la traduccion segun la entonacion detectada (ADR-015). Es dominio puro: no sabe de
// Azure ni de OpenAI; cada adaptador de sintesis toma de aqui el estilo, la prosodia y la instruccion.

// Voz neuronal por idioma y pais. Se prefieren voces que aceptan estilos (enojo, alegria, tristeza).
const VOCES = {
  'es-CO': 'es-CO-SalomeNeural', 'es-MX': 'es-MX-DaliaNeural', 'es-ES': 'es-ES-ElviraNeural', 'es-AR': 'es-AR-ElenaNeural',
  'en-US': 'en-US-JennyNeural', 'en-GB': 'en-GB-SoniaNeural', 'fr-FR': 'fr-FR-DeniseNeural', 'pt-BR': 'pt-BR-FranciscaNeural',
};
const VOZ_IDIOMA = { es: 'es-MX-DaliaNeural', en: 'en-US-JennyNeural', fr: 'fr-FR-DeniseNeural', pt: 'pt-BR-FranciscaNeural' };
const PAIS_ISO = { Colombia: 'CO', Mexico: 'MX', Espana: 'ES', Argentina: 'AR', 'Estados Unidos': 'US', 'Reino Unido': 'GB', Francia: 'FR', Brasil: 'BR' };
const LOCALE_IDIOMA = { es: 'es-CO', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };

// estilo: mstts:express-as de Azure (si la voz no lo tiene, Azure lo ignora y queda la prosodia)
// vector: emociones de IndexTTS 2 en VoiceStudio (alegre, enojado, triste, miedo, asco, melancolia, sorpresa, calma)
// prosodia: respaldo que se nota en cualquier voz · instruccion: para modelos que siguen indicaciones (gpt-4o-mini-tts)
const EXPRESION = {
  Enojado: { vector: [0, 0.85, 0, 0, 0.1, 0, 0, 0], estilo: 'angry', grado: 1.6, tono: '+4%', velocidad: 1.12, volumen: '+15%', instruccion: 'Habla con enojo real: voz firme, tensa y cortante, con enfasis fuerte en las palabras clave.' },
  Alegre: { vector: [0.85, 0, 0, 0, 0, 0, 0.2, 0], estilo: 'cheerful', grado: 1.6, tono: '+10%', velocidad: 1.08, volumen: '+5%', instruccion: 'Habla con mucha alegria y entusiasmo, sonriendo, con una entonacion que sube y baja.' },
  Amigable: { vector: [0.45, 0, 0, 0, 0, 0, 0, 0.5], estilo: 'friendly', grado: 1.2, tono: '+5%', velocidad: 1.0, volumen: '+0%', instruccion: 'Habla calido y cercano, como con un amigo, relajado y con una sonrisa suave.' },
  Preocupado: { vector: [0, 0, 0.3, 0.5, 0, 0.2, 0, 0], estilo: 'sad', grado: 1.3, tono: '-6%', velocidad: 0.92, volumen: '-5%', instruccion: 'Habla preocupado e inquieto, un poco mas bajo y lento, con duda en la voz.' },
  Formal: { vector: [0, 0, 0, 0, 0, 0, 0, 0.8], estilo: 'customerservice', grado: 1, tono: '-2%', velocidad: 0.95, volumen: '+0%', instruccion: 'Habla formal, claro y respetuoso, con calma y buena diccion.' },
  Neutral: { vector: null, estilo: null, grado: 1, tono: '+0%', velocidad: 1.0, volumen: '+0%', instruccion: 'Habla natural y conversacional, como una persona real, sin sonar robotico.' },
};

function localeVoz(idioma, pais) {
  const iso = PAIS_ISO[pais];
  const candidato = iso ? `${idioma}-${iso}` : null;
  return candidato && VOCES[candidato] ? candidato : LOCALE_IDIOMA[idioma] || idioma;
}

function vozPara(idioma, pais) {
  return VOCES[localeVoz(idioma, pais)] || VOZ_IDIOMA[idioma] || 'en-US-JennyNeural';
}

// ritmo (1 = normal) imita la velocidad del hablante; se combina con la del tono y se limita
function expresionPara(tono, ritmo = 1) {
  const e = EXPRESION[tono] || EXPRESION.Neutral;
  const r = Number.isFinite(Number(ritmo)) ? Number(ritmo) : 1;
  return { ...e, velocidad: Math.min(1.35, Math.max(0.75, e.velocidad * r)) };
}

module.exports = { EXPRESION, localeVoz, vozPara, expresionPara };
