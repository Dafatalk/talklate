// Cifrado en reposo del contenido de los mensajes (convenciones/seguridad.md seccion 6), con AES-256-GCM.
// La clave sale de TALKLATE_CLAVE_CIFRADO; en desarrollo se usa una clave fija y se avisa en el log.
const crypto = require('node:crypto');
const log = require('./log');

const PREFIJO = 'enc:v1:';
let clave = null;

function obtenerClave() {
  if (clave) return clave;
  const secreto = process.env.TALKLATE_CLAVE_CIFRADO;
  if (!secreto) {
    if (process.env.NODE_ENV === 'production') throw new Error('Falta TALKLATE_CLAVE_CIFRADO en produccion');
    log.advertencia('cifrado_clave_desarrollo', { detalle: 'TALKLATE_CLAVE_CIFRADO no esta definida; se usa una clave de desarrollo.' });
  }
  clave = crypto.createHash('sha256').update(secreto || 'talklate-clave-solo-desarrollo').digest();
  return clave;
}

function cifrar(texto) {
  if (texto === null || texto === undefined) return texto;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', obtenerClave(), iv);
  const datos = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return PREFIJO + [iv, c.getAuthTag(), datos].map((b) => b.toString('base64')).join(':');
}

// Textos guardados antes del cifrado (sin prefijo) se devuelven tal cual
function descifrar(valor) {
  if (typeof valor !== 'string' || !valor.startsWith(PREFIJO)) return valor;
  const [iv, tag, datos] = valor.slice(PREFIJO.length).split(':').map((p) => Buffer.from(p, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', obtenerClave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
}

const reiniciarClave = () => { clave = null; };

module.exports = { cifrar, descifrar, reiniciarClave };
