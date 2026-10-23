// Caso de uso: traducir un mensaje (ADR-004, ADR-013). Recibe los motores ya armados (adaptadores
// del puerto MotorTraduccion) y los prueba en orden; usa el primero que responde. Si un motor falla,
// se salta por un tiempo (Circuit Breaker) para no esperar su timeout en cada mensaje.
// No conoce Qwen, Claude ni HTTP: solo el contrato del puerto.
const { detectarTono, detectarRegionOrigen } = require('../dominio/analisis');
const { MOTOR_TRADUCCION, asegurarPuerto } = require('../puertos');

function crearServicioTraduccion({ motores, log, esperaTrasFalloMs = 60 * 1000, ahora = Date.now }) {
  if (!Array.isArray(motores) || !motores.length) throw new Error('El servicio de traduccion necesita al menos un motor');
  motores.forEach((m) => asegurarPuerto('motor de traduccion', m, MOTOR_TRADUCCION));
  const caidos = new Map(); // nombre del motor -> hasta cuando no se intenta

  const activos = () => motores.filter((m) => m.disponible());
  const cadena = () => activos().map((m) => m.nombre);

  // Conversacion-RN-3: el par de idiomas debe estar soportado por algun motor activo
  const soportaPar = (origen, destino) => origen !== destino && activos().some((m) => m.soportaPar(origen, destino));

  // entrada: { texto, origen: {codigo, nombre}, destino: {codigo, nombre}, regionDestino?: {nombre, paisCodigo}, tonos: [nombres] }
  async function traducir(entrada) {
    const tonoLocal = detectarTono(entrada.texto);
    const regionLocal = detectarRegionOrigen(entrada.texto);
    const conRegion = { ...entrada, regionOrigen: regionLocal ? regionLocal.region : null };
    const par = `${entrada.origen.codigo}>${entrada.destino.codigo}`;
    const errores = [];

    for (const motor of activos()) {
      if (!motor.soportaPar(entrada.origen.codigo, entrada.destino.codigo)) continue;
      if ((caidos.get(motor.nombre) || 0) > ahora()) continue;
      try {
        const r = await motor.traducir(conRegion);
        caidos.delete(motor.nombre);
        return {
          traduccion: r.traduccion,
          nota: r.nota || null,
          aproximada: !!r.aproximada,
          tono: r.tono || tonoLocal,
          regionOrigen: r.regionOrigen || conRegion.regionOrigen,
          motor: motor.etiqueta(),
        };
      } catch (e) {
        caidos.set(motor.nombre, ahora() + esperaTrasFalloMs);
        errores.push(`${motor.nombre}: ${e.message}`);
        log.advertencia('motor_no_respondio', { motor: motor.nombre, detalle: e.message });
      }
    }
    throw new Error(`Ningun motor pudo traducir ${par}. ${errores.join(' | ')}`);
  }

  return { traducir, soportaPar, cadena, modo: () => cadena()[0], reiniciarEstado: () => caidos.clear() };
}

module.exports = { crearServicioTraduccion };
