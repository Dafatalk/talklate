const express = require('express');
const { randomUUID } = require('node:crypto');
const { mal, reglaNegocio, noEncontrado, ErrorNegocio } = require('../lib/errores');
const { cifrar, descifrar } = require('../lib/cifrado');
const { crearLimite, porUsuario } = require('../lib/limites');
const log = require('../lib/log');
const { requerirSesion } = require('../lib/auth');
const V = require('../lib/validaciones');
const traductor = require('../lib/traductor');

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// --- formato (puro) -------------------------------------------------------------------
function configuracion(lpcs) {
  const f = (x) => x && ({ lenguaje_conversacion_id: x.id, idioma_id: x.lenguaje_id, idioma: x.idioma_nombre, codigo: x.idioma_codigo, region_id: x.region_id, region: x.region_nombre, pais: x.pais_nombre });
  return { origen: f(lpcs.find((x) => x.rol === 'origen')) || null, destino: f(lpcs.find((x) => x.rol === 'destino')) };
}

function formatoMensaje(f) {
  return {
    id: f.id, remitente: f.remitente, canal: f.canal, tono: f.tono, contenido: descifrar(f.contenido), fecha: f.fecha_creacion,
    traduccion: f.destino_id ? { id: f.destino_id, contenido: descifrar(f.contenido_traducido), nota_cultural: f.nota_cultural, aproximada: !!f.aproximada, motor: f.motor, estado_entrega: f.estado_entrega, reportado: !!f.reportado } : null,
  };
}

async function resumen(repo, c) {
  const cfg = configuracion(await repo.conversaciones.lpcDe(c.id));
  const ultimo = await repo.mensajes.ultimo(c.id);
  const total = await repo.mensajes.contar(c.id);
  return { id: c.id, nombre: c.nombre, fecha_inicio: c.fecha_inicio, configuracion: cfg, total_mensajes: total, ultimo_mensaje: ultimo ? { contenido: descifrar(ultimo.contenido), traduccion: descifrar(ultimo.contenido_traducido), fecha: ultimo.fecha_creacion } : null };
}

async function conversacionDelUsuario(repo, id, usuarioId) {
  const c = await repo.conversaciones.delUsuario(id, usuarioId);
  if (!c) throw noEncontrado('No encontramos esa conversacion.');
  return c;
}

async function idiomaActivo(repo, id, etiqueta) {
  const l = id ? await repo.catalogo.lenguajePorId(id) : null;
  if (!l) throw mal(`Elige el idioma ${etiqueta}.`);
  if (!l.activo) throw reglaNegocio(`El idioma ${l.nombre} no esta disponible por ahora.`);
  return l;
}

// Paginacion de listas (convenciones/api-rest.md seccion 5)
function paginar(lista, query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const total = lista.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);
  return { data: lista.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages } };
}

