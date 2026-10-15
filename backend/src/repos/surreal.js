// Repositorio (adaptadores) sobre SurrealDB — fuente de verdad del backend.
// Expone la MISMA superficie que el repositorio SQLite (repos/sqlite.js) pero async.
//
// Idioma: las TABLAS y CAMPOS en SurrealDB estan en INGLES; el API/dominio usan
// claves en espanol. El adaptador traduce: en lecturas con alias `columna AS clave_es`
// y en escrituras usando los nombres de columna en ingles. Los VALORES de enum se
// mantienen en espanol (origen/destino, usuario/interlocutor, Pendiente.., abierto..)
// porque la logica de negocio y el API los usan tal cual.
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const S = require('../surreal');

const ESQUEMA = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'surreal', 'schema.surql'), 'utf8');

// Catalogo inicial. Nombres de catalogo (datos) en espanol; es/en activos; fr/pt inactivos.
const PAISES = [
  ['Colombia', 'CO'], ['Estados Unidos', 'US'], ['Espana', 'ES'], ['Mexico', 'MX'],
  ['Argentina', 'AR'], ['Reino Unido', 'GB'], ['Francia', 'FR'], ['Brasil', 'BR'],
];
const REGIONES = [
  ['Antioquia', 'Colombia', ['es']], ['Bogota', 'Colombia', ['es']],
  ['Madrid', 'Espana', ['es']], ['Ciudad de Mexico', 'Mexico', ['es']],
  ['Buenos Aires', 'Argentina', ['es']],
  ['California', 'Estados Unidos', ['en']], ['Texas', 'Estados Unidos', ['en', 'es']],
  ['Londres', 'Reino Unido', ['en']],
  ['Paris', 'Francia', ['fr']], ['Rio de Janeiro', 'Brasil', ['pt']],
];
const LENGUAJES = [['Espanol', 'es', true], ['Ingles', 'en', true], ['Frances', 'fr', false], ['Portugues', 'pt', false]];
const ENTONACIONES = ['Neutral', 'Amigable', 'Alegre', 'Preocupado', 'Enojado', 'Formal'];
const CANALES = ['Texto', 'Voz'];

const { lit, rid, idPlano } = S;

