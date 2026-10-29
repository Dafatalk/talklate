// Adaptador HTTP (entrada) de la voz natural (aplicacion/voz.js). POST /voz pide sesion; el audio se
// descarga por GET /voz/audio/:id con un id aleatorio de un solo uso corto (vence en minutos).
const express = require('express');
const { requerirSesion, ruta } = require('../sesion');
const { crearLimite, porUsuario } = require('../limites');

module.exports = function rutasVoz({ voz, sesiones }) {
  const r = express.Router();
  const limite = crearLimite({ maximo: Number(process.env.LIMITE_VOZ_POR_MINUTO) || 40, ventanaMs: 60 * 1000, clave: porUsuario, mensaje: 'Estas pidiendo voces muy rapido. Espera un momento.' });

  r.post('/voz', requerirSesion(sesiones), limite, ruta(async (req, res) => {
    const s = await voz.sintetizar(req.body || {});
    res.status(201).json({ ...s, url: `/api/v1/voz/audio/${s.id}` });
  }));

  r.get('/voz/audio/:id', ruta(async (req, res) => {
    const a = voz.audio(req.params.id);
    res.set('Cache-Control', 'private, max-age=300').type(a.tipo).send(a.audio);
  }));
  return r;
};
