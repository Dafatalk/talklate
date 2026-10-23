// Caso de uso: reportes de mala traduccion (epica Reportes). Solo usa puertos (Repositorio, Cifrador).
const { randomUUID } = require('node:crypto');
const { mal, noEncontrado, conflicto } = require('../dominio/errores');
const V = require('../dominio/validaciones');

const ESTADOS = ['abierto', 'revisado', 'descartado'];

function crearServicioReportes({ repo, cifrador, log }) {
  const formato = (f) => ({ ...f, original: cifrador.descifrar(f.original), traduccion: cifrador.descifrar(f.traduccion) });

  // HU Reportar una mala traduccion: solo las propias y una sola vez
  async function reportar(usuario, datos) {
    const propio = typeof datos.mensaje_destino_id === 'string' ? await repo.reportes.mensajeDestinoPropio(datos.mensaje_destino_id, usuario.id) : null;
    if (!propio) throw noEncontrado('No encontramos esa traduccion.');
    const motivo = V.texto(datos.motivo);
    if (motivo.length < 3 || motivo.length > 500) throw mal('Cuentanos brevemente que estuvo mal (entre 3 y 500 caracteres).');
    const sugerencia = V.texto(datos.sugerencia).slice(0, 1000) || null;
    if (await repo.reportes.existe(propio.id, usuario.id)) throw conflicto('Ya reportaste esta traduccion. Gracias por ayudarnos a mejorar.');
    const id = randomUUID();
    await repo.reportes.crear({ id, mdId: propio.id, usuarioId: usuario.id, motivo, sugerencia, estado: 'abierto', fecha: new Date().toISOString() });
    log.info('reporte_creado', { usuario_id: usuario.id, reporte_id: id });
    return { id, estado: 'abierto', mensaje: 'Gracias por tu reporte. Nos ayuda a mejorar las traducciones.' };
  }

  // HU Revisar los reportes de mala traduccion (administrador)
  async function listar(usuario, estadoEntrada) {
    const estado = ESTADOS.includes(estadoEntrada) ? estadoEntrada : null;
    const filas = await repo.reportes.listar({ estado });
    log.info('acceso_reportes', { usuario_id: usuario.id, estado });
    return filas.map(formato);
  }

  async function ver(id) {
    const f = await repo.reportes.porId(id);
    if (!f) throw noEncontrado('No encontramos ese reporte.');
    return formato(f);
  }

  async function actualizar(usuario, id, datos) {
    const existente = await repo.reportes.porId(id);
    if (!existente) throw noEncontrado('No encontramos ese reporte.');
    if (!ESTADOS.includes(datos.estado)) throw mal('El estado debe ser abierto, revisado o descartado.');
    await repo.reportes.actualizar(existente.id, datos.estado, V.texto(datos.nota_admin).slice(0, 1000) || null);
    log.info('reporte_actualizado', { usuario_id: usuario.id, reporte_id: existente.id, estado: datos.estado });
    return formato(await repo.reportes.porId(existente.id));
  }

  return { reportar, listar, ver, actualizar };
}

module.exports = { crearServicioReportes };