// --- helpers de construccion ----------------------------------------------------------
// `campos` ya trae claves con el nombre de columna en INGLES.
function sets(campos) {
  return Object.entries(campos)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} = ${lit(v)}`)
    .join(', ');
}

function planoId(fila) {
  if (!fila) return fila;
  if (fila.id !== undefined) fila.id = idPlano(fila.id);
  return fila;
}

// Crea un registro (tabla en ingles) y devuelve { id } con el id de negocio.
async function crearRegistro(tabla, id, campos) {
  const f = await S.fila(`CREATE ${lit(rid(tabla, id))} SET ${sets(campos)} RETURN AFTER;`);
  return { id: idPlano(f && f.id) };
}

async function contar(tabla, where = '') {
  const f = await S.fila(`SELECT count() AS n FROM ${tabla} ${where ? 'WHERE ' + where : ''} GROUP ALL;`);
  return f ? f.n : 0;
}

// --- inicializacion (esquema + semilla, idempotente) ----------------------------------
async function inicializar() {
  await S.conectar();
  await S.consulta(ESQUEMA); // DEFINE ... IF NOT EXISTS (idempotente)
  await sembrar();
}

async function sembrar() {
  const hayLenguajes = await contar('language');
  if (!hayLenguajes) {
    const paisId = {};
    const lenId = {};
    const stmts = ['BEGIN TRANSACTION;'];
    for (const [nombre, codigo] of PAISES) {
      const id = randomUUID();
      paisId[nombre] = id;
      stmts.push(`CREATE ${lit(rid('country', id))} SET name = ${lit(nombre)}, code = ${lit(codigo)};`);
    }
    for (const [nombre, codigo, activo] of LENGUAJES) {
      const id = randomUUID();
      lenId[codigo] = id;
      stmts.push(`CREATE ${lit(rid('language', id))} SET name = ${lit(nombre)}, code = ${lit(codigo)}, active = ${lit(activo)};`);
    }
    for (const [nombre, pais, langs] of REGIONES) {
      const id = randomUUID();
      stmts.push(`CREATE ${lit(rid('region', id))} SET name = ${lit(nombre)}, country = ${lit(rid('country', paisId[pais]))};`);
      for (const l of langs) {
        stmts.push(`CREATE language_region SET language = ${lit(rid('language', lenId[l]))}, region = ${lit(rid('region', id))};`);
      }
    }
    for (const n of ENTONACIONES) stmts.push(`CREATE ${lit(rid('tone', randomUUID()))} SET name = ${lit(n)}, active = true;`);
    for (const n of CANALES) stmts.push(`CREATE ${lit(rid('channel', randomUUID()))} SET name = ${lit(n)};`);
    stmts.push('COMMIT TRANSACTION;');
    await S.consulta(stmts.join('\n'));
  }

  const correo = (process.env.ADMIN_CORREO || 'dafa123.daf@gmail.com').toLowerCase();
  const existe = await usuarios.porCorreo(correo);
  if (!existe) {
    const ahora = new Date().toISOString();
    await usuarios.crear({
      id: randomUUID(),
      nombre: 'Admin',
      apellido: 'TalkLate',
      correo,
      password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 10),
      fecha_nacimiento: '1990-01-01',
      rol: 'admin',
      consentimiento_datos: ahora,
      creado: ahora,
    });
  }
}

// Campos del usuario (ingles AS espanol) para lecturas
const SEL_USUARIO = 'first_name AS nombre, last_name AS apellido, email AS correo, password_hash, birth_date AS fecha_nacimiento, role AS rol, data_consent AS consentimiento_datos, created_at AS creado, id';

// --- usuarios -------------------------------------------------------------------------
const usuarios = {
  async crear(u) {
    return crearRegistro('user', u.id, {
      first_name: u.nombre, last_name: u.apellido, email: u.correo, password_hash: u.password_hash,
      birth_date: u.fecha_nacimiento, role: u.rol || 'cliente',
      data_consent: u.consentimiento_datos ?? null, created_at: u.creado,
    });
  },
  async porCorreo(correo) {
    return planoId(await S.fila(`SELECT ${SEL_USUARIO} FROM user WHERE email = ${lit(correo)} LIMIT 1;`));
  },
  async porId(id) {
    return planoId(await S.fila(`SELECT ${SEL_USUARIO} FROM ${lit(rid('user', id))};`));
  },
  // Datos minimos para la sesion (sin password_hash)
  async paraSesion(id) {
    return planoId(await S.fila(`SELECT first_name AS nombre, last_name AS apellido, email AS correo, birth_date AS fecha_nacimiento, role AS rol, id FROM ${lit(rid('user', id))};`));
  },
  async existeCorreo(correo) {
    return (await S.filas(`SELECT id FROM user WHERE email = ${lit(correo)} LIMIT 1;`)).length > 0;
  },
  async actualizarPassword(id, hash) {
    await S.consulta(`UPDATE ${lit(rid('user', id))} SET password_hash = ${lit(hash)};`);
  },
  async contarAdmins() {
    return contar('user', `role = 'admin'`);
  },
  async eliminar(id) {
    const u = lit(rid('user', id));
    await S.consulta([
      'BEGIN TRANSACTION;',
      `DELETE report WHERE user = ${u} OR translated_message.conversation_language.conversation.user = ${u};`,
      `DELETE translated_message WHERE conversation_language.conversation.user = ${u};`,
      `DELETE original_message WHERE conversation_language.conversation.user = ${u};`,
      `DELETE conversation_language WHERE conversation.user = ${u};`,
      `DELETE conversation WHERE user = ${u};`,
      `DELETE password_reset WHERE user = ${u};`,
      `DELETE refresh_token WHERE user = ${u};`,
      `DELETE ${u};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
};

