// Reglas de negocio de arquitectura/modelo_datos.md (Usuario-RN-*, Conversacion-RN-*)
const { mal } = require('./errores');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PALABRAS_OFENSIVAS = ['idiota', 'estupido', 'imbecil', 'puta', 'mierda', 'stupid', 'idiot', 'bastard', 'fuck', 'shit'];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Usuario-RN-3
function validarCorreo(correo) {
  const c = texto(correo).toLowerCase();
  if (!REGEX_CORREO.test(c) || c.length > 320) throw mal('El formato del correo es invalido. Por favor revisalo.');
  return c;
}

// Usuario-RN-4 y RN-9: 8+ caracteres, mayuscula, numero y caracter especial
function validarPassword(password, mensaje = 'La contrasena es debil. Debe tener al menos 8 caracteres, una mayuscula, un numero y un simbolo.') {
  const p = typeof password === 'string' ? password : '';
  if (p.length < 8 || !/[A-Z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) throw mal(mensaje);
  return p;
}

function calcularEdad(fechaIso, hoy = new Date()) {
  const f = new Date(fechaIso + 'T00:00:00');
  if (Number.isNaN(f.getTime())) return null;
  let edad = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad -= 1;
  return edad;
}

// Usuario-RN-2: minimo 13 anos; la fecha no puede ser futura
function validarFechaNacimiento(fecha, hoy = new Date()) {
  const f = texto(fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) throw mal('La fecha de nacimiento debe tener el formato AAAA-MM-DD.');
  const edad = calcularEdad(f, hoy);
  if (edad === null || new Date(f + 'T00:00:00') > hoy) throw mal('La fecha de nacimiento no es valida.');
  if (edad < 13) throw mal('Lo sentimos, debes tener al menos 13 anos para crear una cuenta.');
  return f;
}

function validarNombrePersona(valor, campo) {
  const v = texto(valor);
  if (v.length < 1 || v.length > 50) throw mal(`El campo ${campo} es obligatorio y tiene maximo 50 caracteres.`);
  return v;
}

// Conversacion-RN-4: 3 a 80 caracteres, sin caracteres especiales ni palabras ofensivas
function validarNombreConversacion(nombre) {
  const n = texto(nombre).replace(/\s+/g, ' ');
  if (n.length < 3 || n.length > 80) throw mal('El nombre de la conversacion debe tener entre 3 y 80 caracteres.');
  if (!/^[\p{L}\p{N} .,_-]+$/u.test(n)) throw mal('El nombre de la conversacion no puede tener caracteres especiales.');
  const plano = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (PALABRAS_OFENSIVAS.some((p) => plano.split(/[^a-z0-9]+/).includes(p))) throw mal('El nombre de la conversacion tiene palabras no permitidas.');
  return n;
}

function validarContenidoMensaje(contenido) {
  const c = texto(contenido);
  if (!c) throw mal('El mensaje no puede estar vacio.');
  if (c.length > 5000) throw mal('El mensaje es muy largo (maximo 5000 caracteres).');
  return c;
}

module.exports = {
  validarCorreo, validarPassword, validarFechaNacimiento, validarNombrePersona,
  validarNombreConversacion, validarContenidoMensaje, calcularEdad, texto,
};
