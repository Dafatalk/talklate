const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID, randomInt } = require('node:crypto');
const { mal, conflicto, noAutorizado, noEncontrado, ErrorNegocio } = require('../lib/errores');
const V = require('../lib/validaciones');
const { firmar, requerirSesion } = require('../lib/auth');
const { enviarCodigo } = require('../lib/correo');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// Limite simple de intentos de login por correo (en memoria)
const INTENTOS = new Map();
const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
function registrarIntento(clave, exito) {
  const ahora = Date.now();
  const r = INTENTOS.get(clave);
  if (exito) return INTENTOS.delete(clave);
  if (!r || ahora - r.desde > VENTANA_MS) INTENTOS.set(clave, { n: 1, desde: ahora });
  else r.n += 1;
}
function bloqueado(clave) {
  const r = INTENTOS.get(clave);
  return !!r && Date.now() - r.desde <= VENTANA_MS && r.n >= MAX_INTENTOS;
}

function publico(u) {
  return { id: u.id, nombre: u.nombre, apellido: u.apellido, correo: u.correo, fecha_nacimiento: u.fecha_nacimiento, rol: u.rol };
}

module.exports = function authRouter(db) {
  const r = express.Router();

  // HU Registrarme: Usuario-RN-1 a RN-4
  r.post('/registro', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = V.validarNombrePersona(b.nombre, 'nombre');
    const apellido = V.validarNombrePersona(b.apellido, 'apellido');
    const correo = V.validarCorreo(b.correo);
    const fecha = V.validarFechaNacimiento(b.fecha_nacimiento);
    V.validarPassword(b.password);
    if (db.prepare('SELECT 1 FROM usuario WHERE correo = ?').get(correo)) {
      throw conflicto('El correo electronico ingresado ya esta registrado en TalkLate. Por favor inicia sesion.');
    }
    const id = randomUUID();
    db.prepare('INSERT INTO usuario (id, nombre, apellido, correo, password_hash, fecha_nacimiento, rol, creado) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, nombre, apellido, correo, bcrypt.hashSync(b.password, 10), fecha, 'cliente', new Date().toISOString());
    const usuario = db.prepare('SELECT * FROM usuario WHERE id = ?').get(id);
    res.status(201).json({ token: firmar(usuario), usuario: publico(usuario) });
  }));

  // HU Iniciar sesion: Usuario-RN-5
  r.post('/login', ruta(async (req, res) => {
    const correo = V.texto((req.body || {}).correo).toLowerCase();
    const password = (req.body || {}).password;
    if (bloqueado(correo)) throw new ErrorNegocio(429, 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.');
    const u = db.prepare('SELECT * FROM usuario WHERE correo = ?').get(correo);
    if (!u || typeof password !== 'string' || !bcrypt.compareSync(password, u.password_hash)) {
      registrarIntento(correo, false);
      throw noAutorizado('Usuario o contrasena incorrectos. Por favor verifica tus credenciales.');
    }
    registrarIntento(correo, true);
    res.json({ token: firmar(u), usuario: publico(u) });
  }));

  // HU Recuperar contrasena (parte 1): Usuario-RN-6 y RN-7
  r.post('/recuperar', ruta(async (req, res) => {
    const correo = V.validarCorreo((req.body || {}).correo);
    const u = db.prepare('SELECT id FROM usuario WHERE correo = ?').get(correo);
    if (!u) throw noEncontrado('No encontramos una cuenta asociada a este correo electronico.');
    const codigo = String(randomInt(100000, 1000000));
    db.prepare('UPDATE recuperacion SET usado = 1 WHERE usuario_id = ?').run(u.id);
    db.prepare('INSERT INTO recuperacion (id, usuario_id, codigo_hash, expira, usado) VALUES (?,?,?,?,0)')
      .run(randomUUID(), u.id, bcrypt.hashSync(codigo, 8), Date.now() + 15 * 60 * 1000);
    const envio = await enviarCodigo(correo, codigo);
    const cuerpo = { mensaje: 'Te enviamos un codigo de verificacion a tu correo. Vence en 15 minutos.' };
    if (envio.devolverCodigo) cuerpo.codigo_dev = codigo;
    res.json(cuerpo);
  }));

  // HU Recuperar contrasena (parte 2): Usuario-RN-8 y RN-9
  r.post('/restablecer', ruta(async (req, res) => {
    const b = req.body || {};
    const correo = V.validarCorreo(b.correo);
    const u = db.prepare('SELECT id FROM usuario WHERE correo = ?').get(correo);
    const rec = u && db.prepare('SELECT * FROM recuperacion WHERE usuario_id = ? AND usado = 0 ORDER BY expira DESC LIMIT 1').get(u.id);
    const invalido = 'El codigo de verificacion es invalido o ha expirado. Solicita uno nuevo.';
    if (!rec || rec.expira < Date.now() || typeof b.codigo !== 'string' || !bcrypt.compareSync(b.codigo.trim(), rec.codigo_hash)) throw mal(invalido);
    V.validarPassword(b.password, 'La nueva contrasena no es segura. Usa al menos 8 caracteres, una mayuscula, un numero y un simbolo.');
    db.prepare('UPDATE usuario SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(b.password, 10), u.id);
    db.prepare('UPDATE recuperacion SET usado = 1 WHERE id = ?').run(rec.id);
    res.json({ mensaje: 'Tu contrasena fue actualizada. Ya puedes iniciar sesion.' });
  }));

  // HU Cerrar sesion: Usuario-RN-10
  r.post('/logout', requerirSesion(db), ruta(async (req, res) => {
    db.prepare('INSERT OR IGNORE INTO sesion_revocada (jti, expira) VALUES (?,?)').run(req.sesion.jti, req.sesion.exp);
    db.prepare('DELETE FROM sesion_revocada WHERE expira < ?').run(Math.floor(Date.now() / 1000));
    res.json({ mensaje: 'Sesion cerrada.' });
  }));

  r.get('/yo', requerirSesion(db), (req, res) => res.json({ usuario: publico(req.usuario) }));

  return r;
};
