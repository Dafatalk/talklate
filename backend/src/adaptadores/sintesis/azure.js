// Adaptador del puerto Sintetizador con Azure Speech (voces neuronales). La emocion va en SSML:
// mstts:express-as (enojo, alegria, tristeza...) y, como respaldo en voces sin estilos, la prosodia.
const { localeVoz, vozPara, expresionPara } = require('../../dominio/voz');

const escapar = (t) => String(t).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

function ssml({ texto, idioma, pais, tono, ritmo }) {
  const e = expresionPara(tono, ritmo);
  const voz = vozPara(idioma, pais);
  const velocidad = `${Math.round((e.velocidad - 1) * 100)}%`;
  let cuerpo = `<prosody pitch="${e.tono}" rate="${velocidad.startsWith('-') ? velocidad : `+${velocidad}`}" volume="${e.volumen}">${escapar(texto)}</prosody>`;
  if (e.estilo) cuerpo = `<mstts:express-as style="${e.estilo}" styledegree="${e.grado}">${cuerpo}</mstts:express-as>`;
  return { voz, xml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${localeVoz(idioma, pais)}"><voice name="${voz}">${cuerpo}</voice></speak>` };
}

function crearSintetizadorAzure({ clave, region, timeoutMs = 15000, fetchFn = fetch } = {}) {
  return {
    nombre: 'azure',
    disponible: () => !!(clave && region),
    async sintetizar(entrada) {
      const { voz, xml } = ssml(entrada);
      const resp = await fetchFn(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': clave, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'talklate' },
        body: xml,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`Azure Speech respondio ${resp.status}`);
      return { audio: Buffer.from(await resp.arrayBuffer()), tipo: 'audio/mpeg', voz };
    },
  };
}

module.exports = { crearSintetizadorAzure, ssml };
