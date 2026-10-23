// Adaptador HTTP (entrada) del catalogo de idiomas y regiones (aplicacion/catalogo.js).
const express = require('express');
const { requerirSesion, requerirAdmin, ruta } = require('../sesion');

module.exports = function rutasCatalogo({ catalogo, sesiones }) {
  const r = express.Router();
  r.use(['/catalogo', '/admin'], requerirSesion(sesiones));

  r.get('/catalogo', ruta(async (req, res) => {
    res.json(await catalogo.consultar(req.usuario, req.query.todos === '1'));
  }));

  // Solo administrador
  const admin = express.Router();
  admin.use(requerirAdmin);

  admin.post('/idiomas', ruta(async (req, res) => {
    const i = await catalogo.crearIdioma(req.usuario, req.body || {});
    res.status(201).location(`/api/v1/admin/idiomas/${i.id}`).json(i);
  }));

  admin.patch('/idiomas/:id', ruta(async (req, res) => {
    res.json(await catalogo.modificarIdioma(req.usuario, req.params.id, req.body || {}));
  }));

  admin.get('/idiomas/:id', ruta(async (req, res) => {
    res.json(await catalogo.idioma(req.params.id));
  }));

  admin.post('/regiones', ruta(async (req, res) => {
    const reg = await catalogo.crearRegion(req.usuario, req.body || {});
    res.status(201).location(`/api/v1/admin/regiones/${reg.id}`).json(reg);
  }));

  admin.get('/regiones/:id', ruta(async (req, res) => {
    res.json(await catalogo.region(req.params.id));
  }));

  r.use('/admin', admin);
  return r;
};
