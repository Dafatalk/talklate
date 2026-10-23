// Adaptador HTTP (entrada) de los reportes de mala traduccion (aplicacion/reportes.js).
const express = require('express');
const { requerirSesion, requerirAdmin, ruta } = require('../sesion');
const { paginar } = require('../../../aplicacion/paginacion');

module.exports = function rutasReportes({ reportes, sesiones }) {
  const r = express.Router();
  r.use(['/reportes', '/admin'], requerirSesion(sesiones));

  r.post('/reportes', ruta(async (req, res) => {
    const rep = await reportes.reportar(req.usuario, req.body || {});
    res.status(201).location(`/api/v1/admin/reportes/${rep.id}`).json(rep);
  }));

  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.get('/reportes', ruta(async (req, res) => {
    res.json(paginar(await reportes.listar(req.usuario, req.query.estado), req.query));
  }));

  admin.get('/reportes/:id', ruta(async (req, res) => {
    res.json(await reportes.ver(req.params.id));
  }));

  admin.patch('/reportes/:id', ruta(async (req, res) => {
    res.json(await reportes.actualizar(req.usuario, req.params.id, req.body || {}));
  }));

  r.use('/admin', admin);
  return r;
};
