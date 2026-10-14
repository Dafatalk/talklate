const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, conflicto, noEncontrado } = require('../lib/errores');
const { requerirSesion, requerirAdmin } = require('../lib/auth');
const V = require('../lib/validaciones');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const aBool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

function catalogo(db, { todos }) {
  const idiomas = db.prepare(`SELECT id, nombre, codigo, activo FROM lenguaje ${todos ? '' : 'WHERE activo = 1'} ORDER BY nombre`).all();
  const regiones = db.prepare(`
    SELECT lr.lenguaje_id, r.id, r.nombre, p.id AS pais_id, p.nombre AS pais_nombre, p.codigo AS pais_codigo
    FROM lenguaje_region lr JOIN region r ON r.id = lr.region_id JOIN pais p ON p.id = r.pais_id
    ORDER BY p.nombre, r.nombre`).all();
  return {
    idiomas: idiomas.map((i) => ({
      id: i.id, nombre: i.nombre, codigo: i.codigo, activo: !!i.activo,
      regiones: regiones.filter((r) => r.lenguaje_id === i.id).map((r) => ({ id: r.id, nombre: r.nombre, pais: { id: r.pais_id, nombre: r.pais_nombre, codigo: r.pais_codigo } })),
    })),
    entonaciones: db.prepare('SELECT id, nombre FROM entonacion WHERE activo = 1 ORDER BY nombre').all(),
    canales: db.prepare('SELECT id, nombre FROM canal ORDER BY nombre').all(),
  };
}

function asegurarIdiomas(db, ids) {
  for (const id of ids) if (!db.prepare('SELECT 1 FROM lenguaje WHERE id = ?').get(id)) throw mal('Uno de los idiomas indicados no existe.');
}

module.exports = function catalogoRouter(db) {
  const r = express.Router();
  r.use(requerirSesion(db));

  // HU Consultar idiomas disponibles
  r.get('/catalogo', (req, res) => {
    res.json(catalogo(db, { todos: req.usuario.rol === 'admin' && req.query.todos === '1' }));
  });

  // HU Administrar idiomas y regiones (solo administrador)
  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.post('/idiomas', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.texto(b.nombre);
    const codigo = V.texto(b.codigo).toLowerCase();
    if (nombre.length < 1 || nombre.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
    if (!/^[a-z]{2,5}$/.test(codigo)) throw mal('El codigo del idioma debe tener entre 2 y 5 letras (ej. es, en, fr).');
    if (db.prepare('SELECT 1 FROM lenguaje WHERE lower(nombre) = lower(?) OR codigo = ?').get(nombre, codigo)) throw conflicto('Ya existe un idioma con ese nombre o codigo.');
    const id = randomUUID();
    db.prepare('INSERT INTO lenguaje (id, nombre, codigo, activo) VALUES (?,?,?,?)').run(id, nombre, codigo, aBool(b.activo));
    for (const rid of b.regiones || []) db.prepare('INSERT OR IGNORE INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)').run(id, rid);
    res.status(201).json({ idioma: catalogo(db, { todos: true }).idiomas.find((i) => i.id === id) });
  }));

  admin.patch('/idiomas/:id', ruta(async (req, res) => {
    const idioma = db.prepare('SELECT * FROM lenguaje WHERE id = ?').get(req.params.id);
    if (!idioma) throw noEncontrado('No encontramos ese idioma.');
    const b = req.body || {};
    if (b.nombre !== undefined) {
      const n = V.texto(b.nombre);
      if (!n || n.length > 50) throw mal('El nombre del idioma es obligatorio (maximo 50 caracteres).');
      if (db.prepare('SELECT 1 FROM lenguaje WHERE lower(nombre) = lower(?) AND id <> ?').get(n, idioma.id)) throw conflicto('Ya existe un idioma con ese nombre.');
      db.prepare('UPDATE lenguaje SET nombre = ? WHERE id = ?').run(n, idioma.id);
    }
    if (b.activo !== undefined) db.prepare('UPDATE lenguaje SET activo = ? WHERE id = ?').run(aBool(b.activo), idioma.id);
    if (Array.isArray(b.regiones)) {
      db.prepare('DELETE FROM lenguaje_region WHERE lenguaje_id = ?').run(idioma.id);
      for (const rid of b.regiones) {
        if (!db.prepare('SELECT 1 FROM region WHERE id = ?').get(rid)) throw mal('Una de las regiones indicadas no existe.');
        db.prepare('INSERT OR IGNORE INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)').run(idioma.id, rid);
      }
    }
    res.json({ idioma: catalogo(db, { todos: true }).idiomas.find((i) => i.id === idioma.id) });
  }));

  admin.post('/regiones', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.texto(b.nombre);
    const paisNombre = V.texto(b.pais);
    if (nombre.length < 2 || nombre.length > 100) throw mal('El nombre de la region debe tener entre 2 y 100 caracteres.');
    if (!paisNombre) throw mal('Indica el pais de la region.');
    let pais = db.prepare('SELECT id FROM pais WHERE lower(nombre) = lower(?)').get(paisNombre);
    if (!pais) {
      const cod = V.texto(b.pais_codigo).toUpperCase();
      if (!/^[A-Z]{2}$/.test(cod)) throw mal('El pais no existe: indica su codigo de 2 letras (ej. CO) para crearlo.');
      if (db.prepare('SELECT 1 FROM pais WHERE codigo = ?').get(cod)) throw conflicto('Ya existe un pais con ese codigo.');
      pais = { id: randomUUID() };
      db.prepare('INSERT INTO pais (id, nombre, codigo) VALUES (?,?,?)').run(pais.id, paisNombre, cod);
    }
    if (db.prepare('SELECT 1 FROM region WHERE lower(nombre) = lower(?) AND pais_id = ?').get(nombre, pais.id)) throw conflicto('Esa region ya existe en ese pais.');
    const idiomas = Array.isArray(b.idiomas) ? b.idiomas : [];
    asegurarIdiomas(db, idiomas);
    const id = randomUUID();
    db.prepare('INSERT INTO region (id, nombre, pais_id) VALUES (?,?,?)').run(id, nombre, pais.id);
    for (const l of idiomas) db.prepare('INSERT OR IGNORE INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)').run(l, id);
    res.status(201).json({ region: { id, nombre, pais: paisNombre } });
  }));

  r.use('/admin', admin);
  return r;
};
