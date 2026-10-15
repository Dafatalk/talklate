const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID, randomInt } = require('node:crypto');
const { reglaNegocio, conflicto, noAutorizado, noEncontrado, ErrorNegocio } = require('../lib/errores');
const V = require('../lib/validaciones');
const { emitirSesion, refrescarSesion, revocarRefresco, requerirSesion } = require('../lib/auth');
const { enviarCodigo } = require('../lib/correo');
const { crearLimite, porIp } = require('../lib/limites');
const log = require('../lib/log');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// Limite de intentos fallidos de login por correo (en memoria)
const INTENTOS = new Map();
const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
function registrarIntento(clave, exito) {
  const ahora = Date.now();
  const rec = INTENTOS.get(clave);
  if (exito) return INTENTOS.delete(clave);
  if (!rec || ahora - rec.desde > VENTANA_MS) INTENTOS.set(clave, { n: 1, desde: ahora });
  else rec.n += 1;
}
function bloqueado(clave) {
  const rec = INTENTOS.get(clave);
  return !!rec && Date.now() - rec.desde <= VENTANA_MS && rec.n >= MAX_INTENTOS;
}

function publico(u) {
  return { id: u.id, nombre: u.nombre, apellido: u.apellido, correo: u.correo, fecha_nacimiento: u.fecha_nacimiento, rol: u.rol };
}

