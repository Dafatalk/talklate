// Repositorio sobre SQLite (node:sqlite). Misma interfaz async que repos/surreal.js,
// para que rutas, lib/auth y los tests funcionen con cualquier motor.
// Envuelve la API sincrona en metodos async (sin sorpresas de concurrencia).
const { transaccion } = require('../db');

module.exports = function crearRepoSqlite(db) {
  const uno = (sql, ...a) => db.prepare(sql).get(...a);
  const todo = (sql, ...a) => db.prepare(sql).all(...a);
  const corre = (sql, ...a) => db.prepare(sql).run(...a);

  const usuarios = {
    async crear(u) {
      corre(
        'INSERT INTO usuario (id, nombre, apellido, correo, password_hash, fecha_nacimiento, rol, consentimiento_datos, creado) VALUES (?,?,?,?,?,?,?,?,?)',
        u.id, u.nombre, u.apellido, u.correo, u.password_hash, u.fecha_nacimiento, u.rol || 'cliente', u.consentimiento_datos ?? null, u.creado,
      );
      return uno('SELECT * FROM usuario WHERE id = ?', u.id);
    },
    async porCorreo(correo) { return uno('SELECT * FROM usuario WHERE correo = ?', correo) || null; },
    async porId(id) { return uno('SELECT * FROM usuario WHERE id = ?', id) || null; },
    async paraSesion(id) { return uno('SELECT id, nombre, apellido, correo, fecha_nacimiento, rol FROM usuario WHERE id = ?', id) || null; },
    async existeCorreo(correo) { return !!uno('SELECT 1 FROM usuario WHERE correo = ?', correo); },
    async actualizarPassword(id, hash) { corre('UPDATE usuario SET password_hash = ? WHERE id = ?', hash, id); },
    async contarAdmins() { return uno("SELECT COUNT(*) AS n FROM usuario WHERE rol = 'admin'").n; },
    async eliminar(id) {
      transaccion(db, () => {
        corre('DELETE FROM reporte WHERE usuario_id = ?', id);
        corre('DELETE FROM recuperacion WHERE usuario_id = ?', id);
        corre('DELETE FROM token_refresco WHERE usuario_id = ?', id);
        corre('DELETE FROM conversacion WHERE usuario_id = ?', id); // mensajes/lpc/reportes en cascada por FK
        corre('DELETE FROM usuario WHERE id = ?', id);
      });
    },
  };

  const tokens = {
    async crear({ id, usuario_id, hash, expira }) { corre('INSERT INTO token_refresco (id, usuario_id, hash, expira, revocado) VALUES (?,?,?,?,0)', id, usuario_id, hash, expira); },
    async porHash(hash) { return uno('SELECT * FROM token_refresco WHERE hash = ?', hash) || null; },
    async revocarId(id) { corre('UPDATE token_refresco SET revocado = 1 WHERE id = ?', id); },
    async revocarHash(hash) { corre('UPDATE token_refresco SET revocado = 1 WHERE hash = ?', hash); },
    async revocarDeUsuario(usuario_id) { corre('UPDATE token_refresco SET revocado = 1 WHERE usuario_id = ?', usuario_id); },
  };

  const sesiones = {
    async agregar(jti, expira) { corre('INSERT OR IGNORE INTO sesion_revocada (jti, expira) VALUES (?,?)', jti, expira); },
    async tiene(jti) { return !!uno('SELECT 1 FROM sesion_revocada WHERE jti = ?', jti); },
    async limpiarExpiradas(nowSeg) { corre('DELETE FROM sesion_revocada WHERE expira < ?', nowSeg); },
  };

  const recuperaciones = {
    async invalidarDeUsuario(usuario_id) { corre('UPDATE recuperacion SET usado = 1 WHERE usuario_id = ?', usuario_id); },
    async crear({ id, usuario_id, codigo_hash, expira }) { corre('INSERT INTO recuperacion (id, usuario_id, codigo_hash, expira, usado) VALUES (?,?,?,?,0)', id, usuario_id, codigo_hash, expira); },
    async ultimaVigente(usuario_id) { return uno('SELECT * FROM recuperacion WHERE usuario_id = ? AND usado = 0 ORDER BY expira DESC LIMIT 1', usuario_id) || null; },
    async marcarUsada(id) { corre('UPDATE recuperacion SET usado = 1 WHERE id = ?', id); },
  };

  function regionPorId(id) {
    const r = uno('SELECT r.id, r.nombre, p.id AS pais_id, p.nombre AS pais_nombre, p.codigo AS pais_codigo FROM region r JOIN pais p ON p.id = r.pais_id WHERE r.id = ?', id);
    if (!r) return null;
    const idiomas = todo('SELECT l.id, l.nombre, l.codigo FROM lenguaje_region lr JOIN lenguaje l ON l.id = lr.lenguaje_id WHERE lr.region_id = ?', id);
    return { id: r.id, nombre: r.nombre, pais: { id: r.pais_id, nombre: r.pais_nombre, codigo: r.pais_codigo }, idiomas };
  }

  const catalogo = {
    async obtener({ todos }) {
      const idiomas = todo(`SELECT id, nombre, codigo, activo FROM lenguaje ${todos ? '' : 'WHERE activo = 1'} ORDER BY nombre`);
      const regiones = todo(`
        SELECT lr.lenguaje_id, r.id, r.nombre, p.id AS pais_id, p.nombre AS pais_nombre, p.codigo AS pais_codigo
        FROM lenguaje_region lr JOIN region r ON r.id = lr.region_id JOIN pais p ON p.id = r.pais_id
        ORDER BY p.nombre, r.nombre`);
      return {
        idiomas: idiomas.map((i) => ({
          id: i.id, nombre: i.nombre, codigo: i.codigo, activo: !!i.activo,
          regiones: regiones.filter((r) => r.lenguaje_id === i.id).map((r) => ({ id: r.id, nombre: r.nombre, pais: { id: r.pais_id, nombre: r.pais_nombre, codigo: r.pais_codigo } })),
        })),
        entonaciones: todo('SELECT id, nombre FROM entonacion WHERE activo = 1 ORDER BY nombre'),
        canales: todo('SELECT id, nombre FROM canal ORDER BY nombre'),
      };
    },
    async lenguajePorId(id) { return uno('SELECT * FROM lenguaje WHERE id = ?', id) || null; },
    async lenguajePorCodigoActivo(codigo) { return uno('SELECT * FROM lenguaje WHERE codigo = ? AND activo = 1', codigo) || null; },
    async existeLenguaje(id) { return !!uno('SELECT 1 FROM lenguaje WHERE id = ?', id); },
    async crearLenguaje({ id, nombre, codigo, activo }) { corre('INSERT INTO lenguaje (id, nombre, codigo, activo) VALUES (?,?,?,?)', id, nombre, codigo, activo ? 1 : 0); return uno('SELECT * FROM lenguaje WHERE id = ?', id); },
    async existeLenguajeNombreOCodigo(nombre, codigo) { return !!uno('SELECT 1 FROM lenguaje WHERE lower(nombre) = lower(?) OR codigo = ?', nombre, codigo); },
    async existeOtroLenguajeConNombre(nombre, id) { return !!uno('SELECT 1 FROM lenguaje WHERE lower(nombre) = lower(?) AND id <> ?', nombre, id); },
    async renombrarLenguaje(id, nombre) { corre('UPDATE lenguaje SET nombre = ? WHERE id = ?', nombre, id); },
    async activarLenguaje(id, activo) { corre('UPDATE lenguaje SET activo = ? WHERE id = ?', activo ? 1 : 0, id); },
    async addRegionLenguaje(lenguajeId, regionId) { corre('INSERT OR IGNORE INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)', lenguajeId, regionId); },
    async setRegionesLenguaje(lenguajeId, regionIds) {
      corre('DELETE FROM lenguaje_region WHERE lenguaje_id = ?', lenguajeId);
      for (const r of regionIds) corre('INSERT OR IGNORE INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)', lenguajeId, r);
    },
    async regionValidaParaLenguaje(lenguajeId, regionId) { return !!uno('SELECT 1 FROM lenguaje_region WHERE lenguaje_id = ? AND region_id = ?', lenguajeId, regionId); },
    async regionPorId(id) { return regionPorId(id); },
    async existeRegion(id) { return !!uno('SELECT 1 FROM region WHERE id = ?', id); },
    async crearRegion({ id, nombre, pais_id }) { corre('INSERT INTO region (id, nombre, pais_id) VALUES (?,?,?)', id, nombre, pais_id); return regionPorId(id); },
    async existeRegionEnPais(nombre, pais_id) { return !!uno('SELECT 1 FROM region WHERE lower(nombre) = lower(?) AND pais_id = ?', nombre, pais_id); },
    async paisPorNombre(nombre) { return uno('SELECT * FROM pais WHERE lower(nombre) = lower(?)', nombre) || null; },
    async existePaisCodigo(codigo) { return !!uno('SELECT 1 FROM pais WHERE codigo = ?', codigo); },
    async crearPais({ id, nombre, codigo }) { corre('INSERT INTO pais (id, nombre, codigo) VALUES (?,?,?)', id, nombre, codigo); return uno('SELECT * FROM pais WHERE id = ?', id); },
    async entonacionesActivas() { return todo('SELECT id, nombre FROM entonacion WHERE activo = 1'); },
    async canalPorNombre(nombre) { return uno('SELECT id FROM canal WHERE nombre = ?', nombre) || null; },
    async regionIdPorNombrePaisLenguaje(region, pais, lenguajeId) {
      const r = uno('SELECT r.id FROM region r JOIN pais p ON p.id = r.pais_id JOIN lenguaje_region lr ON lr.region_id = r.id WHERE r.nombre = ? AND p.nombre = ? AND lr.lenguaje_id = ?', region, pais, lenguajeId);
      return r ? r.id : null;
    },
  };

  const conversaciones = {
    async crearConfigurada({ convId, nombre, usuarioId, fecha, destino, origen }) {
      transaccion(db, () => {
        corre('INSERT INTO conversacion (id, nombre, fecha_inicio, usuario_id) VALUES (?,?,?,?)', convId, nombre, fecha, usuarioId);
        corre('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)', destino.lpcId, 'LC1', convId, destino.lenguajeId, destino.regionId ?? null, 'destino');
        if (origen) corre('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)', origen.lpcId, 'LC2', convId, origen.lenguajeId, null, 'origen');
      });
    },
    async porId(id) { return uno('SELECT * FROM conversacion WHERE id = ?', id) || null; },
    async delUsuario(id, usuarioId) { return uno('SELECT * FROM conversacion WHERE id = ? AND usuario_id = ?', id, usuarioId) || null; },
    async listarDeUsuario(usuarioId) { return todo('SELECT * FROM conversacion WHERE usuario_id = ? ORDER BY fecha_inicio DESC', usuarioId); },
    async renombrar(id, nombre) { corre('UPDATE conversacion SET nombre = ? WHERE id = ?', nombre, id); },
    async eliminar(id) { transaccion(db, () => corre('DELETE FROM conversacion WHERE id = ?', id)); },
    async lpcDe(convId) {
      return todo(`
        SELECT lpc.id, lpc.nombre, lpc.rol, lpc.lenguaje_id, lpc.region_id, l.nombre AS idioma_nombre, l.codigo AS idioma_codigo,
               r.nombre AS region_nombre, p.codigo AS pais_codigo, p.nombre AS pais_nombre
        FROM lenguaje_por_conversacion lpc
        JOIN lenguaje l ON l.id = lpc.lenguaje_id
        LEFT JOIN region r ON r.id = lpc.region_id
        LEFT JOIN pais p ON p.id = r.pais_id
        WHERE lpc.conversacion_id = ?`, convId);
    },
    async contarLpc(convId) { return uno('SELECT COUNT(*) AS n FROM lenguaje_por_conversacion WHERE conversacion_id = ?', convId).n; },
    async crearLpc({ id, nombre, convId, lenguajeId, regionId, rol }) { corre('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)', id, nombre, convId, lenguajeId, regionId ?? null, rol); },
  };

  const mensajes = {
    async deConversacion(convId) {
      return todo(`
        SELECT mo.id, mo.contenido, mo.remitente, mo.fecha_creacion, ca.nombre AS canal, en.nombre AS tono,
               md.id AS destino_id, md.contenido_traducido, md.nota_cultural, md.aproximada, md.motor, md.estado_entrega,
               (SELECT 1 FROM reporte rp WHERE rp.mensaje_destino_id = md.id LIMIT 1) AS reportado
        FROM mensaje_original mo
        JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
        JOIN canal ca ON ca.id = mo.canal_id
        JOIN entonacion en ON en.id = mo.entonacion_id
        LEFT JOIN mensaje_destino md ON md.mensaje_original_id = mo.id
        WHERE lpc.conversacion_id = ?
        ORDER BY mo.fecha_creacion, mo.rowid`, convId);
    },
    async ultimo(convId) {
      return uno(`
        SELECT mo.contenido, md.contenido_traducido, mo.fecha_creacion
        FROM mensaje_original mo JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
        LEFT JOIN mensaje_destino md ON md.mensaje_original_id = mo.id
        WHERE lpc.conversacion_id = ? ORDER BY mo.fecha_creacion DESC, mo.rowid DESC LIMIT 1`, convId) || null;
    },
    async contar(convId) {
      return uno('SELECT COUNT(*) AS n FROM mensaje_original mo JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id WHERE lpc.conversacion_id = ?', convId).n;
    },
    async crear({ origen, destino }) {
      transaccion(db, () => {
        corre('INSERT INTO mensaje_original (id, lenguaje_conversacion_id, canal_id, entonacion_id, contenido, remitente, fecha_creacion) VALUES (?,?,?,?,?,?,?)', origen.id, origen.lpcId, origen.canalId, origen.entonacionId, origen.contenido, origen.remitente, origen.fecha);
        corre('INSERT INTO mensaje_destino (id, mensaje_original_id, lenguaje_conversacion_id, contenido_traducido, nota_cultural, aproximada, motor, estado_entrega, fecha_creacion) VALUES (?,?,?,?,?,?,?,?,?)', destino.id, origen.id, destino.lpcId, destino.contenido_traducido, destino.nota ?? null, destino.aproximada ? 1 : 0, destino.motor, destino.estado_entrega || 'Entregado', destino.fecha);
      });
    },
  };

  const CONSULTA_REPORTE = `
    SELECT rp.id, rp.motivo, rp.sugerencia, rp.estado, rp.nota_admin, rp.fecha, rp.mensaje_destino_id,
           mo.contenido AS original, md.contenido_traducido AS traduccion, md.nota_cultural, md.motor,
           lo.codigo AS idioma_origen, ld.codigo AS idioma_destino, u.nombre || ' ' || u.apellido AS reportado_por
    FROM reporte rp
    JOIN mensaje_destino md ON md.id = rp.mensaje_destino_id
    JOIN mensaje_original mo ON mo.id = md.mensaje_original_id
    JOIN lenguaje_por_conversacion lpo ON lpo.id = mo.lenguaje_conversacion_id
    JOIN lenguaje lo ON lo.id = lpo.lenguaje_id
    JOIN lenguaje_por_conversacion lpd ON lpd.id = md.lenguaje_conversacion_id
    JOIN lenguaje ld ON ld.id = lpd.lenguaje_id
    JOIN usuario u ON u.id = rp.usuario_id`;

  const reportes = {
    async mensajeDestinoPropio(mdId, usuarioId) {
      return uno(`
        SELECT md.id FROM mensaje_destino md
        JOIN mensaje_original mo ON mo.id = md.mensaje_original_id
        JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
        JOIN conversacion c ON c.id = lpc.conversacion_id
        WHERE md.id = ? AND c.usuario_id = ?`, mdId, usuarioId) || null;
    },
    async existe(mdId, usuarioId) { return !!uno('SELECT 1 FROM reporte WHERE mensaje_destino_id = ? AND usuario_id = ?', mdId, usuarioId); },
    async crear({ id, mdId, usuarioId, motivo, sugerencia, estado, fecha }) { corre('INSERT INTO reporte (id, mensaje_destino_id, usuario_id, motivo, sugerencia, estado, fecha) VALUES (?,?,?,?,?,?,?)', id, mdId, usuarioId, motivo, sugerencia ?? null, estado || 'abierto', fecha); },
    async listar({ estado }) {
      return todo(`${CONSULTA_REPORTE} ${estado ? 'WHERE rp.estado = ?' : ''}
        ORDER BY CASE rp.estado WHEN 'abierto' THEN 0 ELSE 1 END, rp.fecha DESC`, ...(estado ? [estado] : []));
    },
    async porId(id) { return uno(`${CONSULTA_REPORTE} WHERE rp.id = ?`, id) || null; },
    async actualizar(id, estado, nota) { corre('UPDATE reporte SET estado = ?, nota_admin = ? WHERE id = ?', estado, nota ?? null, id); },
  };

  return { async inicializar() {}, usuarios, tokens, sesiones, recuperaciones, catalogo, conversaciones, mensajes, reportes, _db: db };
};
