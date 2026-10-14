const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, reglaNegocio, noEncontrado, ErrorNegocio } = require('../lib/errores');
const { cifrar, descifrar } = require('../lib/cifrado');
const { crearLimite, porUsuario } = require('../lib/limites');
const log = require('../lib/log');
const { requerirSesion } = require('../lib/auth');
const { transaccion } = require('../db');
const V = require('../lib/validaciones');
const traductor = require('../lib/traductor');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// --- consultas auxiliares -------------------------------------------------------------
function lpcDe(db, conversacionId) {
  return db.prepare(`
    SELECT lpc.id, lpc.nombre, lpc.rol, lpc.lenguaje_id, lpc.region_id, l.nombre AS idioma_nombre, l.codigo AS idioma_codigo,
           r.nombre AS region_nombre, p.codigo AS pais_codigo, p.nombre AS pais_nombre
    FROM lenguaje_por_conversacion lpc
    JOIN lenguaje l ON l.id = lpc.lenguaje_id
    LEFT JOIN region r ON r.id = lpc.region_id
    LEFT JOIN pais p ON p.id = r.pais_id
    WHERE lpc.conversacion_id = ?`).all(conversacionId);
}

function configuracion(lpcs) {
  const f = (x) => x && ({ lenguaje_conversacion_id: x.id, idioma_id: x.lenguaje_id, idioma: x.idioma_nombre, codigo: x.idioma_codigo, region_id: x.region_id, region: x.region_nombre, pais: x.pais_nombre });
  return { origen: f(lpcs.find((x) => x.rol === 'origen')) || null, destino: f(lpcs.find((x) => x.rol === 'destino')) };
}

function conversacionDelUsuario(db, id, usuarioId) {
  const c = db.prepare('SELECT * FROM conversacion WHERE id = ? AND usuario_id = ?').get(id, usuarioId);
  if (!c) throw noEncontrado('No encontramos esa conversacion.');
  return c;
}

function mensajesDe(db, conversacionId) {
  const filas = db.prepare(`
    SELECT mo.id, mo.contenido, mo.remitente, mo.fecha_creacion, ca.nombre AS canal, en.nombre AS tono,
           md.id AS destino_id, md.contenido_traducido, md.nota_cultural, md.aproximada, md.motor, md.estado_entrega,
           (SELECT 1 FROM reporte rp WHERE rp.mensaje_destino_id = md.id LIMIT 1) AS reportado
    FROM mensaje_original mo
    JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
    JOIN canal ca ON ca.id = mo.canal_id
    JOIN entonacion en ON en.id = mo.entonacion_id
    LEFT JOIN mensaje_destino md ON md.mensaje_original_id = mo.id
    WHERE lpc.conversacion_id = ?
    ORDER BY mo.fecha_creacion, mo.rowid`).all(conversacionId);
  return filas.map(formatoMensaje);
}

function formatoMensaje(f) {
  return {
    id: f.id, remitente: f.remitente, canal: f.canal, tono: f.tono, contenido: descifrar(f.contenido), fecha: f.fecha_creacion,
    traduccion: f.destino_id ? { id: f.destino_id, contenido: descifrar(f.contenido_traducido), nota_cultural: f.nota_cultural, aproximada: !!f.aproximada, motor: f.motor, estado_entrega: f.estado_entrega, reportado: !!f.reportado } : null,
  };
}