module.exports = function conversacionesRouter(repo) {
  const r = express.Router();
  r.use('/conversaciones', requerirSesion(repo));
  const limiteMensajes = crearLimite({
    maximo: Number(process.env.LIMITE_MENSAJES_POR_MINUTO) || 30,
    ventanaMs: 60 * 1000,
    clave: porUsuario,
    mensaje: 'Estas enviando mensajes muy rapido. Espera un momento e intenta de nuevo.',
  });

  // HU Crear conversacion + Configurar parametros (Conversacion-RN-1, RN-3, RN-4)
  r.post('/conversaciones', ruta(async (req, res) => {
    const b = req.body || {};
    const nombre = b.nombre === undefined || V.texto(b.nombre) === '' ? 'Nueva Conversacion' : V.validarNombreConversacion(b.nombre);
    const destino = await idiomaActivo(repo, b.idioma_destino_id, 'al que quieres traducir');
    if (!b.region_destino_id) throw mal('Elige la region de destino.');
    if (!(await repo.catalogo.regionValidaParaLenguaje(destino.id, b.region_destino_id))) throw reglaNegocio('La region elegida no es valida para ese idioma.');
    let origen = null;
    if (b.idioma_origen_id) {
      origen = await idiomaActivo(repo, b.idioma_origen_id, 'de origen');
      if (!traductor.soportaPar(origen.codigo, destino.codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
    } else if (!['es', 'en'].some((c) => traductor.soportaPar(c, destino.codigo))) {
      throw reglaNegocio('Ese idioma de destino todavia no esta disponible.');
    }
    const id = randomUUID();
    await repo.conversaciones.crearConfigurada({
      convId: id, nombre, usuarioId: req.usuario.id, fecha: new Date().toISOString(),
      destino: { lpcId: randomUUID(), lenguajeId: destino.id, regionId: b.region_destino_id },
      origen: origen ? { lpcId: randomUUID(), lenguajeId: origen.id } : null,
    });
    res.status(201).location(`/api/v1/conversaciones/${id}`).json(await resumen(repo, await repo.conversaciones.porId(id)));
  }));

  // HU Consultar mi historial
  r.get('/conversaciones', ruta(async (req, res) => {
    const filas = await repo.conversaciones.listarDeUsuario(req.usuario.id);
    const lista = await Promise.all(filas.map((c) => resumen(repo, c)));
    lista.sort((a, b) => ((b.ultimo_mensaje && b.ultimo_mensaje.fecha) || b.fecha_inicio).localeCompare((a.ultimo_mensaje && a.ultimo_mensaje.fecha) || a.fecha_inicio));
    res.json(paginar(lista, req.query));
  }));

  // HU Abrir una conversacion anterior
  r.get('/conversaciones/:id', ruta(async (req, res) => {
    const c = await conversacionDelUsuario(repo, req.params.id, req.usuario.id);
    log.info('acceso_conversacion', { usuario_id: req.usuario.id, conversacion_id: c.id });
    res.json({ ...(await resumen(repo, c)), mensajes: (await repo.mensajes.deConversacion(c.id)).map(formatoMensaje) });
  }));

  r.get('/conversaciones/:id/mensajes/:mensajeId', ruta(async (req, res, next) => {
    const c = await conversacionDelUsuario(repo, req.params.id, req.usuario.id);
    const m = (await repo.mensajes.deConversacion(c.id)).map(formatoMensaje).find((x) => x.id === req.params.mensajeId);
    if (!m) return next(noEncontrado('No encontramos ese mensaje.'));
    res.json(m);
  }));

  // HU Renombrar una conversacion (Conversacion-RN-4, RN-5)
  r.patch('/conversaciones/:id', ruta(async (req, res) => {
    const c = await conversacionDelUsuario(repo, req.params.id, req.usuario.id);
    const nombre = V.validarNombreConversacion((req.body || {}).nombre);
    await repo.conversaciones.renombrar(c.id, nombre);
    res.json(await resumen(repo, { ...c, nombre }));
  }));

  // HU Eliminar una conversacion
  r.delete('/conversaciones/:id', ruta(async (req, res) => {
    const c = await conversacionDelUsuario(repo, req.params.id, req.usuario.id);
    await repo.conversaciones.eliminar(c.id);
    log.info('conversacion_eliminada', { usuario_id: req.usuario.id, conversacion_id: c.id });
    res.status(204).end();
  }));

  // HU Ingresar mensaje (voz/texto), Traducir, Reconocer idioma origen, Recibir por el mismo canal
  r.post('/conversaciones/:id/mensajes', limiteMensajes, ruta(async (req, res) => {
    const c = await conversacionDelUsuario(repo, req.params.id, req.usuario.id);
    const b = req.body || {};
    const contenido = V.validarContenidoMensaje(b.contenido);
    const canalEntrada = String(b.canal || 'texto').toLowerCase();
    const canalNombre = canalEntrada === 'voz' ? 'Voz' : canalEntrada === 'texto' ? 'Texto' : null;
    if (!canalNombre) throw mal('El canal debe ser texto o voz.');
    const remitente = b.remitente === 'interlocutor' ? 'interlocutor' : 'usuario';

    let lpcs = await repo.conversaciones.lpcDe(c.id);
    const destinoLpc = lpcs.find((x) => x.rol === 'destino');
    let origenLpc = lpcs.find((x) => x.rol === 'origen');
    let aviso = null;

    // Conversacion-RN-2: el idioma origen se detecta con el primer mensaje y ya no cambia
    if (!origenLpc) {
      if (remitente === 'interlocutor') throw reglaNegocio('Primero envia tu mensaje para que reconozcamos tu idioma.');
      let codigo = b.idioma_origen_id ? (await repo.catalogo.lenguajePorId(b.idioma_origen_id) || {}).codigo : traductor.detectarIdioma(contenido);
      if (!codigo) throw reglaNegocio('No pudimos reconocer tu idioma. Escribe un poco mas para poder detectarlo.');
      const origen = await repo.catalogo.lenguajePorCodigoActivo(codigo);
      if (!origen) throw reglaNegocio('No pudimos reconocer tu idioma entre los disponibles. Elige tu idioma de origen.');
      if (!traductor.soportaPar(origen.codigo, destinoLpc.idioma_codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
      const regionDetectada = traductor.detectarRegionOrigen(contenido);
      const regionId = regionDetectada
        ? await repo.catalogo.regionIdPorNombrePaisLenguaje(regionDetectada.region, regionDetectada.pais, origen.id)
        : null;
      await repo.conversaciones.crearLpc({ id: randomUUID(), nombre: `LC${(await repo.conversaciones.contarLpc(c.id)) + 1}`, convId: c.id, lenguajeId: origen.id, regionId, rol: 'origen' });
      lpcs = await repo.conversaciones.lpcDe(c.id);
      origenLpc = lpcs.find((x) => x.rol === 'origen');
    }

    const escribeEn = remitente === 'usuario' ? origenLpc : destinoLpc;
    const traduceA = remitente === 'usuario' ? destinoLpc : origenLpc;
    const detectado = traductor.detectarIdioma(contenido);
    if (detectado && detectado !== escribeEn.idioma_codigo) {
      aviso = `El mensaje parece estar en otro idioma; lo traducimos como ${escribeEn.idioma_nombre}.`;
    }

    const tonos = await repo.catalogo.entonacionesActivas();
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

    log.info('traduccion', { conversacion_id: c.id, motor: t.motor, duracion_ms: Date.now() - inicio, canal: canalNombre, aproximada: !!t.aproximada });
    const tono = tonos.find((x) => x.nombre === t.tono) || tonos.find((x) => x.nombre === 'Neutral') || tonos[0];
    const canal = await repo.catalogo.canalPorNombre(canalNombre);
    const ahora = new Date().toISOString();
    const origenId = randomUUID();
    const destinoId = randomUUID();
    await repo.mensajes.crear({
      origen: { id: origenId, lpcId: escribeEn.id, canalId: canal.id, entonacionId: tono.id, contenido: cifrar(contenido), remitente, fecha: ahora },
      destino: { id: destinoId, lpcId: traduceA.id, contenido_traducido: cifrar(t.traduccion), nota: t.nota, aproximada: t.aproximada, motor: t.motor, estado_entrega: 'Entregado', fecha: ahora },
    });

    const mensaje = formatoMensaje({
      id: origenId, contenido: cifrar(contenido), remitente, fecha_creacion: ahora, canal: canalNombre, tono: tono.nombre,
      destino_id: destinoId, contenido_traducido: cifrar(t.traduccion), nota_cultural: t.nota, aproximada: t.aproximada ? 1 : 0, motor: t.motor, estado_entrega: 'Entregado', reportado: 0,
    });
    res.status(201).location(`/api/v1/conversaciones/${c.id}/mensajes/${origenId}`).json({
      mensaje,
      entrega: { canal: canalNombre, reproducir_audio: canalNombre === 'Voz', idioma_codigo: traduceA.idioma_codigo, region_origen_detectada: t.regionOrigen },
      configuracion: configuracion(lpcs),
      aviso,
    });
  }));

  return r;
};

module.exports.paginar = paginar;
