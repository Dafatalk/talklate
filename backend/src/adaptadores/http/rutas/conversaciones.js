// Adaptador HTTP (entrada) de conversaciones y mensajes: traduce peticiones a llamadas del caso de
// uso (aplicacion/conversaciones.js). Aqui solo hay HTTP: codigos, Location, paginacion y el limite
// de mensajes por usuario.
const express = require('express');
const { requerirSesion, ruta } = require('../sesion');
const { crearLimite, porUsuario } = require('../limites');
const { paginar } = require('../../../aplicacion/paginacion');

module.exports = function rutasConversaciones({ conversaciones, sesiones }) {
  const r = express.Router();
  r.use('/conversaciones', requerirSesion(sesiones));
  const limiteMensajes = crearLimite({
    maximo: Number(process.env.LIMITE_MENSAJES_POR_MINUTO) || 30,
    ventanaMs: 60 * 1000,
    clave: porUsuario,
    mensaje: 'Estas enviando mensajes muy rapido. Espera un momento e intenta de nuevo.',
  });
  const cuerpo = (req) => req.body || {};

  r.post('/conversaciones', ruta(async (req, res) => {
    const c = await conversaciones.crear(req.usuario.id, cuerpo(req));
    res.status(201).location(`/api/v1/conversaciones/${c.id}`).json(c);
  }));

  r.get('/conversaciones', ruta(async (req, res) => {
    res.json(paginar(await conversaciones.listar(req.usuario.id), req.query));
  }));

  r.get('/conversaciones/:id', ruta(async (req, res) => {
    res.json(await conversaciones.abrir(req.usuario.id, req.params.id));
  }));

  r.get('/conversaciones/:id/mensajes/:mensajeId', ruta(async (req, res) => {
    res.json(await conversaciones.mensaje(req.usuario.id, req.params.id, req.params.mensajeId));
  }));

  r.patch('/conversaciones/:id', ruta(async (req, res) => {
    res.json(await conversaciones.renombrar(req.usuario.id, req.params.id, cuerpo(req).nombre));
  }));

  r.delete('/conversaciones/:id', ruta(async (req, res) => {
    await conversaciones.eliminar(req.usuario.id, req.params.id);
    res.status(204).end();
  }));

  // Mensaje por voz: el audio grabado en la app llega en base64 (el cuerpo puede pesar hasta 15 MB)
  r.post('/conversaciones/:id/mensajes/voz', limiteMensajes, ruta(async (req, res) => {
    const { conversacionId, ...respuesta } = await conversaciones.enviarMensajeVoz(req.usuario.id, req.params.id, cuerpo(req));
    res.status(201).location(`/api/v1/conversaciones/${conversacionId}/mensajes/${respuesta.mensaje.id}`).json(respuesta);
  }));

  r.post('/conversaciones/:id/mensajes', limiteMensajes, ruta(async (req, res) => {
    const { conversacionId, ...respuesta } = await conversaciones.enviarMensaje(req.usuario.id, req.params.id, cuerpo(req));
    res.status(201).location(`/api/v1/conversaciones/${conversacionId}/mensajes/${respuesta.mensaje.id}`).json(respuesta);
  }));

  return r;
};
