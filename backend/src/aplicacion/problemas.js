// Caso de uso: problemas generales de la app reportados por el usuario. Solo usa puertos (Repositorio).
const { randomUUID } = require('node:crypto');
const { mal, noEncontrado } = require('../dominio/errores');
const V = require('../dominio/validaciones');

const ESTADOS = ['abierto', 'revisado', 'descartado'];

function crearServicioProblemas({ repo, log }) {
  // HU Reportar un problema general: cualquier usuario autenticado puede reportar
  async function reportar(usuario, datos) {
    const descripcion = V.texto(datos.descripcion);
    if (descripcion.length < 5 || descripcion.length > 1000)
      throw mal('La descripcion debe tener entre 5 y 1000 caracteres.');
    const categoria = V.texto(datos.categoria).slice(0, 60) || null;
    const contacto = V.texto(datos.contacto).slice(0, 120) || null;
    const id = randomUUID();
    await repo.problemas.crear({ id, usuarioId: usuario.id, categoria, descripcion, contacto, estado: 'abierto', fecha: new Date().toISOString() });
    log.info('problema_creado', { usuario_id: usuario.id, problema_id: id });
    return { id, mensaje: 'Gracias, recibimos tu reporte.' };
  }

  // HU Revisar los problemas generales (administrador)
  async function listar(usuario, estadoEntrada) {
    const estado = ESTADOS.includes(estadoEntrada) ? estadoEntrada : null;
    const filas = await repo.problemas.listar({ estado });
    log.info('acceso_problemas', { usuario_id: usuario.id, estado });
    return filas;
  }

  async function actualizar(usuario, id, datos) {
    const existente = await repo.problemas.porId(id);
    if (!existente) throw noEncontrado('No encontramos ese problema.');
    if (!ESTADOS.includes(datos.estado)) throw mal('El estado debe ser abierto, revisado o descartado.');
    const nota = V.texto(datos.nota_admin).slice(0, 1000) || null;
    await repo.problemas.actualizar(existente.id, datos.estado, nota);
    log.info('problema_actualizado', { usuario_id: usuario.id, problema_id: existente.id, estado: datos.estado });
    return repo.problemas.porId(existente.id);
  }

  return { reportar, listar, actualizar };
}

module.exports = { crearServicioProblemas };