function resumen(db, c) {
  const cfg = configuracion(lpcDe(db, c.id));
  const ultimo = db.prepare(`
    SELECT mo.contenido, md.contenido_traducido, mo.fecha_creacion
    FROM mensaje_original mo JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id
    LEFT JOIN mensaje_destino md ON md.mensaje_original_id = mo.id
    WHERE lpc.conversacion_id = ? ORDER BY mo.fecha_creacion DESC, mo.rowid DESC LIMIT 1`).get(c.id);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM mensaje_original mo JOIN lenguaje_por_conversacion lpc ON lpc.id = mo.lenguaje_conversacion_id WHERE lpc.conversacion_id = ?`).get(c.id).n;
  return { id: c.id, nombre: c.nombre, fecha_inicio: c.fecha_inicio, configuracion: cfg, total_mensajes: total, ultimo_mensaje: ultimo ? { contenido: descifrar(ultimo.contenido), traduccion: descifrar(ultimo.contenido_traducido), fecha: ultimo.fecha_creacion } : null };
}

function siguienteNombreLpc(db, conversacionId) {
  const n = db.prepare('SELECT COUNT(*) AS n FROM lenguaje_por_conversacion WHERE conversacion_id = ?').get(conversacionId).n;
  return `LC${n + 1}`;
}

function idiomaActivo(db, id, etiqueta) {
  const l = id && db.prepare('SELECT * FROM lenguaje WHERE id = ?').get(id);
  if (!l) throw mal(`Elige el idioma ${etiqueta}.`);
  if (!l.activo) throw reglaNegocio(`El idioma ${l.nombre} no esta disponible por ahora.`);
  return l;
}

// --- rutas ----------------------------------------------------------------------------
// Paginacion de listas (convenciones/api-rest.md seccion 5)
function paginar(lista, query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const total = lista.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);
  return { data: lista.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages } };
}

module.exports = function conversacionesRouter(db) {
  const r = express.Router();
  r.use('/conversaciones', requerirSesion(db));
  // Limite por usuario sobre la traduccion, que es la operacion costosa (convenciones/seguridad.md seccion 7)
  const limiteMensajes = crearLimite({
    maximo: Number(process.env.LIMITE_MENSAJES_POR_MINUTO) || 30,
    ventanaMs: 60 * 1000,
    clave: porUsuario,
    mensaje: 'Estas enviando mensajes muy rapido. Espera un momento e intenta de nuevo.',
  });

  // HU Crear conversacion + Configurar parametros una sola vez (Conversacion-RN-1, RN-3, RN-4)
  r.post('/conversaciones', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = b.nombre === undefined || V.texto(b.nombre) === '' ? 'Nueva Conversacion' : V.validarNombreConversacion(b.nombre);
    const destino = idiomaActivo(db, b.idioma_destino_id, 'al que quieres traducir');
    if (!b.region_destino_id) throw mal('Elige la region de destino.');
    const valida = db.prepare('SELECT 1 FROM lenguaje_region WHERE lenguaje_id = ? AND region_id = ?').get(destino.id, b.region_destino_id);
    if (!valida) throw reglaNegocio('La region elegida no es valida para ese idioma.');
    let origen = null;
    if (b.idioma_origen_id) {
      origen = idiomaActivo(db, b.idioma_origen_id, 'de origen');
      if (!traductor.soportaPar(origen.codigo, destino.codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
    } else if (!['es', 'en'].some((c) => traductor.soportaPar(c, destino.codigo))) {
      throw reglaNegocio('Ese idioma de destino todavia no esta disponible.');
    }
    const id = randomUUID();
    transaccion(db, () => {
      db.prepare('INSERT INTO conversacion (id, nombre, fecha_inicio, usuario_id) VALUES (?,?,?,?)').run(id, nombre, new Date().toISOString(), req.usuario.id);
      db.prepare('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)')
        .run(randomUUID(), 'LC1', id, destino.id, b.region_destino_id, 'destino');
      if (origen) {
        db.prepare('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)')
          .run(randomUUID(), 'LC2', id, origen.id, null, 'origen');
      }
    });
    res.status(201).location(`/api/v1/conversaciones/${id}`).json(resumen(db, db.prepare('SELECT * FROM conversacion WHERE id = ?').get(id)));
  }));

  // HU Consultar mi historial
  r.get('/conversaciones', (req, res) => {
    const filas = db.prepare('SELECT * FROM conversacion WHERE usuario_id = ? ORDER BY fecha_inicio DESC').all(req.usuario.id);
    const lista = filas.map((c) => resumen(db, c));
    lista.sort((a, b) => ((b.ultimo_mensaje && b.ultimo_mensaje.fecha) || b.fecha_inicio).localeCompare((a.ultimo_mensaje && a.ultimo_mensaje.fecha) || a.fecha_inicio));
    res.json(paginar(lista, req.query));
  });

  // HU Abrir una conversacion anterior
  r.get('/conversaciones/:id', (req, res) => {
    const c = conversacionDelUsuario(db, req.params.id, req.usuario.id);
    log.info('acceso_conversacion', { usuario_id: req.usuario.id, conversacion_id: c.id });
    res.json({ ...resumen(db, c), mensajes: mensajesDe(db, c.id) });
  });

  r.get('/conversaciones/:id/mensajes/:mensajeId', (req, res, next) => {
    const c = conversacionDelUsuario(db, req.params.id, req.usuario.id);
    const m = mensajesDe(db, c.id).find((x) => x.id === req.params.mensajeId);
    if (!m) return next(noEncontrado('No encontramos ese mensaje.'));
    res.json(m);
  });

  // HU Renombrar una conversacion (Conversacion-RN-4, RN-5)
  r.patch('/conversaciones/:id', ruta(async (req, res) => {
    const c = conversacionDelUsuario(db, req.params.id, req.usuario.id);
    const nombre = V.validarNombreConversacion((req.body || {}).nombre);
    db.prepare('UPDATE conversacion SET nombre = ? WHERE id = ?').run(nombre, c.id);
    res.json(resumen(db, { ...c, nombre }));
  }));

  // HU Eliminar una conversacion
  r.delete('/conversaciones/:id', (req, res) => {
    const c = conversacionDelUsuario(db, req.params.id, req.usuario.id);
    transaccion(db, () => {
      db.prepare('DELETE FROM conversacion WHERE id = ?').run(c.id); // borra idiomas, mensajes y reportes en cascada
    });
    log.info('conversacion_eliminada', { usuario_id: req.usuario.id, conversacion_id: c.id });
    res.status(204).end();
  });

  // HU Ingresar mi mensaje (hablando o escribiendo), Traducir, Reconocer idioma origen, Recibir por el mismo canal,
  // y Participacion del interlocutor (remitente = 'interlocutor' responde en su idioma)
  r.post('/conversaciones/:id/mensajes', limiteMensajes, ruta(async (req, res) => {
    const c = conversacionDelUsuario(db, req.params.id, req.usuario.id);
    const b = req.body || {};
    const contenido = V.validarContenidoMensaje(b.contenido);
    const canalNombre = String(b.canal || 'texto').toLowerCase() === 'voz' ? 'Voz' : String(b.canal || 'texto').toLowerCase() === 'texto' ? 'Texto' : null;
    if (!canalNombre) throw mal('El canal debe ser texto o voz.');
    const remitente = b.remitente === 'interlocutor' ? 'interlocutor' : 'usuario';

    let lpcs = lpcDe(db, c.id);
    const destinoLpc = lpcs.find((x) => x.rol === 'destino');
    let origenLpc = lpcs.find((x) => x.rol === 'origen');
    let aviso = null;

    // Conversacion-RN-2: el idioma origen se detecta con el primer mensaje y ya no cambia
    if (!origenLpc) {
      if (remitente === 'interlocutor') throw reglaNegocio('Primero envia tu mensaje para que reconozcamos tu idioma.');
      let codigo = b.idioma_origen_id ? db.prepare('SELECT codigo FROM lenguaje WHERE id = ?').get(b.idioma_origen_id)?.codigo : traductor.detectarIdioma(contenido);
      if (!codigo) throw reglaNegocio('No pudimos reconocer tu idioma. Escribe un poco mas para poder detectarlo.');
      let origen = db.prepare('SELECT * FROM lenguaje WHERE codigo = ? AND activo = 1').get(codigo);
      if (!origen) throw reglaNegocio('No pudimos reconocer tu idioma entre los disponibles. Elige tu idioma de origen.');
      if (!traductor.soportaPar(origen.codigo, destinoLpc.idioma_codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
      const regionDetectada = traductor.detectarRegionOrigen(contenido);
      const regionId = regionDetectada
        ? db.prepare('SELECT r.id FROM region r JOIN pais p ON p.id = r.pais_id JOIN lenguaje_region lr ON lr.region_id = r.id WHERE r.nombre = ? AND p.nombre = ? AND lr.lenguaje_id = ?').get(regionDetectada.region, regionDetectada.pais, origen.id)?.id || null
        : null;
      db.prepare('INSERT INTO lenguaje_por_conversacion (id, nombre, conversacion_id, lenguaje_id, region_id, rol) VALUES (?,?,?,?,?,?)')
        .run(randomUUID(), siguienteNombreLpc(db, c.id), c.id, origen.id, regionId, 'origen');
      lpcs = lpcDe(db, c.id);
      origenLpc = lpcs.find((x) => x.rol === 'origen');
    }

    const escribeEn = remitente === 'usuario' ? origenLpc : destinoLpc;
    const traduceA = remitente === 'usuario' ? destinoLpc : origenLpc;
    const detectado = traductor.detectarIdioma(contenido);
    if (detectado && detectado !== escribeEn.idioma_codigo) {
      aviso = `El mensaje parece estar en otro idioma; lo traducimos como ${escribeEn.idioma_nombre}.`;
    }

    const tonos = db.prepare('SELECT id, nombre FROM entonacion WHERE activo = 1').all();
    let t;
    const inicio = Date.now();
    try {
      t = await traductor.traducir({
        texto: contenido,
        origen: { codigo: escribeEn.idioma_codigo, nombre: escribeEn.idioma_nombre },
        destino: { codigo: traduceA.idioma_codigo, nombre: traduceA.idioma_nombre },
        regionDestino: traduceA.region_nombre ? { nombre: traduceA.region_nombre, paisCodigo: traduceA.pais_codigo } : null,
        tonos: tonos.map((x) => x.nombre),
      });
    } catch (e) {
      log.error('traduccion_fallida', { conversacion_id: c.id, duracion_ms: Date.now() - inicio, detalle: e.message });
      throw new ErrorNegocio(502, 'No pudimos traducir tu mensaje en este momento. Intenta de nuevo.');
    }

    // DRV-01: se registra cuanto tardo cada traduccion y con que motor (sin el contenido)
    log.info('traduccion', { conversacion_id: c.id, motor: t.motor, duracion_ms: Date.now() - inicio, canal: canalNombre, aproximada: !!t.aproximada });
    const tono = tonos.find((x) => x.nombre === t.tono) || tonos.find((x) => x.nombre === 'Neutral');
    const canal = db.prepare('SELECT id FROM canal WHERE nombre = ?').get(canalNombre);
    const ahora = new Date().toISOString();
    const origenId = randomUUID();
    const destinoId = randomUUID();
    transaccion(db, () => {
      db.prepare('INSERT INTO mensaje_original (id, lenguaje_conversacion_id, canal_id, entonacion_id, contenido, remitente, fecha_creacion) VALUES (?,?,?,?,?,?,?)')
        .run(origenId, escribeEn.id, canal.id, tono.id, cifrar(contenido), remitente, ahora);
      db.prepare('INSERT INTO mensaje_destino (id, mensaje_original_id, lenguaje_conversacion_id, contenido_traducido, nota_cultural, aproximada, motor, estado_entrega, fecha_creacion) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(destinoId, origenId, traduceA.id, cifrar(t.traduccion), t.nota, t.aproximada ? 1 : 0, t.motor, 'Entregado', ahora);
    });

    const mensaje = formatoMensaje({
      id: origenId, contenido: cifrar(contenido), remitente, fecha_creacion: ahora, canal: canalNombre, tono: tono.nombre,
      destino_id: destinoId, contenido_traducido: cifrar(t.traduccion), nota_cultural: t.nota, aproximada: t.aproximada ? 1 : 0, motor: t.motor, estado_entrega: 'Entregado', reportado: 0,
    });
    res.status(201).location(`/api/v1/conversaciones/${c.id}/mensajes/${origenId}`).json({
      mensaje,
      // Se entrega por el mismo canal en que llego (REQ-AUDIO-002): si hablaste, el cliente reproduce el audio
      entrega: { canal: canalNombre, reproducir_audio: canalNombre === 'Voz', idioma_codigo: traduceA.idioma_codigo, region_origen_detectada: t.regionOrigen },
      configuracion: configuracion(lpcs),
      aviso,
    });
  }));

  return r;
};

module.exports.paginar = paginar;
