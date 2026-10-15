const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, noEncontrado, conflicto } = require('../lib/errores');
const { requerirSesion, requerirAdmin } = require('../lib/auth');
const { descifrar } = require('../lib/cifrado');
const { paginar } = require('./conversaciones');
const V = require('../lib/validaciones');
const log = require('../lib/log');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const formato = (f) => ({ ...f, original: descifrar(f.original), traduccion: descifrar(f.traduccion) });

module.exports = function reportesRouter(repo) {
  const r = express.Router();
  r.use(['/reportes', '/admin'], requerirSesion(repo));

  // HU Reportar una mala traduccion
  r.post('/reportes', ruta(async (req, res) => {
    const b = req.body || {};
    const propio = typeof b.mensaje_destino_id === 'string' ? await repo.reportes.mensajeDestinoPropio(b.mensaje_destino_id, req.usuario.id) : null;
    if (!propio) throw noEncontrado('No encontramos esa traduccion.');
    const motivo = V.texto(b.motivo);
    if (motivo.length < 3 || motivo.length > 500) throw mal('Cuentanos brevemente que estuvo mal (entre 3 y 500 caracteres).');
    const sugerencia = V.texto(b.sugerencia).slice(0, 1000) || null;
    if (await repo.reportes.existe(propio.id, req.usuario.id)) {
      throw conflicto('Ya reportaste esta traduccion. Gracias por ayudarnos a mejorar.');
    }
    const id = randomUUID();
    await repo.reportes.crear({ id, mdId: propio.id, usuarioId: req.usuario.id, motivo, sugerencia, estado: 'abierto', fecha: new Date().toISOString() });
    log.info('reporte_creado', { usuario_id: req.usuario.id, reporte_id: id });
    res.status(201).location(`/api/v1/admin/reportes/${id}`).json({ id, estado: 'abierto', mensaje: 'Gracias por tu reporte. Nos ayuda a mejorar las traducciones.' });
  }));

  // HU Revisar los reportes de mala traduccion (administrador)
  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.get('/reportes', ruta(async (req, res) => {
    const estado = ['abierto', 'revisado', 'descartado'].includes(req.query.estado) ? req.query.estado : null;
    const filas = await repo.reportes.listar({ estado });
    log.info('acceso_reportes', { usuario_id: req.usuario.id, estado });
    res.json(paginar(filas.map(formato), req.query));
  }));

  admin.get('/reportes/:id', ruta(async (req, res, next) => {
    const f = await repo.reportes.porId(req.params.id);
    if (!f) return next(noEncontrado('No encontramos ese reporte.'));
    res.json(formato(f));
  }));

  admin.patch('/reportes/:id', ruta(async (req, res) => {
    const existente = await repo.reportes.porId(req.params.id);
    if (!existente) throw noEncontrado('No encontramos ese reporte.');
    const estado = (req.body || {}).estado;
    if (!['abierto', 'revisado', 'descartado'].includes(estado)) throw mal('El estado debe ser abierto, revisado o descartado.');
    await repo.reportes.actualizar(existente.id, estado, V.texto((req.body || {}).nota_admin).slice(0, 1000) || null);
    log.info('reporte_actualizado', { usuario_id: req.usuario.id, reporte_id: existente.id, estado });
    res.json(formato(await repo.reportes.porId(existente.id)));
  }));

  r.use('/admin', admin);
  return r;
};
