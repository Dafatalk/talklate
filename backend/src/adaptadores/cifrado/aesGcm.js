// Adaptador del puerto Cifrador (ver puertos/index.js): cifrado en reposo del contenido de los
// mensajes con AES-256-GCM (convenciones/seguridad.md seccion 6). La clave llega desde la
// composicion (variable TALKLATE_CLAVE_CIFRADO); en desarrollo se usa una clave fija y se avisa.
const crypto = require('node:crypto');
const log = require('../../compartido/log');

const PREFIJO = 'enc:v1:';

function crearCifradorAesGcm({ secreto, produccion = false } = {}) {
  if (!secreto) {
    if (produccion) throw new Error('Falta TALKLATE_CLAVE_CIFRADO en produccion');
    log.advertencia('cifrado_clave_desarrollo', { detalle: 'TALKLATE_CLAVE_CIFRADO no esta definida; se usa una clave de desarrollo.' });
  }
  const clave = crypto.createHash('sha256').update(secreto || 'talklate-clave-solo-desarrollo').digest();

  function cifrar(texto) {
    if (texto === null || texto === undefined) return texto;
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', clave, iv);
    const datos = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
    return PREFIJO + [iv, c.getAuthTag(), datos].map((b) => b.toString('base64')).join(':');
  }

  // Textos guardados antes del cifrado (sin prefijo) se devuelven tal cual
  function descifrar(valor) {
    if (typeof valor !== 'string' || !valor.startsWith(PREFIJO)) return valor;
    const [iv, tag, datos] = valor.slice(PREFIJO.length).split(':').map((p) => Buffer.from(p, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', clave, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
  }

  return { cifrar, descifrar };
}

module.exports = { crearCifradorAesGcm };
