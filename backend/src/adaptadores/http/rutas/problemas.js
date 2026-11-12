// Adaptador HTTP (entrada) de los problemas generales de la app (aplicacion/problemas.js).
const express = require('express');
const { requerirSesion, requerirAdmin, ruta } = require('../sesion');
const { paginar } = require('../../../aplicacion/paginacion');

module.exports = function rutasProblemas({ problemas, sesiones }) {
  const r = express.Router();
  r.use(['/problemas', '/admin'], requerirSesion(sesiones));

  r.post('/problemas', ruta(async (req, res) => {
    const p = await problemas.reportar(req.usuario, req.body || {});
    res.status(201).json(p);
  }));

  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.get('/problemas', ruta(async (req, res) => {
    res.json(paginar(await problemas.listar(req.usuario, req.query.estado), req.query));
  }));

  admin.patch('/problemas/:id', ruta(async (req, res) => {
    res.json(await problemas.actualizar(req.usuario, req.params.id, req.body || {}));
  }));

  r.use('/admin', admin);
  return r;
};
