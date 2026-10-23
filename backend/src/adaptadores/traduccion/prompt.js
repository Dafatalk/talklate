// Prompt comun para los motores de IA (Qwen y Claude): conservar intencion, tono y modismos
function armarPrompt({ texto, origen, destino, regionDestino, regionOrigen, tonos, prosodia }) {
  return [
    'Eres el motor de traduccion de TalkLate. No traduzcas palabra por palabra: conserva la intencion, el tono, el estilo y los modismos del hablante.',
    'Si el mensaje tiene jerga o modismos, usa el equivalente cultural en la region destino en vez de una traduccion literal.',
    `Idioma origen: ${origen.nombre || origen.codigo}${regionOrigen ? ` (region: ${regionOrigen})` : ''}.`,
    `Idioma destino: ${destino.nombre || destino.codigo}${regionDestino ? ` (region: ${regionDestino})` : ''}.`,
    `Tonos posibles: ${tonos.join(', ')}.`,
    ...(prosodia ? [`El mensaje llego por voz: la persona ${prosodia.descripcion}. Usa tambien eso para elegir el tono y conservalo en la traduccion.`] : []),
    'Responde SOLO con un JSON: {"traduccion": string, "tono": uno de los tonos posibles, "nota_cultural": string o null (explica en espanol breve cualquier modismo adaptado), "region_origen": string o null}.',
    '',
    'Mensaje:',
    texto,
  ].join('\n');
}

// Lee el JSON de la respuesta aunque el modelo lo envuelva en texto o en un bloque de codigo
function leerRespuesta(bruto, tonos) {
  const t = String(bruto || '').trim();
  const ini = t.indexOf('{');
  const fin = t.lastIndexOf('}');
  if (ini < 0 || fin < ini) throw new Error('La respuesta del modelo no trae JSON');
  const json = JSON.parse(t.slice(ini, fin + 1));
  if (typeof json.traduccion !== 'string' || !json.traduccion.trim()) throw new Error('Respuesta del modelo sin traduccion');
  return {
    traduccion: json.traduccion.trim(),
    tono: tonos.includes(json.tono) ? json.tono : null,
    nota: json.nota_cultural || null,
    regionOrigen: json.region_origen || null,
    aproximada: false,
  };
}

// La region destino llega como objeto { nombre, paisCodigo }; al prompt solo le sirve el nombre
function paraPrompt(entrada) {
  const r = entrada.regionDestino;
  return { ...entrada, regionDestino: r && typeof r === 'object' ? r.nombre : r };
}

module.exports = { armarPrompt, leerRespuesta, paraPrompt };
