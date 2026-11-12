const { buscarTerminos, localeDe } = require('./glosario');

// Arma las lineas de glosario cultural: los modismos del glosario que aparecen en el mensaje, con su
// equivalente natural en la variedad destino y un ejemplo real de uso (few-shot tomado del diccionario,
// ver glosario.json). Asi el motor sabe como lo diria un nativo y no traduce literal. Si no hay
// coincidencias no agrega nada. (Ver glosario.js.)
function lineasGlosario({ texto, origen, destino }) {
  const matches = buscarTerminos(texto, localeDe(origen.codigo));
  if (!matches.length) return [];
  const dest = destino.nombre || destino.codigo;
  return [
    '',
    `Modismos detectados en el mensaje. Usa el equivalente cultural natural en ${dest} (nunca la traduccion literal) y respeta el registro del hablante:`,
    ...matches.map((m) => {
      const eq = m.equivalent ? ` -> en ${dest}: ${m.equivalent}` : '';
      const ej = m.example ? ` | asi lo usa un nativo: "${m.example}"` : '';
      const flag = m.sensitive ? ' [sensible: cuida el registro, puede ofender fuera de contexto]' : '';
      return `- "${m.term}" = ${m.meaning_es}${eq}${ej}${flag}`;
    }),
  ];
}

// Prompt comun para los motores de IA (Qwen y Claude): transcreacion cultural, no traduccion literal.
// Es agnostico al par de idiomas: el origen, el destino y sus regiones llegan de la configuracion de la
// conversacion (no se hardcodean).
function armarPrompt({ texto, origen, destino, regionDestino, regionOrigen, tonos, prosodia }) {
  const dest = destino.nombre || destino.codigo;
  return [
    'Eres el motor de transcreacion cultural en tiempo real de TalkLate. Tu trabajo NO es traducir palabra por palabra:',
    'primero entiende la INTENCION, la SITUACION y el TONO del hablante, y luego exprésalo como lo diria de forma natural un nativo de la region destino.',
    'Reglas:',
    '- Nunca hagas sustitucion literal ni morfologica palabra por palabra; reescribe la idea completa.',
    '- Conserva el registro del hablante: si habla informal o callejero, usa la jerga y los modismos naturales e informales de la region destino (no una version neutra y acartonada); si es formal, manten lo formal.',
    '- Usa solo la puntuacion propia del idioma destino; no copies signos del idioma origen (por ejemplo, el ingles no lleva los signos de apertura ¿ ni ¡).',
    `Idioma origen: ${origen.nombre || origen.codigo}${regionOrigen ? ` (region: ${regionOrigen})` : ''}.`,
    `Idioma destino: ${dest}${regionDestino ? ` (region: ${regionDestino})` : ''}.`,
    `Tonos posibles: ${tonos.join(', ')}.`,
    ...(prosodia ? [`El mensaje llego por voz: la persona ${prosodia.descripcion}. Usa tambien eso para elegir el tono y conservalo en la traduccion.`] : []),
    'Responde SOLO con un JSON: {"traduccion": string, "tono": uno de los tonos posibles, "genero": "masculino" | "femenino" | null (el genero de quien ESCRIBE el mensaje, inferido por pistas del texto como la concordancia en espanol -cansada/cansado- o como se nombra; null si no hay pistas), "nota_cultural": string o null (explica en espanol breve cualquier modismo adaptado), "region_origen": string o null}.',
    ...lineasGlosario({ texto, origen, destino }),
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
  const g = String(json.genero || '').toLowerCase();
  const genero = /^(masculino|male|hombre|m)$/.test(g) ? 'hombre' : /^(femenino|female|mujer|f)$/.test(g) ? 'mujer' : null;
  return {
    traduccion: json.traduccion.trim(),
    tono: tonos.includes(json.tono) ? json.tono : null,
    genero,
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
