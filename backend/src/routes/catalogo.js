const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, conflicto, noEncontrado } = require('../lib/errores');
const log = require('../lib/log');
const { requerirSesion, requerirAdmin } = require('../lib/auth');
const V = require('../lib/validaciones');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const aBool = (v) => v === true || v === 1 || v === '1' || v === 'true';

async function asegurarIdiomas(repo, ids) {
  for (const id of ids) if (!(await repo.catalogo.existeLenguaje(id))) throw mal('Uno de los idiomas indicados no existe.');
}

module.exports = function catalogoRouter(repo) {
  const r = express.Router();
  r.use(['/catalogo', '/admin'], requerirSesion(repo));

  // HU Consultar idiomas disponibles
  r.get('/catalogo', ruta(async (req, res) => {
    res.json(await repo.catalogo.obtener({ todos: req.usuario.rol === 'admin' && req.query.todos === '1' }));
  }));

  // HU Administrar idiomas y regiones (solo administrador)
  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.post('/idiomas', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.texto(b.nombre);
    const codigo = V.texto(b.codigo).toLowerCase();
    if (nombre.length < 1 || nombre.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
    if (!/^[a-z]{2,5}$/.test(codigo)) throw mal('El codigo del idioma debe tener entre 2 y 5 letras (ej. es, en, fr).');
    if (await repo.catalogo.existeLenguajeNombreOCodigo(nombre, codigo)) throw conflicto('Ya existe un idioma con ese nombre o codigo.');
    const id = randomUUID();
    await repo.catalogo.crearLenguaje({ id, nombre, codigo, activo: aBool(b.activo) });
    for (const rid of b.regiones || []) await repo.catalogo.addRegionLenguaje(id, rid);
    log.info('catalogo_idioma_creado', { usuario_id: req.usuario.id, lenguaje_id: id });
    res.status(201).location(`/api/v1/admin/idiomas/${id}`).json((await repo.catalogo.obtener({ todos: true })).idiomas.find((i) => i.id === id));
  }));

  admin.patch('/idiomas/:id', ruta(async (req, res) => {
    const idioma = await repo.catalogo.lenguajePorId(req.params.id);
    if (!idioma) throw noEncontrado('No encontramos ese idioma.');
    const b = req.body || {};
    if (b.nombre !== undefined) {
      const n = V.texto(b.nombre);
      if (!n || n.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
      if (await repo.catalogo.existeOtroLenguajeConNombre(n, idioma.id)) throw conflicto('Ya existe un idioma con ese nombre.');
      await repo.catalogo.renombrarLenguaje(idioma.id, n);
    }
    if (b.activo !== undefined) await repo.catalogo.activarLenguaje(idioma.id, aBool(b.activo));
    if (Array.isArray(b.regiones)) {
      for (const rid of b.regiones) if (!(await repo.catalogo.existeRegion(rid))) throw mal('Una de las regiones indicadas no existe.');
      await repo.catalogo.setRegionesLenguaje(idioma.id, b.regiones);
    }
    log.info('catalogo_idioma_modificado', { usuario_id: req.usuario.id, lenguaje_id: idioma.id, activo: b.activo });
    res.json((await repo.catalogo.obtener({ todos: true })).idiomas.find((i) => i.id === idioma.id));
  }));

  admin.post('/regiones', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.texto(b.nombre);
    const paisNombre = V.texto(b.pais);
    if (nombre.length < 2 || nombre.length > 100) throw mal('El nombre de la region debe tener entre 2 y 100 caracteres.');
    if (!paisNombre) throw mal('Indica el pais de la region.');
    let pais = await repo.catalogo.paisPorNombre(paisNombre);
    if (!pais) {
      const cod = V.texto(b.pais_codigo).toUpperCase();
      if (!/^[A-Z]{2}$/.test(cod)) throw mal('El pais no existe: indica su codigo de 2 letras (ej. CO) para crearlo.');
      if (await repo.catalogo.existePaisCodigo(cod)) throw conflicto('Ya existe un pais con ese codigo.');
      pais = await repo.catalogo.crearPais({ id: randomUUID(), nombre: paisNombre, codigo: cod });
    }
    if (await repo.catalogo.existeRegionEnPais(nombre, pais.id)) throw conflicto('Esa region ya existe en ese pais.');
    const idiomas = Array.isArray(b.idiomas) ? b.idiomas : [];
    await asegurarIdiomas(repo, idiomas);
    const id = randomUUID();
    await repo.catalogo.crearRegion({ id, nombre, pais_id: pais.id });
    for (const l of idiomas) await repo.catalogo.addRegionLenguaje(l, id);
    log.info('catalogo_region_creada', { usuario_id: req.usuario.id, region_id: id });
    res.status(201).location(`/api/v1/admin/regiones/${id}`).json(await repo.catalogo.regionPorId(id));
  }));

  admin.get('/idiomas/:id', ruta(async (req, res, next) => {
    const i = (await repo.catalogo.obtener({ todos: true })).idiomas.find((x) => x.id === req.params.id);
    if (!i) return next(noEncontrado('No encontramos ese idioma.'));
    res.json(i);
  }));

  admin.get('/regiones/:id', ruta(async (req, res, next) => {
    const r2 = await repo.catalogo.regionPorId(req.params.id);
    if (!r2) return next(noEncontrado('No encontramos esa region.'));
    res.json(r2);
  }));

  r.use('/admin', admin);
  return r;
};