// --- tokens de refresco ---------------------------------------------------------------
const tokens = {
  async crear({ id, usuario_id, hash, expira }) {
    return crearRegistro('refresh_token', id, { user: rid('user', usuario_id), hash, expires_at: expira, revoked: false });
  },
  async porHash(hash) {
    const f = await S.fila(`SELECT revoked AS revocado, expires_at AS expira, meta::id(user) AS usuario_id, id FROM refresh_token WHERE hash = ${lit(hash)} LIMIT 1;`);
    return planoId(f);
  },
  // Revoca y devuelve el token en un solo paso: si dos pedidos usan el mismo token, solo uno lo obtiene.
  async consumir(hash, ahora) {
    try {
      const f = await S.fila(`UPDATE refresh_token SET revoked = true WHERE hash = ${lit(hash)} AND revoked = false AND expires_at >= ${lit(ahora)} RETURN BEFORE;`);
      return f ? { id: idPlano(f.id), usuario_id: idPlano(f.user) } : null;
    } catch (e) {
      if (/conflict|retry/i.test(e.message)) return null;
      throw e;
    }
  },
  async revocarHash(hash) {
    await S.consulta(`UPDATE refresh_token SET revoked = true WHERE hash = ${lit(hash)};`);
  },
  async revocarDeUsuario(usuario_id) {
    await S.consulta(`UPDATE refresh_token SET revoked = true WHERE user = ${lit(rid('user', usuario_id))};`);
  },
};

// --- sesiones revocadas (JWT jti) -----------------------------------------------------
const sesiones = {
  async agregar(jti, expira) {
    await S.consulta(`UPSERT ${lit(rid('revoked_session', jti))} SET jti = ${lit(jti)}, expires_at = ${lit(expira)};`);
  },
  async tiene(jti) {
    return (await S.filas(`SELECT id FROM ${lit(rid('revoked_session', jti))};`)).length > 0;
  },
  async limpiarExpiradas(nowSeg) {
    await S.consulta(`DELETE revoked_session WHERE expires_at < ${lit(nowSeg)};`);
  },
};

// --- recuperaciones -------------------------------------------------------------------
const recuperaciones = {
  async invalidarDeUsuario(usuario_id) {
    await S.consulta(`UPDATE password_reset SET used = true WHERE user = ${lit(rid('user', usuario_id))};`);
  },
  async crear({ id, usuario_id, codigo_hash, expira }) {
    return crearRegistro('password_reset', id, { user: rid('user', usuario_id), code_hash: codigo_hash, expires_at: expira, used: false });
  },
  async ultimaVigente(usuario_id) {
    return planoId(await S.fila(`SELECT code_hash AS codigo_hash, expires_at AS expira, used AS usado, id FROM password_reset WHERE user = ${lit(rid('user', usuario_id))} AND used = false ORDER BY expires_at DESC LIMIT 1;`));
  },
  async marcarUsada(id) {
    await S.consulta(`UPDATE ${lit(rid('password_reset', id))} SET used = true;`);
  },
};

// --- mapas de catalogo (tablas chicas) para resolver links en memoria -----------------
async function mapas() {
  const [paises, regiones, lenguajes, canales, entonaciones] = await Promise.all([
    S.filas('SELECT name AS nombre, code AS codigo, id FROM country;'),
    S.filas('SELECT name AS nombre, country AS pais, id FROM region;'),
    S.filas('SELECT name AS nombre, code AS codigo, active AS activo, id FROM language;'),
    S.filas('SELECT name AS nombre, id FROM channel;'),
    S.filas('SELECT name AS nombre, id FROM tone;'),
  ]);
  const pById = {}; for (const p of paises) pById[idPlano(p.id)] = { id: idPlano(p.id), nombre: p.nombre, codigo: p.codigo };
  const rById = {}; for (const r of regiones) rById[idPlano(r.id)] = { id: idPlano(r.id), nombre: r.nombre, pais_id: idPlano(r.pais) };
  const lById = {}; for (const l of lenguajes) lById[idPlano(l.id)] = { id: idPlano(l.id), nombre: l.nombre, codigo: l.codigo, activo: l.activo };
  const cById = {}; for (const c of canales) cById[idPlano(c.id)] = c.nombre;
  const eById = {}; for (const e of entonaciones) eById[idPlano(e.id)] = e.nombre;
  return { pById, rById, lById, cById, eById };
}

