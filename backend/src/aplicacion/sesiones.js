// Caso de uso: sesiones (ADR-006). Token de acceso corto (JWT) + token de refresco largo y rotativo
// (convenciones/seguridad.md seccion 3). Solo usa el puerto Repositorio; el middleware HTTP que lee
// la cabecera Authorization esta en adaptadores/http/sesion.js.
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { noAutorizado } = require('../dominio/errores');

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');
const EXPIRADA = 'La sesion ya ha expirado. Inicia sesion de nuevo.';
const NO_VALIDA = 'La sesion ya ha expirado o no es valida.';

function crearServicioSesiones({ repo, secreto, duracionAccesoSeg = 15 * 60, duracionRefrescoMs = 30 * 24 * 60 * 60 * 1000 }) {
  if (!secreto) throw new Error('El servicio de sesiones necesita un secreto para firmar los tokens');

  const firmarAcceso = (usuario) => jwt.sign({ sub: usuario.id, rol: usuario.rol, jti: crypto.randomUUID() }, secreto, { expiresIn: duracionAccesoSeg });

  // Crea el par de tokens. El de refresco solo se guarda como hash.
  async function emitir(usuario) {
    const refresco = crypto.randomBytes(48).toString('base64url');
    await repo.tokens.crear({ id: crypto.randomUUID(), usuario_id: usuario.id, hash: hash(refresco), expira: Date.now() + duracionRefrescoMs });
    return { token: firmarAcceso(usuario), token_refresco: refresco, expira_en: duracionAccesoSeg };
  }

  // Rota el token de refresco: el usado queda revocado y se entrega uno nuevo.
  // consumir() revoca y lee en un solo paso, asi un mismo token no sirve para dos sesiones.
  async function refrescar(refresco) {
    const fila = typeof refresco === 'string' ? await repo.tokens.consumir(hash(refresco), Date.now()) : null;
    if (!fila) throw noAutorizado(EXPIRADA);
    const usuario = await repo.usuarios.porId(fila.usuario_id);
    if (!usuario) throw noAutorizado(EXPIRADA);
    return { usuario, sesion: await emitir(usuario) };
  }

  async function revocarRefresco(refresco) {
    if (typeof refresco === 'string') await repo.tokens.revocarHash(hash(refresco));
  }

  // Usuario-RN-10: un token de acceso valido, no revocado y de un usuario que existe
  async function verificarAcceso(token) {
    if (!token) throw noAutorizado();
    let datos;
    try {
      datos = jwt.verify(token, secreto);
    } catch {
      throw noAutorizado(NO_VALIDA);
    }
    if (await repo.sesiones.tiene(datos.jti)) throw noAutorizado(NO_VALIDA);
    const usuario = await repo.usuarios.paraSesion(datos.sub);
    if (!usuario) throw noAutorizado(NO_VALIDA);
    return { usuario, sesion: { jti: datos.jti, exp: datos.exp } };
  }

  // Revoca el token de acceso actual (hasta que expire) y limpia los revocados viejos
  async function revocarAcceso(sesion) {
    await repo.sesiones.agregar(sesion.jti, sesion.exp);
    await repo.sesiones.limpiarExpiradas(Math.floor(Date.now() / 1000));
  }

  return { emitir, refrescar, revocarRefresco, verificarAcceso, revocarAcceso };
}

module.exports = { crearServicioSesiones };
