const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, noEncontrado, conflicto } = require('../lib/errores');
const { requerirSesion, requerirAdmin } = require('../lib/auth');
const { descifrar } = require('../lib/cifrado');
const { paginar } = require('./conversaciones');
const V = require('../lib/validaciones');
const log = require('../lib/log');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const CONSULTA = `
  SELECT rp.id, rp.motivo, rp.sugerencia, rp.estado, rp.nota_admin, rp.fecha, rp.mensaje_destino_id,
         mo.contenido AS original, md.contenido_traducido AS traduccion, md.nota_cultural, md.motor,
         lo.codigo AS idioma_origen, ld.codigo AS idioma_destino, u.nombre || ' ' || u.apellido AS reportado_por
  FROM reporte rp
  JOIN mensaje_destino md ON md.id = rp.mensaje_destino_id
  JOIN mensaje_original mo ON mo.id = md.mensaje_original_id
  JOIN lenguaje_por_conversacion lpo ON lpo.id = mo.lenguaje_conversacion_id
  JOIN lenguaje lo ON lo.id = lpo.lenguaje_id
  JOIN lenguaje_por_conversacion lpd ON lpd.id = md.lenguaje_conversacion_id
  JOIN lenguaje ld ON ld.id = lpd.lenguaje_id
  JOIN usuario u ON u.id = rp.usuario_id`;

const formato = (f) => ({ ...f, original: descifrar(f.original), traduccion: descifrar(f.traduccion) });

module.exports = function reportesRouter(db) {
  const r = express.Router();
  r.use(['/reportes', '/admin'], requerirSesion(db));

  // HU Reportar una mala traduccion
  r.post('/reportes', ruta(async (req, res) => {
    const b = req.body || {};
    const propio = typeof b.mensaje_destino_id === 'string' && db.prepare(`
      SELECT md.id FROM mensaje_destino md
      JOIN mensaje_original mo ON mo.id = md.mensaje_original_id
      JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
      JOIN conversacion c ON c.id = lpc.conversacion_id
      WHERE md.id = ? AND c.usuario_id = ?`).get(b.mensaje_destino_id, req.usuario.id);
    if (!propio) throw noEncontrado('No encontramos esa traduccion.');
    const motivo = V.texto(b.motivo);
    if (motivo.length < 3 || motivo.length > 500) throw mal('Cuentanos brevemente que estuvo mal (entre 3 y 500 caracteres).');
    const sugerencia = V.texto(b.sugerencia).slice(0, 1000) || null;
    if (db.prepare('SELECT 1 FROM reporte WHERE mensaje_destino_id = ? AND usuario_id = ?').get(propio.id, req.usuario.id)) {
      throw conflicto('Ya reportaste esta traduccion. Gracias por ayudarnos a mejorar.');
    }
    const id = randomUUID();
    db.prepare('INSERT INTO reporte (id, mensaje_destino_id, usuario_id, motivo, sugerencia, estado, fecha) VALUES (?,?,?,?,?,?,?)')
      .run(id, propio.id, req.usuario.id, motivo, sugerencia, 'abierto', new Date().toISOString());
    log.info('reporte_creado', { usuario_id: req.usuario.id, reporte_id: id });
    res.status(201).location(`/api/v1/admin/reportes/${id}`).json({ id, estado: 'abierto', mensaje: 'Gracias por tu reporte. Nos ayuda a mejorar las traducciones.' });
  }));

  // HU Revisar los reportes de mala traduccion (administrador)
  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.get('/reportes', (req, res) => {
    const estado = ['abierto', 'revisado', 'descartado'].includes(req.query.estado) ? req.query.estado : null;
    const filas = db.prepare(`${CONSULTA} ${estado ? 'WHERE rp.estado = ?' : ''}
      ORDER BY CASE rp.estado WHEN 'abierto' THEN 0 ELSE 1 END, rp.fecha DESC`).all(...(estado ? [estado] : []));
    log.info('acceso_reportes', { usuario_id: req.usuario.id, estado });
    res.json(paginar(filas.map(formato), req.query));
  });

  admin.get('/reportes/:id', (req, res, next) => {
    const f = db.prepare(`${CONSULTA} WHERE rp.id = ?`).get(req.params.id);
    if (!f) return next(noEncontrado('No encontramos ese reporte.'));
    res.json(formato(f));
  });

  admin.patch('/reportes/:id', ruta(async (req, res) => {
    const rp = db.prepare('SELECT id FROM reporte WHERE id = ?').get(req.params.id);
    if (!rp) throw noEncontrado('No encontramos ese reporte.');
    const estado = (req.body || {}).estado;
    if (!['abierto', 'revisado', 'descartado'].includes(estado)) throw mal('El estado debe ser abierto, revisado o descartado.');
    db.prepare('UPDATE reporte SET estado = ?, nota_admin = ? WHERE id = ?').run(estado, V.texto((req.body || {}).nota_admin).slice(0, 1000) || null, rp.id);
    log.info('reporte_actualizado', { usuario_id: req.usuario.id, reporte_id: rp.id, estado });
    res.json(formato(db.prepare(`${CONSULTA} WHERE rp.id = ?`).get(rp.id)));
  }));

  r.use('/admin', admin);
  return r;
};
