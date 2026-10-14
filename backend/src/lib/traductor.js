// Fachada del traductor. Prueba los motores en orden y usa el primero que responde:
//   auto (por defecto): Qwen local (Ollama) -> Claude Sonnet (si hay ANTHROPIC_API_KEY) -> motor de reglas
//   qwen: Qwen -> reglas · claude: Claude -> reglas · local: solo reglas
const { detectarIdioma, detectarTono, detectarRegionOrigen } = require('./analisis');
const { traducirLocal, PARES_LOCALES } = require('./motorLocal');
const { traducirClaude, disponible: hayClaude, MODELO: MODELO_CLAUDE } = require('./motorClaude');
const { traducirQwen, MODELO: modeloQwen } = require('./motorQwen');
const log = require('./log');

const ESPERA_TRAS_FALLO_MS = 60 * 1000;
const caidos = new Map(); // motor -> hasta cuando no se intenta (para no esperar el timeout en cada mensaje)

function cadena() {
  const t = (process.env.TRADUCTOR || 'auto').toLowerCase();
  if (t === 'local') return ['local'];
  if (t === 'qwen') return ['qwen', 'local'];
  if (t === 'claude') return ['claude', 'local'];
  return hayClaude() ? ['qwen', 'claude', 'local'] : ['qwen', 'local'];
}

// Nombre del motor "principal" (primero de la cadena) para mostrar en /salud
const modo = () => cadena()[0];
const hayIA = () => cadena().some((m) => m !== 'local');

// Conversacion-RN-3: el par de idiomas debe estar soportado. Con IA cualquier par; solo con reglas, espanol e ingles.
function soportaPar(origen, destino) {
  if (origen === destino) return false;
  if (hayIA()) return true;
  return PARES_LOCALES.includes(`${origen}>${destino}`);
}

function reiniciarEstado() { caidos.clear(); }

// entrada: { texto, origen: {codigo, nombre}, destino: {codigo, nombre}, regionDestino?: {nombre, paisCodigo}, tonos: [nombres] }
async function traducir(entrada, opciones = {}) {
  const tonoLocal = detectarTono(entrada.texto);
  const regionLocal = detectarRegionOrigen(entrada.texto);
  const conRegion = { ...entrada, regionDestino: entrada.regionDestino && entrada.regionDestino.nombre, regionOrigen: regionLocal && regionLocal.region };
  const errores = [];

  for (const motor of cadena()) {
    if (motor === 'local') break;
    if ((caidos.get(motor) || 0) > Date.now()) continue;
    try {
      const r = motor === 'qwen' ? await traducirQwen(conRegion, opciones) : await traducirClaude(conRegion, opciones);
      caidos.delete(motor);
      return {
        ...r,
        tono: r.tono || tonoLocal,
        regionOrigen: r.regionOrigen || (regionLocal && regionLocal.region) || null,
        motor: motor === 'qwen' ? `qwen:${modeloQwen()}` : `claude:${MODELO_CLAUDE}`,
      };
    } catch (e) {
      caidos.set(motor, Date.now() + ESPERA_TRAS_FALLO_MS);
      errores.push(`${motor}: ${e.message}`);
      log.advertencia('motor_no_respondio', { motor, detalle: e.message });
    }
  }

  const par = `${entrada.origen.codigo}>${entrada.destino.codigo}`;
  if (!PARES_LOCALES.includes(par)) throw new Error(`Ningun motor pudo traducir ${par}. ${errores.join(' | ')}`);
  const r = traducirLocal(entrada.texto, entrada.origen.codigo, entrada.destino.codigo, entrada.regionDestino && entrada.regionDestino.paisCodigo);
  return { traduccion: r.traduccion, nota: r.nota, aproximada: r.aproximada, tono: tonoLocal, regionOrigen: regionLocal ? regionLocal.region : null, motor: 'local' };
}

module.exports = { traducir, soportaPar, detectarIdioma, detectarTono, detectarRegionOrigen, modo, cadena, reiniciarEstado };