module.exports = function authRouter(repo) {
  const r = express.Router();
  const limiteRegistro = crearLimite({ maximo: 10, ventanaMs: 60 * 60 * 1000, clave: porIp, mensaje: 'Demasiados registros desde esta conexion. Intenta mas tarde.' });
  const limiteRecuperar = crearLimite({ maximo: 5, ventanaMs: 15 * 60 * 1000, clave: porIp, mensaje: 'Demasiadas solicitudes de recuperacion. Intenta en unos minutos.' });
  const limiteRestablecer = crearLimite({ maximo: 10, ventanaMs: 15 * 60 * 1000, clave: porIp, mensaje: 'Demasiados intentos con el codigo. Intenta en unos minutos.' });

  // HU Registrarme: Usuario-RN-1 a RN-4 y consentimiento de tratamiento de datos (Ley 1581 de 2012)
  r.post('/registro', limiteRegistro, ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.validarNombrePersona(b.nombre, 'nombre');
    const apellido = V.validarNombrePersona(b.apellido, 'apellido');
    const correo = V.validarCorreo(b.correo);
    const fecha = V.validarFechaNacimiento(b.fecha_nacimiento);
    V.validarPassword(b.password);
    if (b.acepta_tratamiento_datos !== true) throw reglaNegocio('Debes aceptar la politica de tratamiento de datos para crear tu cuenta.');
    if (await repo.usuarios.existeCorreo(correo)) {
      throw conflicto('El correo electronico ingresado ya esta registrado en TalkLate. Por favor inicia sesion.');
    }
    const id = randomUUID();
    const ahora = new Date().toISOString();
    await repo.usuarios.crear({ id, nombre, apellido, correo, password_hash: bcrypt.hashSync(b.password, 10), fecha_nacimiento: fecha, rol: 'cliente', consentimiento_datos: ahora, creado: ahora });
    const usuario = await repo.usuarios.porId(id);
    log.info('usuario_registrado', { usuario_id: id });
    res.status(201).location('/api/v1/usuarios/yo').json({ ...(await emitirSesion(repo, usuario)), usuario: publico(usuario) });
  }));

  // HU Iniciar sesion: Usuario-RN-5
  r.post('/login', ruta(async (req, res) => {
    const correo = V.texto((req.body || {}).correo).toLowerCase();
    const password = (req.body || {}).password;
    if (bloqueado(correo)) throw new ErrorNegocio(429, 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.');
    const u = await repo.usuarios.porCorreo(correo);
    if (!u || typeof password !== 'string' || !bcrypt.compareSync(password, u.password_hash)) {
      registrarIntento(correo, false);
      log.advertencia('login_fallido', { usuario_id: u ? u.id : null });
      throw noAutorizado('Usuario o contrasena incorrectos. Por favor verifica tus credenciales.');
    }
    registrarIntento(correo, true);
    log.info('login_exitoso', { usuario_id: u.id });
    res.json({ ...(await emitirSesion(repo, u)), usuario: publico(u) });
  }));

  // Renueva el token de acceso con el token de refresco (que se rota)
  r.post('/refrescar', ruta(async (req, res) => {
    const { usuario, sesion } = await refrescarSesion(repo, (req.body || {}).token_refresco);
    res.json({ ...sesion, usuario: publico(usuario) });
  }));

  // HU Recuperar contrasena (parte 1): Usuario-RN-6 y RN-7
  r.post('/recuperar', limiteRecuperar, ruta(async (req, res) => {
    const correo = V.validarCorreo((req.body || {}).correo);
    const u = await repo.usuarios.porCorreo(correo);
    if (!u) throw noEncontrado('No encontramos una cuenta asociada a este correo electronico.');
    const codigo = String(randomInt(100000, 1000000));
    await repo.recuperaciones.invalidarDeUsuario(u.id);
    await repo.recuperaciones.crear({ id: randomUUID(), usuario_id: u.id, codigo_hash: bcrypt.hashSync(codigo, 8), expira: Date.now() + 15 * 60 * 1000 });
    const envio = await enviarCodigo(u.id);
    const cuerpo = { mensaje: 'Te enviamos un codigo de verificacion a tu correo. Vence en 15 minutos.' };
    if (envio.devolverCodigo) cuerpo.codigo_dev = codigo;
    res.json(cuerpo);
  }));

  // HU Recuperar contrasena (parte 2): Usuario-RN-8 y RN-9
  r.post('/restablecer', limiteRestablecer, ruta(async (req, res) => {
    const b = req.body || {};
    const correo = V.validarCorreo(b.correo);
    const u = await repo.usuarios.porCorreo(correo);
    const rec = u ? await repo.recuperaciones.ultimaVigente(u.id) : null;
    if (!rec || rec.expira < Date.now() || typeof b.codigo !== 'string' || !bcrypt.compareSync(b.codigo.trim(), rec.codigo_hash)) {
      throw reglaNegocio('El codigo de verificacion es invalido o ha expirado. Solicita uno nuevo.');
    }
    V.validarPassword(b.password, 'La nueva contrasena no es segura. Usa al menos 8 caracteres, una mayuscula, un numero y un simbolo.');
    await repo.usuarios.actualizarPassword(u.id, bcrypt.hashSync(b.password, 10));
    await repo.recuperaciones.marcarUsada(rec.id);
    await repo.tokens.revocarDeUsuario(u.id); // cierra las otras sesiones
    log.info('contrasena_restablecida', { usuario_id: u.id });
    res.json({ mensaje: 'Tu contrasena fue actualizada. Ya puedes iniciar sesion.' });
  }));

  // HU Cerrar sesion: Usuario-RN-10
  r.post('/logout', requerirSesion(repo), ruta(async (req, res) => {
    await repo.sesiones.agregar(req.sesion.jti, req.sesion.exp);
    await repo.sesiones.limpiarExpiradas(Math.floor(Date.now() / 1000));
    await revocarRefresco(repo, (req.body || {}).token_refresco);
    log.info('logout', { usuario_id: req.usuario.id });
    res.status(204).end();
  }));

  return r;
};

// Recurso del usuario autenticado: /usuarios/yo
module.exports.usuariosRouter = function usuariosRouter(repo) {
  const r = express.Router();
  r.use(requerirSesion(repo));

  r.get('/yo', (req, res) => res.json(publico(req.usuario)));

  // HU Eliminar mi cuenta (derecho al olvido, Ley 1581 de 2012)
  r.delete('/yo', ruta(async (req, res) => {
    const u = await repo.usuarios.porId(req.usuario.id);
    const password = (req.body || {}).password;
    if (typeof password !== 'string' || !bcrypt.compareSync(password, u.password_hash)) throw noAutorizado('La contrasena no es correcta.');
    if (u.rol === 'admin' && (await repo.usuarios.contarAdmins()) <= 1) {
      throw conflicto('No puedes eliminar la unica cuenta de administrador.');
    }
    await repo.usuarios.eliminar(u.id);
    await repo.sesiones.agregar(req.sesion.jti, req.sesion.exp);
    log.info('cuenta_eliminada', { usuario_id: u.id });
    res.status(204).end();
  }));

  return r;
};
