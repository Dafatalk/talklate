// Caso de uso: cuentas de usuario (epica Cuenta de usuario). Registro, inicio de sesion,
// recuperacion de contrasena, cierre de sesion y eliminacion de la cuenta. Solo usa puertos
// (Repositorio, Notificador) y el servicio de sesiones; no conoce HTTP.
const bcrypt = require('bcryptjs');
const { randomUUID, randomInt } = require('node:crypto');
const { reglaNegocio, conflicto, noAutorizado, noEncontrado, ErrorNegocio } = require('../dominio/errores');
const V = require('../dominio/validaciones');

const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
const VIGENCIA_CODIGO_MS = 15 * 60 * 1000;

// Datos del usuario que se pueden mostrar (nunca el hash de la contrasena)
function publico(u) {
  return { id: u.id, nombre: u.nombre, apellido: u.apellido, correo: u.correo, fecha_nacimiento: u.fecha_nacimiento, rol: u.rol };
}

function crearServicioCuentas({ repo, sesiones, notificador, log }) {
  // Usuario-RN-5: bloqueo temporal tras intentos fallidos (en memoria, por correo)
  const intentos = new Map();
  function registrarIntento(clave, exito) {
    const ahora = Date.now();
    const rec = intentos.get(clave);
    if (exito) return intentos.delete(clave);
    if (!rec || ahora - rec.desde > VENTANA_MS) intentos.set(clave, { n: 1, desde: ahora });
    else rec.n += 1;
  }
  function bloqueado(clave) {
    const rec = intentos.get(clave);
    return !!rec && Date.now() - rec.desde <= VENTANA_MS && rec.n >= MAX_INTENTOS;
  }

  // HU Registrarme: Usuario-RN-1 a RN-4 y consentimiento de tratamiento de datos (Ley 1581 de 2012)
  async function registrar(datos) {
    const nombre = V.validarNombrePersona(datos.nombre, 'nombre');
    const apellido = V.validarNombrePersona(datos.apellido, 'apellido');
    const correo = V.validarCorreo(datos.correo);
    const fecha = V.validarFechaNacimiento(datos.fecha_nacimiento);
    V.validarPassword(datos.password);
    if (datos.acepta_tratamiento_datos !== true) throw reglaNegocio('Debes aceptar la politica de tratamiento de datos para crear tu cuenta.');
    if (await repo.usuarios.existeCorreo(correo)) throw conflicto('El correo electronico ingresado ya esta registrado en TalkLate. Por favor inicia sesion.');
    const id = randomUUID();
    const ahora = new Date().toISOString();
    await repo.usuarios.crear({ id, nombre, apellido, correo, password_hash: bcrypt.hashSync(datos.password, 10), fecha_nacimiento: fecha, rol: 'cliente', consentimiento_datos: ahora, creado: ahora });
    const usuario = await repo.usuarios.porId(id);
    log.info('usuario_registrado', { usuario_id: id });
    return { ...(await sesiones.emitir(usuario)), usuario: publico(usuario) };
  }

  // HU Iniciar sesion: Usuario-RN-5
  async function iniciarSesion(correoEntrada, password) {
    const correo = V.texto(correoEntrada).toLowerCase();
    if (bloqueado(correo)) throw new ErrorNegocio(429, 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.');
    const u = await repo.usuarios.porCorreo(correo);
    if (!u || typeof password !== 'string' || !bcrypt.compareSync(password, u.password_hash)) {
      registrarIntento(correo, false);
      log.advertencia('login_fallido', { usuario_id: u ? u.id : null });
      throw noAutorizado('Usuario o contrasena incorrectos. Por favor verifica tus credenciales.');
    }
    registrarIntento(correo, true);
    log.info('login_exitoso', { usuario_id: u.id });
    return { ...(await sesiones.emitir(u)), usuario: publico(u) };
  }

  // Renueva el token de acceso con el token de refresco (que se rota)
  async function refrescar(tokenRefresco) {
    const { usuario, sesion } = await sesiones.refrescar(tokenRefresco);
    return { ...sesion, usuario: publico(usuario) };
  }

  // HU Recuperar contrasena (parte 1): Usuario-RN-6 y RN-7
  async function solicitarRecuperacion(correoEntrada) {
    const correo = V.validarCorreo(correoEntrada);
    const u = await repo.usuarios.porCorreo(correo);
    if (!u) throw noEncontrado('No encontramos una cuenta asociada a este correo electronico.');
    const codigo = String(randomInt(100000, 1000000));
    await repo.recuperaciones.invalidarDeUsuario(u.id);
    await repo.recuperaciones.crear({ id: randomUUID(), usuario_id: u.id, codigo_hash: bcrypt.hashSync(codigo, 8), expira: Date.now() + VIGENCIA_CODIGO_MS });
    const envio = await notificador.enviarCodigoRecuperacion(u.id, codigo);
    const respuesta = { mensaje: 'Te enviamos un codigo de verificacion a tu correo. Vence en 15 minutos.' };
    if (envio && envio.devolverCodigo) respuesta.codigo_dev = codigo;
    return respuesta;
  }

  // HU Recuperar contrasena (parte 2): Usuario-RN-8 y RN-9
  async function restablecer({ correo: correoEntrada, codigo, password }) {
    const correo = V.validarCorreo(correoEntrada);
    const u = await repo.usuarios.porCorreo(correo);
    const rec = u ? await repo.recuperaciones.ultimaVigente(u.id) : null;
    if (!rec || rec.expira < Date.now() || typeof codigo !== 'string' || !bcrypt.compareSync(codigo.trim(), rec.codigo_hash)) {
      throw reglaNegocio('El codigo de verificacion es invalido o ha expirado. Solicita uno nuevo.');
    }
    V.validarPassword(password, 'La nueva contrasena no es segura. Usa al menos 8 caracteres, una mayuscula, un numero y un simbolo.');
    await repo.usuarios.actualizarPassword(u.id, bcrypt.hashSync(password, 10));
    await repo.recuperaciones.marcarUsada(rec.id);
    await repo.tokens.revocarDeUsuario(u.id); // cierra las otras sesiones
    log.info('contrasena_restablecida', { usuario_id: u.id });
    return { mensaje: 'Tu contrasena fue actualizada. Ya puedes iniciar sesion.' };
  }

  // HU Cerrar sesion: Usuario-RN-10
  async function cerrarSesion(usuario, sesion, tokenRefresco) {
    await sesiones.revocarAcceso(sesion);
    await sesiones.revocarRefresco(tokenRefresco);
    log.info('logout', { usuario_id: usuario.id });
  }

  // HU Eliminar mi cuenta (derecho al olvido, Ley 1581 de 2012)
  async function eliminarCuenta(usuarioId, password, sesion) {
    const u = await repo.usuarios.porId(usuarioId);
    if (typeof password !== 'string' || !bcrypt.compareSync(password, u.password_hash)) throw noAutorizado('La contrasena no es correcta.');
    if (u.rol === 'admin' && (await repo.usuarios.contarAdmins()) <= 1) throw conflicto('No puedes eliminar la unica cuenta de administrador.');
    await repo.usuarios.eliminar(u.id);
    await repo.sesiones.agregar(sesion.jti, sesion.exp);
    log.info('cuenta_eliminada', { usuario_id: u.id });
  }

  return { registrar, iniciarSesion, refrescar, solicitarRecuperacion, restablecer, cerrarSesion, eliminarCuenta, publico };
}

module.exports = { crearServicioCuentas, publico };