// --- catalogo (idiomas, regiones, paises, entonaciones, canales) ----------------------
const catalogo = {
  async obtener({ todos }) {
    const { pById, rById } = await mapas();
    const idiomas = (await S.filas(`SELECT name AS nombre, code AS codigo, active AS activo, id FROM language ${todos ? '' : 'WHERE active = true'} ORDER BY name;`)).map(planoId);
    const lr = await S.filas('SELECT language AS lenguaje, region FROM language_region;');
    const porLenguaje = {};
    for (const x of lr) {
      const lid = idPlano(x.lenguaje);
      const reg = rById[idPlano(x.region)];
      if (!reg) continue;
      (porLenguaje[lid] = porLenguaje[lid] || []).push({ id: reg.id, nombre: reg.nombre, pais: pById[reg.pais_id] || null });
    }
    for (const k of Object.keys(porLenguaje)) {
      porLenguaje[k].sort((a, b) => ((a.pais && a.pais.nombre) || '').localeCompare((b.pais && b.pais.nombre) || '') || a.nombre.localeCompare(b.nombre));
    }
    return {
      idiomas: idiomas.map((i) => ({ id: i.id, nombre: i.nombre, codigo: i.codigo, activo: !!i.activo, regiones: porLenguaje[i.id] || [] })),
      entonaciones: (await S.filas('SELECT name AS nombre, id FROM tone WHERE active = true ORDER BY name;')).map((e) => ({ id: idPlano(e.id), nombre: e.nombre })),
      canales: (await S.filas('SELECT name AS nombre, id FROM channel ORDER BY name;')).map((c) => ({ id: idPlano(c.id), nombre: c.nombre })),
    };
  },
  async lenguajePorId(id) {
    return planoId(await S.fila(`SELECT name AS nombre, code AS codigo, active AS activo, id FROM ${lit(rid('language', id))};`));
  },
  async lenguajePorCodigoActivo(codigo) {
    return planoId(await S.fila(`SELECT name AS nombre, code AS codigo, active AS activo, id FROM language WHERE code = ${lit(codigo)} AND active = true LIMIT 1;`));
  },
  async existeLenguaje(id) {
    return (await S.filas(`SELECT id FROM ${lit(rid('language', id))};`)).length > 0;
  },
  async crearLenguaje({ id, nombre, codigo, activo }) {
    return crearRegistro('language', id, { name: nombre, code: codigo, active: !!activo });
  },
  async existeLenguajeNombreOCodigo(nombre, codigo) {
    return (await S.filas(`SELECT id FROM language WHERE string::lowercase(name) = ${lit(String(nombre).toLowerCase())} OR code = ${lit(codigo)} LIMIT 1;`)).length > 0;
  },
  async existeOtroLenguajeConNombre(nombre, id) {
    return (await S.filas(`SELECT id FROM language WHERE string::lowercase(name) = ${lit(String(nombre).toLowerCase())} AND id != ${lit(rid('language', id))} LIMIT 1;`)).length > 0;
  },
  async renombrarLenguaje(id, nombre) {
    await S.consulta(`UPDATE ${lit(rid('language', id))} SET name = ${lit(nombre)};`);
  },
  async activarLenguaje(id, activo) {
    await S.consulta(`UPDATE ${lit(rid('language', id))} SET active = ${lit(!!activo)};`);
  },
  async addRegionLenguaje(lenguajeId, regionId) {
    const existe = (await S.filas(`SELECT id FROM language_region WHERE language = ${lit(rid('language', lenguajeId))} AND region = ${lit(rid('region', regionId))} LIMIT 1;`)).length > 0;
    if (!existe) await S.consulta(`CREATE language_region SET language = ${lit(rid('language', lenguajeId))}, region = ${lit(rid('region', regionId))};`);
  },
  async setRegionesLenguaje(lenguajeId, regionIds) {
    await S.consulta(`DELETE language_region WHERE language = ${lit(rid('language', lenguajeId))};`);
    for (const r of regionIds) await this.addRegionLenguaje(lenguajeId, r);
  },
  async regionValidaParaLenguaje(lenguajeId, regionId) {
    return (await S.filas(`SELECT id FROM language_region WHERE language = ${lit(rid('language', lenguajeId))} AND region = ${lit(rid('region', regionId))} LIMIT 1;`)).length > 0;
  },
  async regionPorId(id) {
    const { pById, lById } = await mapas();
    const r = planoId(await S.fila(`SELECT name AS nombre, country AS pais, id FROM ${lit(rid('region', id))};`));
    if (!r) return null;
    const idiomas = await S.filas(`SELECT language AS lenguaje FROM language_region WHERE region = ${lit(rid('region', id))};`);
    return {
      id: r.id, nombre: r.nombre, pais: pById[idPlano(r.pais)] || null,
      idiomas: idiomas.map((x) => lById[idPlano(x.lenguaje)]).filter(Boolean).map((l) => ({ id: l.id, nombre: l.nombre, codigo: l.codigo })),
    };
  },
  async existeRegion(id) {
    return (await S.filas(`SELECT id FROM ${lit(rid('region', id))};`)).length > 0;
  },
  async crearRegion({ id, nombre, pais_id }) {
    return crearRegistro('region', id, { name: nombre, country: rid('country', pais_id) });
  },
  async existeRegionEnPais(nombre, pais_id) {
    return (await S.filas(`SELECT id FROM region WHERE string::lowercase(name) = ${lit(String(nombre).toLowerCase())} AND country = ${lit(rid('country', pais_id))} LIMIT 1;`)).length > 0;
  },
  async paisPorNombre(nombre) {
    return planoId(await S.fila(`SELECT name AS nombre, code AS codigo, id FROM country WHERE string::lowercase(name) = ${lit(String(nombre).toLowerCase())} LIMIT 1;`));
  },
  async existePaisCodigo(codigo) {
    return (await S.filas(`SELECT id FROM country WHERE code = ${lit(codigo)} LIMIT 1;`)).length > 0;
  },
  async crearPais({ id, nombre, codigo }) {
    return crearRegistro('country', id, { name: nombre, code: codigo });
  },
  async entonacionesActivas() {
    return (await S.filas('SELECT name AS nombre, id FROM tone WHERE active = true;')).map((e) => ({ id: idPlano(e.id), nombre: e.nombre }));
  },
  async canalPorNombre(nombre) {
    return planoId(await S.fila(`SELECT id FROM channel WHERE name = ${lit(nombre)} LIMIT 1;`));
  },
  async regionIdPorNombrePaisLenguaje(region, pais, lenguajeId) {
    const f = await S.fila(`SELECT id FROM region WHERE name = ${lit(region)} AND country.name = ${lit(pais)} AND id IN (SELECT VALUE region FROM language_region WHERE language = ${lit(rid('language', lenguajeId))}) LIMIT 1;`);
    return f ? idPlano(f.id) : null;
  },
};

