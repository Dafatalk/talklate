// Caso de uso: catalogo de idiomas y regiones (epica Administracion de idiomas y regiones).
// Solo usa el puerto Repositorio; no conoce HTTP.
const { randomUUID } = require('node:crypto');
const { mal, conflicto, noEncontrado } = require('../dominio/errores');
const V = require('../dominio/validaciones');

const aBool = (v) => v === true || v === 1 || v === '1' || v === 'true';

function crearServicioCatalogo({ repo, log }) {
  const idiomaCompleto = async (id) => (await repo.catalogo.obtener({ todos: true })).idiomas.find((i) => i.id === id);

  async function asegurarIdiomas(ids) {
    for (const id of ids) if (!(await repo.catalogo.existeLenguaje(id))) throw mal('Uno de los idiomas indicados no existe.');
  }

  // HU Consultar idiomas disponibles (el administrador puede ver tambien los inactivos)
  const consultar = (usuario, verTodos) => repo.catalogo.obtener({ todos: usuario.rol === 'admin' && verTodos });

  // HU Agregar un idioma (combinaciones unicas: nombre y codigo)
  async function crearIdioma(usuario, datos) {
    const nombre = V.texto(datos.nombre);
    const codigo = V.texto(datos.codigo).toLowerCase();
    if (nombre.length < 1 || nombre.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
    if (!/^[a-z]{2,5}$/.test(codigo)) throw mal('El codigo del idioma debe tener entre 2 y 5 letras (ej. es, en, fr).');
    if (await repo.catalogo.existeLenguajeNombreOCodigo(nombre, codigo)) throw conflicto('Ya existe un idioma con ese nombre o codigo.');
    const id = randomUUID();
    await repo.catalogo.crearLenguaje({ id, nombre, codigo, activo: aBool(datos.activo) });
    for (const rid of datos.regiones || []) await repo.catalogo.addRegionLenguaje(id, rid);
    log.info('catalogo_idioma_creado', { usuario_id: usuario.id, lenguaje_id: id });
    return idiomaCompleto(id);
  }

  // HU Activar o desactivar un idioma (y renombrarlo o cambiar sus regiones)
  async function modificarIdioma(usuario, id, datos) {
    const idioma = await repo.catalogo.lenguajePorId(id);
    if (!idioma) throw noEncontrado('No encontramos ese idioma.');
    if (datos.nombre !== undefined) {
      const n = V.texto(datos.nombre);
      if (!n || n.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
      if (await repo.catalogo.existeOtroLenguajeConNombre(n, idioma.id)) throw conflicto('Ya existe un idioma con ese nombre.');
      await repo.catalogo.renombrarLenguaje(idioma.id, n);
    }
    if (datos.activo !== undefined) await repo.catalogo.activarLenguaje(idioma.id, aBool(datos.activo));
    if (Array.isArray(datos.regiones)) {
      for (const rid of datos.regiones) if (!(await repo.catalogo.existeRegion(rid))) throw mal('Una de las regiones indicadas no existe.');
      await repo.catalogo.setRegionesLenguaje(idioma.id, datos.regiones);
    }
    log.info('catalogo_idioma_modificado', { usuario_id: usuario.id, lenguaje_id: idioma.id, activo: datos.activo });
    return idiomaCompleto(idioma.id);
  }

  // HU Agregar una region (combinacion unica: nombre dentro del pais)
  async function crearRegion(usuario, datos) {
    const nombre = V.texto(datos.nombre);
    const paisNombre = V.texto(datos.pais);
    if (nombre.length < 2 || nombre.length > 100) throw mal('El nombre de la region debe tener entre 2 y 100 caracteres.');
    if (!paisNombre) throw mal('Indica el pais de la region.');
    let pais = await repo.catalogo.paisPorNombre(paisNombre);
    if (!pais) {
      const cod = V.texto(datos.pais_codigo).toUpperCase();
      if (!/^[A-Z]{2}$/.test(cod)) throw mal('El pais no existe: indica su codigo de 2 letras (ej. CO) para crearlo.');
      if (await repo.catalogo.existePaisCodigo(cod)) throw conflicto('Ya existe un pais con ese codigo.');
      pais = await repo.catalogo.crearPais({ id: randomUUID(), nombre: paisNombre, codigo: cod });
    }
    if (await repo.catalogo.existeRegionEnPais(nombre, pais.id)) throw conflicto('Esa region ya existe en ese pais.');
    const idiomas = Array.isArray(datos.idiomas) ? datos.idiomas : [];
    await asegurarIdiomas(idiomas);
    const id = randomUUID();
    await repo.catalogo.crearRegion({ id, nombre, pais_id: pais.id });
    for (const l of idiomas) await repo.catalogo.addRegionLenguaje(l, id);
    log.info('catalogo_region_creada', { usuario_id: usuario.id, region_id: id });
    return repo.catalogo.regionPorId(id);
  }

  async function idioma(id) {
    const i = await idiomaCompleto(id);
    if (!i) throw noEncontrado('No encontramos ese idioma.');
    return i;
  }

  async function region(id) {
    const r = await repo.catalogo.regionPorId(id);
    if (!r) throw noEncontrado('No encontramos esa region.');
    return r;
  }

  return { consultar, crearIdioma, modificarIdioma, crearRegion, idioma, region };
}

module.exports = { crearServicioCatalogo };
