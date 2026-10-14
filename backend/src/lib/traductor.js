// Fachada del traductor: elige Claude si hay clave, y cae al motor local si falla o no hay clave.
const { detectarIdioma, detectarTono, detectarRegionOrigen } = require('./analisis');
const { traducirLocal, PARES_LOCALES } = require('./motorLocal');
const { traducirClaude } = require('./motorClaude');

function modo() {
  const t = (process.env.TRADUCTOR || 'auto').toLowerCase();
  if (t === 'local') return 'local';
  if (t === 'claude') return 'claude';
  return process.env.ANTHROPIC_API_KEY ? 'claude' : 'local';
}

// Conversacion-RN-3: el par origen-destino debe estar soportado
function soportaPar(origen, destino) {
  if (origen === destino) return false;
  if (modo() === 'claude') return true;
  return PARES_LOCALES.includes(`${origen}>${destino}`);
}

// entrada: { texto, origen: {codigo, nombre}, destino: {codigo, nombre}, regionDestino?: {nombre, paisCodigo}, tonos: [nombres] }
async function traducir(entrada, opciones = {}) {
  const tonoLocal = detectarTono(entrada.texto);
  const regionLocal = detectarRegionOrigen(entrada.texto);
  if (modo() === 'claude') {
    try {
      const r = await traducirClaude(
        { ...entrada, regionDestino: entrada.regionDestino && entrada.regionDestino.nombre, regionOrigen: regionLocal && regionLocal.region },
        opciones
      );
      return { ...r, tono: r.tono || tonoLocal, regionOrigen: r.regionOrigen || (regionLocal && regionLocal.region) || null, motor: 'claude' };
    } catch (e) {
      console.warn('[talklate] Claude fallo, uso el motor local:', e.message);
      if (!soportaPar(entrada.origen.codigo, entrada.destino.codigo) && !PARES_LOCALES.includes(`${entrada.origen.codigo}>${entrada.destino.codigo}`)) throw e;
    }
  }
  const r = traducirLocal(entrada.texto, entrada.origen.codigo, entrada.destino.codigo, entrada.regionDestino && entrada.regionDestino.paisCodigo);
  return { traduccion: r.traduccion, nota: r.nota, aproximada: r.aproximada, tono: tonoLocal, regionOrigen: regionLocal ? regionLocal.region : null, motor: 'local' };
}

module.exports = { traducir, soportaPar, detectarIdioma, detectarTono, detectarRegionOrigen, modo };