// --- conversaciones + conversation_language -------------------------------------------
const conversaciones = {
  async crearConfigurada({ convId, nombre, usuarioId, fecha, destino, origen }) {
    const stmts = ['BEGIN TRANSACTION;'];
    stmts.push(`CREATE ${lit(rid('conversation', convId))} SET name = ${lit(nombre)}, started_at = ${lit(fecha)}, user = ${lit(rid('user', usuarioId))};`);
    stmts.push(`CREATE ${lit(rid('conversation_language', destino.lpcId))} SET label = ${lit('LC1')}, conversation = ${lit(rid('conversation', convId))}, language = ${lit(rid('language', destino.lenguajeId))}, region = ${lit(destino.regionId ? rid('region', destino.regionId) : null)}, role = ${lit('destino')};`);
    if (origen) {
      stmts.push(`CREATE ${lit(rid('conversation_language', origen.lpcId))} SET label = ${lit('LC2')}, conversation = ${lit(rid('conversation', convId))}, language = ${lit(rid('language', origen.lenguajeId))}, region = NONE, role = ${lit('origen')};`);
    }
    stmts.push('COMMIT TRANSACTION;');
    await S.consulta(stmts.join('\n'));
  },
  async porId(id) {
    return planoId(await S.fila(`SELECT name AS nombre, started_at AS fecha_inicio, id FROM ${lit(rid('conversation', id))};`));
  },
  async delUsuario(id, usuarioId) {
    return planoId(await S.fila(`SELECT name AS nombre, started_at AS fecha_inicio, id FROM conversation WHERE id = ${lit(rid('conversation', id))} AND user = ${lit(rid('user', usuarioId))} LIMIT 1;`));
  },
  async listarDeUsuario(usuarioId) {
    return (await S.filas(`SELECT name AS nombre, started_at AS fecha_inicio, id FROM conversation WHERE user = ${lit(rid('user', usuarioId))} ORDER BY started_at DESC;`)).map(planoId);
  },
  async renombrar(id, nombre) {
    await S.consulta(`UPDATE ${lit(rid('conversation', id))} SET name = ${lit(nombre)};`);
  },
  async eliminar(id) {
    const c = lit(rid('conversation', id));
    await S.consulta([
      'BEGIN TRANSACTION;',
      `DELETE report WHERE translated_message.conversation_language.conversation = ${c};`,
      `DELETE translated_message WHERE conversation_language.conversation = ${c};`,
      `DELETE original_message WHERE conversation_language.conversation = ${c};`,
      `DELETE conversation_language WHERE conversation = ${c};`,
      `DELETE ${c};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
  async lpcDe(convId) {
    const { pById, rById, lById } = await mapas();
    const rows = await S.filas(`SELECT label AS nombre, role AS rol, language AS lenguaje, region, id FROM conversation_language WHERE conversation = ${lit(rid('conversation', convId))};`);
    return rows.map((x) => {
      const lenguaje_id = idPlano(x.lenguaje);
      const region_id = x.region ? idPlano(x.region) : null;
      const l = lById[lenguaje_id] || {};
      const r = region_id ? rById[region_id] : null;
      const p = r ? pById[r.pais_id] : null;
      return {
        id: idPlano(x.id), nombre: x.nombre, rol: x.rol, lenguaje_id, region_id,
        idioma_nombre: l.nombre, idioma_codigo: l.codigo,
        region_nombre: r ? r.nombre : null, pais_codigo: p ? p.codigo : null, pais_nombre: p ? p.nombre : null,
      };
    });
  },
  async contarLpc(convId) {
    return contar('conversation_language', `conversation = ${lit(rid('conversation', convId))}`);
  },
  async crearLpc({ id, nombre, convId, lenguajeId, regionId, rol }) {
    return crearRegistro('conversation_language', id, {
      label: nombre, conversation: rid('conversation', convId), language: rid('language', lenguajeId),
      region: regionId ? rid('region', regionId) : null, role: rol,
    });
  },
};

// --- mensajes (original + destino) ----------------------------------------------------
const mensajes = {
  async deConversacion(convId) {
    const { cById, eById } = await mapas();
    const c = lit(rid('conversation', convId));
    const originales = await S.filas(`SELECT content AS contenido, sender AS remitente, created_at AS fecha_creacion, channel AS canal, tone AS entonacion, id FROM original_message WHERE conversation_language.conversation = ${c} ORDER BY created_at;`);
    const destinos = await S.filas(`SELECT translated_content AS contenido_traducido, cultural_note AS nota_cultural, approximate AS aproximada, engine AS motor, delivery_status AS estado_entrega, original_message, id FROM translated_message WHERE conversation_language.conversation = ${c};`);
    const reportados = new Set((await S.filas(`SELECT translated_message FROM report WHERE translated_message.conversation_language.conversation = ${c};`)).map((x) => idPlano(x.translated_message)));
    const dPorOriginal = {};
    for (const d of destinos) dPorOriginal[idPlano(d.original_message)] = d;
    return originales.map((mo) => {
      const moId = idPlano(mo.id);
      const d = dPorOriginal[moId];
      return {
        id: moId, contenido: mo.contenido, remitente: mo.remitente, fecha_creacion: mo.fecha_creacion,
        canal: cById[idPlano(mo.canal)], tono: eById[idPlano(mo.entonacion)],
        destino_id: d ? idPlano(d.id) : null,
        contenido_traducido: d ? d.contenido_traducido : null,
        nota_cultural: d ? (d.nota_cultural ?? null) : null,
        aproximada: d ? d.aproximada : false,
        motor: d ? d.motor : null,
        estado_entrega: d ? d.estado_entrega : null,
        reportado: d ? reportados.has(idPlano(d.id)) : false,
      };
    });
  },
  async ultimo(convId) {
    const c = lit(rid('conversation', convId));
    const mo = await S.fila(`SELECT content AS contenido, created_at AS fecha_creacion, id FROM original_message WHERE conversation_language.conversation = ${c} ORDER BY created_at DESC LIMIT 1;`);
    if (!mo) return null;
    const d = await S.fila(`SELECT translated_content AS contenido_traducido FROM translated_message WHERE original_message = ${lit(rid('original_message', idPlano(mo.id)))} LIMIT 1;`);
    return { contenido: mo.contenido, contenido_traducido: d ? d.contenido_traducido : null, fecha_creacion: mo.fecha_creacion };
  },
  async contar(convId) {
    return contar('original_message', `conversation_language.conversation = ${lit(rid('conversation', convId))}`);
  },
  async crear({ origen, destino }) {
    await S.consulta([
      'BEGIN TRANSACTION;',
      `CREATE ${lit(rid('original_message', origen.id))} SET conversation_language = ${lit(rid('conversation_language', origen.lpcId))}, channel = ${lit(rid('channel', origen.canalId))}, tone = ${lit(rid('tone', origen.entonacionId))}, content = ${lit(origen.contenido)}, sender = ${lit(origen.remitente)}, created_at = ${lit(origen.fecha)};`,
      `CREATE ${lit(rid('translated_message', destino.id))} SET original_message = ${lit(rid('original_message', origen.id))}, conversation_language = ${lit(rid('conversation_language', destino.lpcId))}, translated_content = ${lit(destino.contenido_traducido)}, cultural_note = ${lit(destino.nota ?? null)}, approximate = ${lit(!!destino.aproximada)}, engine = ${lit(destino.motor)}, delivery_status = ${lit(destino.estado_entrega || 'Entregado')}, created_at = ${lit(destino.fecha)};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
};

// --- reportes -------------------------------------------------------------------------
function selectReporte(where) {
  return `SELECT reason AS motivo, suggestion AS sugerencia, status AS estado, admin_note AS nota_admin, created_at AS fecha,
    translated_message AS md_ref,
    translated_message.translated_content AS traduccion,
    translated_message.cultural_note AS nota_cultural,
    translated_message.engine AS motor,
    translated_message.original_message.content AS original,
    translated_message.original_message.conversation_language.language.code AS idioma_origen,
    translated_message.conversation_language.language.code AS idioma_destino,
    user.first_name AS u_nombre, user.last_name AS u_apellido, id
    FROM report ${where};`;
}
function mapReporte(f) {
  if (!f) return null;
  return {
    id: idPlano(f.id), motivo: f.motivo, sugerencia: f.sugerencia ?? null, estado: f.estado,
    nota_admin: f.nota_admin ?? null, fecha: f.fecha, mensaje_destino_id: idPlano(f.md_ref),
    original: f.original, traduccion: f.traduccion, nota_cultural: f.nota_cultural ?? null, motor: f.motor,
    idioma_origen: f.idioma_origen, idioma_destino: f.idioma_destino,
    reportado_por: `${f.u_nombre} ${f.u_apellido}`,
  };
}
const reportes = {
  async mensajeDestinoPropio(mdId, usuarioId) {
    const f = await S.fila(`SELECT id FROM translated_message WHERE id = ${lit(rid('translated_message', mdId))} AND original_message.conversation_language.conversation.user = ${lit(rid('user', usuarioId))} LIMIT 1;`);
    return f ? { id: idPlano(f.id) } : null;
  },
  async existe(mdId, usuarioId) {
    return (await S.filas(`SELECT id FROM report WHERE translated_message = ${lit(rid('translated_message', mdId))} AND user = ${lit(rid('user', usuarioId))} LIMIT 1;`)).length > 0;
  },
  async crear({ id, mdId, usuarioId, motivo, sugerencia, estado, fecha }) {
    return crearRegistro('report', id, {
      translated_message: rid('translated_message', mdId), user: rid('user', usuarioId),
      reason: motivo, suggestion: sugerencia ?? null, status: estado || 'abierto', created_at: fecha,
    });
  },
  async listar({ estado }) {
    const where = estado ? `WHERE status = ${lit(estado)}` : '';
    const filas = (await S.filas(selectReporte(where))).map(mapReporte);
    filas.sort((a, b) => (a.estado === 'abierto' ? 0 : 1) - (b.estado === 'abierto' ? 0 : 1) || String(b.fecha).localeCompare(String(a.fecha)));
    return filas;
  },
  async porId(id) {
    return mapReporte(await S.fila(selectReporte(`WHERE id = ${lit(rid('report', id))}`)));
  },
  async actualizar(id, estado, nota) {
    await S.consulta(`UPDATE ${lit(rid('report', id))} SET status = ${lit(estado)}, admin_note = ${lit(nota ?? null)};`);
  },
};

module.exports = function crearRepoSurreal() {
  return { inicializar, usuarios, tokens, sesiones, recuperaciones, catalogo, conversaciones, mensajes, reportes, _surreal: S };
};
