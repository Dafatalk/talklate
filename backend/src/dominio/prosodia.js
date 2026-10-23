// Prosodia: COMO se dijo un mensaje de voz (no QUE se dijo). La app mide el volumen mientras graba
// (expo-audio da el nivel en dB cada 100 ms) y el servidor conoce el texto transcrito; con eso se
// estiman intensidad, variacion y velocidad, y de ahi una entonacion del catalogo. Es heuristico y se
// combina con el tono del texto: lo que dicen las palabras manda; la voz decide cuando el texto es neutro.

const limitar = (x, min, max) => Math.min(max, Math.max(min, x));
const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// metricas: { duracion_ms, volumen_promedio_db, volumen_max_db, variacion_db } (dB entre -160 y 0)
function analizarProsodia(metricas, texto) {
  if (!metricas || typeof metricas !== 'object') return null;
  const duracionMs = numero(metricas.duracion_ms);
  if (!duracionMs || duracionMs < 300) return null;
  const promedio = numero(metricas.volumen_promedio_db);
  const maximo = numero(metricas.volumen_max_db);
  const variacion = numero(metricas.variacion_db);
  const palabras = String(texto || '').trim().split(/\s+/).filter(Boolean).length;
  const velocidad = palabras / (duracionMs / 1000); // palabras por segundo

  const intensidad = promedio === null ? 'media' : (promedio > -22 || (maximo !== null && maximo > -6)) ? 'alta' : promedio < -40 ? 'baja' : 'media';
  const ritmo = velocidad >= 3.2 ? 'rapido' : velocidad > 0 && velocidad <= 1.8 ? 'lento' : 'normal';
  const expresiva = variacion !== null && variacion >= 8;

  // Voz fuerte: alegre si sube y baja mucho, enojada si es fuerte y pareja; voz baja: preocupada
  let tono = null;
  if (intensidad === 'alta') tono = expresiva ? 'Alegre' : 'Enojado';
  else if (intensidad === 'baja') tono = 'Preocupado';
  else if (ritmo === 'lento' && !expresiva) tono = 'Formal';
  else if (expresiva) tono = 'Amigable';

  const descripcion = [
    intensidad === 'alta' ? 'hablo fuerte' : intensidad === 'baja' ? 'hablo bajito' : 'hablo con volumen normal',
    ritmo === 'rapido' ? 'rapido' : ritmo === 'lento' ? 'despacio' : 'a ritmo normal',
    expresiva ? 'con mucha variacion en la voz' : 'con la voz pareja',
  ].join(', ');

  // Para la voz de salida: imitar la velocidad de quien hablo (1 = normal), dentro de un rango natural
  const ritmoSalida = velocidad > 0 ? Number(limitar(velocidad / 2.5, 0.85, 1.2).toFixed(2)) : 1;
  return { tono, intensidad, ritmo, expresiva, velocidad: Number(velocidad.toFixed(2)), descripcion, ritmoSalida };
}

// Lo que dicen las palabras manda; si el texto es neutro, decide la voz
function combinarTono(tonoTexto, prosodia) {
  if (tonoTexto && tonoTexto !== 'Neutral') return tonoTexto;
  return (prosodia && prosodia.tono) || tonoTexto || 'Neutral';
}

module.exports = { analizarProsodia, combinarTono };
