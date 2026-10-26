// Caso de uso: convertir una traduccion en voz natural con la emocion del mensaje (ADR-015).
// Prueba los sintetizadores en orden; si ninguno esta configurado responde 503 y la app usa la voz
// del celular. El audio queda unos minutos en memoria con un id aleatorio para que el reproductor
// lo pida por URL (asi no hay que guardar archivos en el celular).
const crypto = require('node:crypto');
const { ErrorNegocio } = require('../dominio/errores');

const TONOS = ['Neutral', 'Alegre', 'Enojado', 'Amigable', 'Preocupado', 'Formal'];

function crearServicioVoz({ sintetizadores = [], log, vidaMs = 5 * 60 * 1000, maximo = 200 } = {}) {
  const audios = new Map();

  function guardar(audio) {
    const ahora = Date.now();
    for (const [k, v] of audios) if (v.vence < ahora) audios.delete(k);
    while (audios.size >= maximo) audios.delete(audios.keys().next().value);
    const id = crypto.randomBytes(16).toString('hex');
    audios.set(id, { ...audio, vence: ahora + vidaMs });
    return id;
  }

  return {
    disponible: () => sintetizadores.some((s) => s.disponible()),
    motores: () => sintetizadores.filter((s) => s.disponible()).map((s) => s.nombre),
    async sintetizar(datos = {}) {
      const texto = String(datos.texto || '').trim();
      if (!texto) throw new ErrorNegocio(400, 'Falta el texto que se va a decir.');
      if (texto.length > 1000) throw new ErrorNegocio(400, 'El texto es muy largo para decirlo en voz (maximo 1000 caracteres).');
      const idioma = String(datos.idioma || '').toLowerCase().slice(0, 5);
      if (!/^[a-z]{2}$/.test(idioma)) throw new ErrorNegocio(400, 'Indica el idioma con su codigo de dos letras (ej. es, en).');
      const entrada = { texto, idioma, pais: datos.pais || null, tono: TONOS.includes(datos.tono) ? datos.tono : 'Neutral', ritmo: Number(datos.ritmo) || 1 };
      for (const s of sintetizadores.filter((x) => x.disponible())) {
        try {
          const r = await s.sintetizar(entrada);
          return { id: guardar(r), tipo: r.tipo, motor: s.nombre, voz: r.voz, tono: entrada.tono };
        } catch (e) {
          log.advertencia('sintesis_fallida', { motor: s.nombre, detalle: e.message });
        }
      }
      throw new ErrorNegocio(503, 'La voz natural no esta disponible; se usa la voz del celular.');
    },
    audio(id) {
      const a = audios.get(String(id));
      if (!a || a.vence < Date.now()) throw new ErrorNegocio(404, 'Ese audio ya no esta disponible.');
      return a;
    },
  };
}

module.exports = { crearServicioVoz };
