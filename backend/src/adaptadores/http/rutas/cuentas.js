// Adaptador HTTP (entrada) de la epica Cuenta de usuario: traduce peticiones a llamadas del caso de
// uso (aplicacion/cuentas.js). Aqui solo hay HTTP: codigos, cabeceras y limites de uso por IP.
const express = require('express');
const { requerirSesion, ruta } = require('../sesion');
const { crearLimite, porIp } = require('../limites');

module.exports = function rutasCuentas({ cuentas, sesiones }) {
  const r = express.Router();
  const limiteRegistro = crearLimite({ maximo: 10, ventanaMs: 60 * 60 * 1000, clave: porIp, mensaje: 'Demasiados registros desde esta conexion. Intenta mas tarde.' });
  const limiteRecuperar = crearLimite({ maximo: 5, ventanaMs: 15 * 60 * 1000, clave: porIp, mensaje: 'Demasiadas solicitudes de recuperacion. Intenta en unos minutos.' });
  const limiteRestablecer = crearLimite({ maximo: 10, ventanaMs: 15 * 60 * 1000, clave: porIp, mensaje: 'Demasiados intentos con el codigo. Intenta en unos minutos.' });
  const cuerpo = (req) => req.body || {};

  r.post('/registro', limiteRegistro, ruta(async (req, res) => {
    res.status(201).location('/api/v1/usuarios/yo').json(await cuentas.registrar(cuerpo(req)));
  }));

  r.post('/login', ruta(async (req, res) => {
    res.json(await cuentas.iniciarSesion(cuerpo(req).correo, cuerpo(req).password));
  }));

  r.post('/refrescar', ruta(async (req, res) => {
    res.json(await cuentas.refrescar(cuerpo(req).token_refresco));
  }));

  r.post('/recuperar', limiteRecuperar, ruta(async (req, res) => {
    res.json(await cuentas.solicitarRecuperacion(cuerpo(req).correo));
  }));

  r.post('/restablecer', limiteRestablecer, ruta(async (req, res) => {
    res.json(await cuentas.restablecer(cuerpo(req)));
  }));

  r.post('/logout', requerirSesion(sesiones), ruta(async (req, res) => {
    await cuentas.cerrarSesion(req.usuario, req.sesion, cuerpo(req).token_refresco);
    res.status(204).end();
  }));

  return r;
};

// Recurso del usuario autenticado: /usuarios/yo
module.exports.rutasUsuarios = function rutasUsuarios({ cuentas, sesiones }) {
  const r = express.Router();
  r.use(requerirSesion(sesiones));

  r.get('/yo', (req, res) => res.json(cuentas.publico(req.usuario)));

  r.delete('/yo', ruta(async (req, res) => {
    await cuentas.eliminarCuenta(req.usuario.id, (req.body || {}).password, req.sesion);
    res.status(204).end();
  }));

  return r;
};
