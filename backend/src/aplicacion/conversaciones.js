// Caso de uso: conversaciones y mensajes (epicas Gestion de conversaciones, Traduccion de mensajes y
// Participacion del interlocutor). Aplica las reglas Conversacion-RN-1 a RN-5 y orquesta la
// traduccion. Solo usa puertos (Repositorio, Cifrador) y el servicio de traduccion; no conoce HTTP.
const { randomUUID } = require('node:crypto');
const { mal, reglaNegocio, noEncontrado, ErrorNegocio } = require('../dominio/errores');
const { detectarIdioma, detectarRegionOrigen } = require('../dominio/analisis');
const V = require('../dominio/validaciones');
const { analizarProsodia } = require('../dominio/prosodia');

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // unos minutos de audio comprimido
const TIPOS_AUDIO = /^audio\/(m4a|mp4|x-m4a|aac|webm|ogg|wav|x-wav|mpeg|3gpp)(;.*)?$/i;

function crearServicioConversaciones({ repo, traduccion, cifrador, transcriptor, log }) {
  const { cifrar, descifrar } = cifrador;

  // --- formato (puro) ---
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

  async function resumen(c) {
    const cfg = configuracion(await repo.conversaciones.lpcDe(c.id));
    const ultimo = await repo.mensajes.ultimo(c.id);
    const total = await repo.mensajes.contar(c.id);
    return { id: c.id, nombre: c.nombre, fecha_inicio: c.fecha_inicio, configuracion: cfg, total_mensajes: total, ultimo_mensaje: ultimo ? { contenido: descifrar(ultimo.contenido), traduccion: descifrar(ultimo.contenido_traducido), fecha: ultimo.fecha_creacion } : null };
  }

  // Solo el dueno ve su conversacion; a cualquier otra persona se le responde "no existe"
  async function delUsuario(usuarioId, id) {
    const c = await repo.conversaciones.delUsuario(id, usuarioId);
    if (!c) throw noEncontrado('No encontramos esa conversacion.');
    return c;
  }

  async function idiomaActivo(id, etiqueta) {
    const l = id ? await repo.catalogo.lenguajePorId(id) : null;
    if (!l) throw mal(`Elige el idioma ${etiqueta}.`);
    if (!l.activo) throw reglaNegocio(`El idioma ${l.nombre} no esta disponible por ahora.`);
    return l;
  }

  // HU Crear conversacion + Configurar parametros (Conversacion-RN-1, RN-3, RN-4)
  async function crear(usuarioId, datos) {
    const nombre = datos.nombre === undefined || V.texto(datos.nombre) === '' ? 'Nueva Conversacion' : V.validarNombreConversacion(datos.nombre);
    const destino = await idiomaActivo(datos.idioma_destino_id, 'al que quieres traducir');
    if (!datos.region_destino_id) throw mal('Elige la region de destino.');
    if (!(await repo.catalogo.regionValidaParaLenguaje(destino.id, datos.region_destino_id))) throw reglaNegocio('La region elegida no es valida para ese idioma.');
    let origen = null;
    if (datos.idioma_origen_id) {
      origen = await idiomaActivo(datos.idioma_origen_id, 'de origen');
      if (!traduccion.soportaPar(origen.codigo, destino.codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
    } else if (!['es', 'en'].some((c) => traduccion.soportaPar(c, destino.codigo))) {
      throw reglaNegocio('Ese idioma de destino todavia no esta disponible.');
    }
    const id = randomUUID();
    await repo.conversaciones.crearConfigurada({
      convId: id, nombre, usuarioId, fecha: new Date().toISOString(),
      destino: { lpcId: randomUUID(), lenguajeId: destino.id, regionId: datos.region_destino_id },
      origen: origen ? { lpcId: randomUUID(), lenguajeId: origen.id } : null,
    });
    return resumen(await repo.conversaciones.porId(id));
  }

  // HU Consultar mi historial: las mas recientes primero
  async function listar(usuarioId) {
    const filas = await repo.conversaciones.listarDeUsuario(usuarioId);
    const lista = await Promise.all(filas.map(resumen));
    return lista.sort((a, b) => ((b.ultimo_mensaje && b.ultimo_mensaje.fecha) || b.fecha_inicio).localeCompare((a.ultimo_mensaje && a.ultimo_mensaje.fecha) || a.fecha_inicio));
  }

  // HU Abrir una conversacion anterior
  async function abrir(usuarioId, id) {
    const c = await delUsuario(usuarioId, id);
    log.info('acceso_conversacion', { usuario_id: usuarioId, conversacion_id: c.id });
    return { ...(await resumen(c)), mensajes: (await repo.mensajes.deConversacion(c.id)).map(formatoMensaje) };
  }

  async function mensaje(usuarioId, id, mensajeId) {
    const c = await delUsuario(usuarioId, id);
    const m = (await repo.mensajes.deConversacion(c.id)).map(formatoMensaje).find((x) => x.id === mensajeId);
    if (!m) throw noEncontrado('No encontramos ese mensaje.');
    return m;
  }

  // HU Renombrar una conversacion (Conversacion-RN-4, RN-5)
  async function renombrar(usuarioId, id, nombreEntrada) {
    const c = await delUsuario(usuarioId, id);
    const nombre = V.validarNombreConversacion(nombreEntrada);
    await repo.conversaciones.renombrar(c.id, nombre);
    return resumen({ ...c, nombre });
  }

  // HU Eliminar una conversacion
  async function eliminar(usuarioId, id) {
    const c = await delUsuario(usuarioId, id);
    await repo.conversaciones.eliminar(c.id);
    log.info('conversacion_eliminada', { usuario_id: usuarioId, conversacion_id: c.id });
  }

  // Conversacion-RN-2: el idioma origen se detecta con el primer mensaje y ya no cambia
  async function asegurarOrigen(c, datos, contenido, remitente, destinoLpc) {
    if (remitente === 'interlocutor') throw reglaNegocio('Primero envia tu mensaje para que reconozcamos tu idioma.');
    const codigo = datos.idioma_origen_id ? (await repo.catalogo.lenguajePorId(datos.idioma_origen_id) || {}).codigo : detectarIdioma(contenido);
    if (!codigo) throw reglaNegocio('No pudimos reconocer tu idioma. Escribe un poco mas para poder detectarlo.');
    const origen = await repo.catalogo.lenguajePorCodigoActivo(codigo);
    if (!origen) throw reglaNegocio('No pudimos reconocer tu idioma entre los disponibles. Elige tu idioma de origen.');
    if (!traduccion.soportaPar(origen.codigo, destinoLpc.idioma_codigo)) throw reglaNegocio('Esa combinacion de idiomas todavia no esta disponible.');
    const regionDetectada = detectarRegionOrigen(contenido);
    const regionId = regionDetectada ? await repo.catalogo.regionIdPorNombrePaisLenguaje(regionDetectada.region, regionDetectada.pais, origen.id) : null;
    await repo.conversaciones.crearLpc({ id: randomUUID(), nombre: `LC${(await repo.conversaciones.contarLpc(c.id)) + 1}`, convId: c.id, lenguajeId: origen.id, regionId, rol: 'origen' });
  }

  // HU Ingresar mensaje (voz/texto), Traducir, Reconocer idioma origen, Recibir por el mismo canal,
  // Recibir y responder (interlocutor)
  async function enviarMensaje(usuarioId, id, datos, { prosodia = null } = {}) {
    const c = await delUsuario(usuarioId, id);
    const contenido = V.validarContenidoMensaje(datos.contenido);
    const canalEntrada = String(datos.canal || 'texto').toLowerCase();
    const canalNombre = canalEntrada === 'voz' ? 'Voz' : canalEntrada === 'texto' ? 'Texto' : null;
    if (!canalNombre) throw mal('El canal debe ser texto o voz.');
    const remitente = datos.remitente === 'interlocutor' ? 'interlocutor' : 'usuario';

    let lpcs = await repo.conversaciones.lpcDe(c.id);
    const destinoLpc = lpcs.find((x) => x.rol === 'destino');
    if (!lpcs.some((x) => x.rol === 'origen')) {
      await asegurarOrigen(c, datos, contenido, remitente, destinoLpc);
      lpcs = await repo.conversaciones.lpcDe(c.id);
    }
    const origenLpc = lpcs.find((x) => x.rol === 'origen');

    const escribeEn = remitente === 'usuario' ? origenLpc : destinoLpc;
    const traduceA = remitente === 'usuario' ? destinoLpc : origenLpc;
    const detectado = detectarIdioma(contenido);
    const aviso = detectado && detectado !== escribeEn.idioma_codigo ? `El mensaje parece estar en otro idioma; lo traducimos como ${escribeEn.idioma_nombre}.` : null;

    const tonos = await repo.catalogo.entonacionesActivas();
    let t;
    const inicio = Date.now();
    try {
      t = await traduccion.traducir({
        texto: contenido,
        origen: { codigo: escribeEn.idioma_codigo, nombre: escribeEn.idioma_nombre },
        destino: { codigo: traduceA.idioma_codigo, nombre: traduceA.idioma_nombre },
        regionDestino: traduceA.region_nombre ? { nombre: traduceA.region_nombre, paisCodigo: traduceA.pais_codigo } : null,
        tonos: tonos.map((x) => x.nombre),
        prosodia,
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
    const contenidoCifrado = cifrar(contenido);
    const traduccionCifrada = cifrar(t.traduccion);
    await repo.mensajes.crear({
      origen: { id: origenId, lpcId: escribeEn.id, canalId: canal.id, entonacionId: tono.id, contenido: contenidoCifrado, remitente, fecha: ahora },
      destino: { id: destinoId, lpcId: traduceA.id, contenido_traducido: traduccionCifrada, nota: t.nota, aproximada: t.aproximada, motor: t.motor, estado_entrega: 'Entregado', fecha: ahora },
    });

    return {
      conversacionId: c.id,
      mensaje: formatoMensaje({
        id: origenId, contenido: contenidoCifrado, remitente, fecha_creacion: ahora, canal: canalNombre, tono: tono.nombre,
        destino_id: destinoId, contenido_traducido: traduccionCifrada, nota_cultural: t.nota, aproximada: t.aproximada ? 1 : 0, motor: t.motor, estado_entrega: 'Entregado', reportado: 0,
      }),
      entrega: { canal: canalNombre, reproducir_audio: canalNombre === 'Voz', idioma_codigo: traduceA.idioma_codigo, region_origen_detectada: t.regionOrigen, ritmo_voz: prosodia ? prosodia.ritmoSalida : 1 },
      configuracion: configuracion(lpcs),
      aviso,
    };
  }

  // HU Ingresar mi mensaje hablando: el audio llega grabado desde la app, se pasa a texto (puerto
  // Transcriptor), se mide COMO se dijo (prosodia) y sigue el mismo flujo de un mensaje, por el canal Voz.
  async function enviarMensajeVoz(usuarioId, id, datos) {
    const c = await delUsuario(usuarioId, id); // primero se verifica que la conversacion sea del usuario
    if (!transcriptor || !transcriptor.disponible()) throw new ErrorNegocio(503, 'La transcripcion de voz no esta configurada en el servidor. Escribe tu mensaje por ahora.');
    const tipo = String(datos.tipo || 'audio/m4a');
    if (!TIPOS_AUDIO.test(tipo)) throw mal('El formato de audio no es compatible.');
    if (typeof datos.audio_base64 !== 'string' || !datos.audio_base64) throw mal('No recibimos el audio. Intenta grabar de nuevo.');
    const audio = Buffer.from(datos.audio_base64, 'base64');
    if (!audio.length) throw mal('No recibimos el audio. Intenta grabar de nuevo.');
    if (audio.length > MAX_AUDIO_BYTES) throw mal('El audio es muy largo. Graba un mensaje mas corto.');

    const lpcs = await repo.conversaciones.lpcDe(c.id);
    const remitente = datos.remitente === 'interlocutor' ? 'interlocutor' : 'usuario';
    const habla = lpcs.find((x) => x.rol === (remitente === 'usuario' ? 'origen' : 'destino'));
    const inicio = Date.now();
    let texto;
    try {
      ({ texto } = await transcriptor.transcribir({ audio, tipo, idioma: habla ? habla.idioma_codigo : undefined }));
    } catch (e) {
      if (e instanceof ErrorNegocio) throw e;
      log.error('transcripcion_fallida', { conversacion_id: c.id, duracion_ms: Date.now() - inicio, detalle: e.message });
      throw new ErrorNegocio(502, 'No pudimos entender el audio en este momento. Intenta de nuevo o escribe tu mensaje.');
    }
    log.info('transcripcion', { conversacion_id: c.id, duracion_ms: Date.now() - inicio, bytes: audio.length });
    if (!texto) throw reglaNegocio('No escuchamos nada en el audio. Acercate al microfono e intenta de nuevo.');

    const prosodia = analizarProsodia(datos.prosodia, texto);
    const r = await enviarMensaje(usuarioId, id, { contenido: texto, canal: 'voz', remitente, idioma_origen_id: datos.idioma_origen_id }, { prosodia });
    return { ...r, transcripcion: texto, prosodia: prosodia ? { tono_voz: prosodia.tono, descripcion: prosodia.descripcion } : null };
  }

  return { crear, listar, abrir, mensaje, renombrar, eliminar, enviarMensaje, enviarMensajeVoz };
}

module.exports = { crearServicioConversaciones };
