// Repositorio (adaptadores) sobre SurrealDB — fuente de verdad del backend.
// Expone la MISMA superficie que el repositorio SQLite (repos/sqlite.js) pero async,
// mapeando cada operacion del dominio a SurrealQL. Las rutas y lib/auth consumen esta
// interfaz sin conocer el motor.
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const S = require('../surreal');

const ESQUEMA = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'surreal', 'schema.surql'), 'utf8');

// Catalogo inicial (igual que el SQLite db.js). es/en activos; fr/pt inactivos.
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
function sets(campos) {
  return Object.entries(campos)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} = ${lit(v)}`)
    .join(', ');
}

// Convierte el id (record id serializado) de una fila a id de negocio.
function planoId(fila) {
  if (!fila) return fila;
  if (fila.id !== undefined) fila.id = idPlano(fila.id);
  return fila;
}

async function crearRegistro(tabla, id, campos) {
  const f = await S.fila(`CREATE ${lit(rid(tabla, id))} SET ${sets(campos)} RETURN AFTER;`);
  return planoId(f);
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
  const hayLenguajes = await contar('lenguaje');
  if (!hayLenguajes) {
    const paisId = {};
    const lenId = {};
    const stmts = ['BEGIN TRANSACTION;'];
    for (const [nombre, codigo] of PAISES) {
      const id = randomUUID();
      paisId[nombre] = id;
      stmts.push(`CREATE ${lit(rid('pais', id))} SET nombre = ${lit(nombre)}, codigo = ${lit(codigo)};`);
    }
    for (const [nombre, codigo, activo] of LENGUAJES) {
      const id = randomUUID();
      lenId[codigo] = id;
      stmts.push(`CREATE ${lit(rid('lenguaje', id))} SET nombre = ${lit(nombre)}, codigo = ${lit(codigo)}, activo = ${lit(activo)};`);
    }
    for (const [nombre, pais, langs] of REGIONES) {
      const id = randomUUID();
      stmts.push(`CREATE ${lit(rid('region', id))} SET nombre = ${lit(nombre)}, pais = ${lit(rid('pais', paisId[pais]))};`);
      for (const l of langs) {
        stmts.push(`CREATE lenguaje_region SET lenguaje = ${lit(rid('lenguaje', lenId[l]))}, region = ${lit(rid('region', id))};`);
      }
    }
    for (const n of ENTONACIONES) stmts.push(`CREATE ${lit(rid('entonacion', randomUUID()))} SET nombre = ${lit(n)}, activo = true;`);
    for (const n of CANALES) stmts.push(`CREATE ${lit(rid('canal', randomUUID()))} SET nombre = ${lit(n)};`);
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

// --- usuarios -------------------------------------------------------------------------
const usuarios = {
  async crear(u) {
    return crearRegistro('usuario', u.id, {
      nombre: u.nombre, apellido: u.apellido, correo: u.correo, password_hash: u.password_hash,
      fecha_nacimiento: u.fecha_nacimiento, rol: u.rol || 'cliente',
      consentimiento_datos: u.consentimiento_datos ?? null, creado: u.creado,
    });
  },
  async porCorreo(correo) {
    return planoId(await S.fila(`SELECT * FROM usuario WHERE correo = ${lit(correo)} LIMIT 1;`));
  },
  async porId(id) {
    return planoId(await S.fila(`SELECT * FROM ${lit(rid('usuario', id))};`));
  },
  // Datos minimos para la sesion (sin password_hash)
  async paraSesion(id) {
    return planoId(await S.fila(`SELECT id, nombre, apellido, correo, fecha_nacimiento, rol FROM ${lit(rid('usuario', id))};`));
  },
  async existeCorreo(correo) {
    return (await S.filas(`SELECT id FROM usuario WHERE correo = ${lit(correo)} LIMIT 1;`)).length > 0;
  },
  async actualizarPassword(id, hash) {
    await S.consulta(`UPDATE ${lit(rid('usuario', id))} SET password_hash = ${lit(hash)};`);
  },
  async contarAdmins() {
    return contar('usuario', `rol = 'admin'`);
  },
  async eliminar(id) {
    const u = lit(rid('usuario', id));
    await S.consulta([
      'BEGIN TRANSACTION;',
      `DELETE reporte WHERE usuario = ${u} OR mensaje_destino.lenguaje_conversacion.conversacion.usuario = ${u};`,
      `DELETE mensaje_destino WHERE lenguaje_conversacion.conversacion.usuario = ${u};`,
      `DELETE mensaje_original WHERE lenguaje_conversacion.conversacion.usuario = ${u};`,
      `DELETE lenguaje_por_conversacion WHERE conversacion.usuario = ${u};`,
      `DELETE conversacion WHERE usuario = ${u};`,
      `DELETE recuperacion WHERE usuario = ${u};`,
      `DELETE token_refresco WHERE usuario = ${u};`,
      `DELETE ${u};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
};

// --- tokens de refresco ---------------------------------------------------------------
const tokens = {
  async crear({ id, usuario_id, hash, expira }) {
    return crearRegistro('token_refresco', id, { usuario: rid('usuario', usuario_id), hash, expira, revocado: false });
  },
  async porHash(hash) {
    const f = await S.fila(`SELECT *, meta::id(usuario) AS usuario_id FROM token_refresco WHERE hash = ${lit(hash)} LIMIT 1;`);
    return planoId(f);
  },
  async revocarId(id) {
    await S.consulta(`UPDATE ${lit(rid('token_refresco', id))} SET revocado = true;`);
  },
  async revocarHash(hash) {
    await S.consulta(`UPDATE token_refresco SET revocado = true WHERE hash = ${lit(hash)};`);
  },
  async revocarDeUsuario(usuario_id) {
    await S.consulta(`UPDATE token_refresco SET revocado = true WHERE usuario = ${lit(rid('usuario', usuario_id))};`);
  },
};

// --- sesiones revocadas (JWT jti) -----------------------------------------------------
const sesiones = {
  async agregar(jti, expira) {
    // idempotente: id determinista por jti
    await S.consulta(`UPSERT ${lit(rid('sesion_revocada', jti))} SET jti = ${lit(jti)}, expira = ${lit(expira)};`);
  },
  async tiene(jti) {
    return (await S.filas(`SELECT id FROM ${lit(rid('sesion_revocada', jti))};`)).length > 0;
  },
  async limpiarExpiradas(nowSeg) {
    await S.consulta(`DELETE sesion_revocada WHERE expira < ${lit(nowSeg)};`);
  },
};

// --- recuperaciones -------------------------------------------------------------------
const recuperaciones = {
  async invalidarDeUsuario(usuario_id) {
    await S.consulta(`UPDATE recuperacion SET usado = true WHERE usuario = ${lit(rid('usuario', usuario_id))};`);
  },
  async crear({ id, usuario_id, codigo_hash, expira }) {
    return crearRegistro('recuperacion', id, { usuario: rid('usuario', usuario_id), codigo_hash, expira, usado: false });
  },
  async ultimaVigente(usuario_id) {
    return planoId(await S.fila(`SELECT * FROM recuperacion WHERE usuario = ${lit(rid('usuario', usuario_id))} AND usado = false ORDER BY expira DESC LIMIT 1;`));
  },
  async marcarUsada(id) {
    await S.consulta(`UPDATE ${lit(rid('recuperacion', id))} SET usado = true;`);
  },
};

// --- mapas de catalogo (tablas chicas) para resolver links en memoria -----------------
async function mapas() {
  const [paises, regiones, lenguajes, canales, entonaciones] = await Promise.all([
    S.filas('SELECT * FROM pais;'),
    S.filas('SELECT * FROM region;'),
    S.filas('SELECT * FROM lenguaje;'),
    S.filas('SELECT * FROM canal;'),
    S.filas('SELECT * FROM entonacion;'),
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
    const idiomas = (await S.filas(`SELECT * FROM lenguaje ${todos ? '' : 'WHERE activo = true'} ORDER BY nombre;`)).map(planoId);
    const lr = await S.filas('SELECT * FROM lenguaje_region;');
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
      entonaciones: (await S.filas('SELECT * FROM entonacion WHERE activo = true ORDER BY nombre;')).map((e) => ({ id: idPlano(e.id), nombre: e.nombre })),
      canales: (await S.filas('SELECT * FROM canal ORDER BY nombre;')).map((c) => ({ id: idPlano(c.id), nombre: c.nombre })),
    };
  },
  async lenguajePorId(id) {
    return planoId(await S.fila(`SELECT * FROM ${lit(rid('lenguaje', id))};`));
  },
  async lenguajePorCodigoActivo(codigo) {
    return planoId(await S.fila(`SELECT * FROM lenguaje WHERE codigo = ${lit(codigo)} AND activo = true LIMIT 1;`));
  },
  async existeLenguaje(id) {
    return (await S.filas(`SELECT id FROM ${lit(rid('lenguaje', id))};`)).length > 0;
  },
  async crearLenguaje({ id, nombre, codigo, activo }) {
    return crearRegistro('lenguaje', id, { nombre, codigo, activo: !!activo });
  },
  async existeLenguajeNombreOCodigo(nombre, codigo) {
    return (await S.filas(`SELECT id FROM lenguaje WHERE string::lowercase(nombre) = ${lit(String(nombre).toLowerCase())} OR codigo = ${lit(codigo)} LIMIT 1;`)).length > 0;
  },
  async existeOtroLenguajeConNombre(nombre, id) {
    return (await S.filas(`SELECT id FROM lenguaje WHERE string::lowercase(nombre) = ${lit(String(nombre).toLowerCase())} AND id != ${lit(rid('lenguaje', id))} LIMIT 1;`)).length > 0;
  },
  async renombrarLenguaje(id, nombre) {
    await S.consulta(`UPDATE ${lit(rid('lenguaje', id))} SET nombre = ${lit(nombre)};`);
  },
  async activarLenguaje(id, activo) {
    await S.consulta(`UPDATE ${lit(rid('lenguaje', id))} SET activo = ${lit(!!activo)};`);
  },
  async addRegionLenguaje(lenguajeId, regionId) {
    const existe = (await S.filas(`SELECT id FROM lenguaje_region WHERE lenguaje = ${lit(rid('lenguaje', lenguajeId))} AND region = ${lit(rid('region', regionId))} LIMIT 1;`)).length > 0;
    if (!existe) await S.consulta(`CREATE lenguaje_region SET lenguaje = ${lit(rid('lenguaje', lenguajeId))}, region = ${lit(rid('region', regionId))};`);
  },
  async setRegionesLenguaje(lenguajeId, regionIds) {
    await S.consulta(`DELETE lenguaje_region WHERE lenguaje = ${lit(rid('lenguaje', lenguajeId))};`);
    for (const r of regionIds) await this.addRegionLenguaje(lenguajeId, r);
  },
  async regionValidaParaLenguaje(lenguajeId, regionId) {
    return (await S.filas(`SELECT id FROM lenguaje_region WHERE lenguaje = ${lit(rid('lenguaje', lenguajeId))} AND region = ${lit(rid('region', regionId))} LIMIT 1;`)).length > 0;
  },
  async regionPorId(id) {
    const { pById } = await mapas();
    const r = planoId(await S.fila(`SELECT * FROM ${lit(rid('region', id))};`));
    if (!r) return null;
    const idiomas = (await S.filas(`SELECT lenguaje FROM lenguaje_region WHERE region = ${lit(rid('region', id))};`));
    const { lById } = await mapas();
    return {
      id: r.id, nombre: r.nombre, pais: pById[idPlano(r.pais)] || null,
      idiomas: idiomas.map((x) => lById[idPlano(x.lenguaje)]).filter(Boolean).map((l) => ({ id: l.id, nombre: l.nombre, codigo: l.codigo })),
    };
  },
  async existeRegion(id) {
    return (await S.filas(`SELECT id FROM ${lit(rid('region', id))};`)).length > 0;
  },
  async crearRegion({ id, nombre, pais_id }) {
    return crearRegistro('region', id, { nombre, pais: rid('pais', pais_id) });
  },
  async existeRegionEnPais(nombre, pais_id) {
    return (await S.filas(`SELECT id FROM region WHERE string::lowercase(nombre) = ${lit(String(nombre).toLowerCase())} AND pais = ${lit(rid('pais', pais_id))} LIMIT 1;`)).length > 0;
  },
  async paisPorNombre(nombre) {
    return planoId(await S.fila(`SELECT * FROM pais WHERE string::lowercase(nombre) = ${lit(String(nombre).toLowerCase())} LIMIT 1;`));
  },
  async existePaisCodigo(codigo) {
    return (await S.filas(`SELECT id FROM pais WHERE codigo = ${lit(codigo)} LIMIT 1;`)).length > 0;
  },
  async crearPais({ id, nombre, codigo }) {
    return crearRegistro('pais', id, { nombre, codigo });
  },
  async entonacionesActivas() {
    return (await S.filas('SELECT * FROM entonacion WHERE activo = true;')).map((e) => ({ id: idPlano(e.id), nombre: e.nombre }));
  },
  async canalPorNombre(nombre) {
    return planoId(await S.fila(`SELECT id FROM canal WHERE nombre = ${lit(nombre)} LIMIT 1;`));
  },
  async regionIdPorNombrePaisLenguaje(region, pais, lenguajeId) {
    const f = await S.fila(`SELECT id FROM region WHERE nombre = ${lit(region)} AND pais.nombre = ${lit(pais)} AND id IN (SELECT VALUE region FROM lenguaje_region WHERE lenguaje = ${lit(rid('lenguaje', lenguajeId))}) LIMIT 1;`);
    return f ? idPlano(f.id) : null;
  },
};

// --- conversaciones + lenguaje_por_conversacion ---------------------------------------
const conversaciones = {
  async crearConfigurada({ convId, nombre, usuarioId, fecha, destino, origen }) {
    const stmts = ['BEGIN TRANSACTION;'];
    stmts.push(`CREATE ${lit(rid('conversacion', convId))} SET nombre = ${lit(nombre)}, fecha_inicio = ${lit(fecha)}, usuario = ${lit(rid('usuario', usuarioId))};`);
    stmts.push(`CREATE ${lit(rid('lenguaje_por_conversacion', destino.lpcId))} SET nombre = ${lit('LC1')}, conversacion = ${lit(rid('conversacion', convId))}, lenguaje = ${lit(rid('lenguaje', destino.lenguajeId))}, region = ${lit(destino.regionId ? rid('region', destino.regionId) : null)}, rol = ${lit('destino')};`);
    if (origen) {
      stmts.push(`CREATE ${lit(rid('lenguaje_por_conversacion', origen.lpcId))} SET nombre = ${lit('LC2')}, conversacion = ${lit(rid('conversacion', convId))}, lenguaje = ${lit(rid('lenguaje', origen.lenguajeId))}, region = NONE, rol = ${lit('origen')};`);
    }
    stmts.push('COMMIT TRANSACTION;');
    await S.consulta(stmts.join('\n'));
  },
  async porId(id) {
    return planoId(await S.fila(`SELECT * FROM ${lit(rid('conversacion', id))};`));
  },
  async delUsuario(id, usuarioId) {
    return planoId(await S.fila(`SELECT * FROM conversacion WHERE id = ${lit(rid('conversacion', id))} AND usuario = ${lit(rid('usuario', usuarioId))} LIMIT 1;`));
  },
  async listarDeUsuario(usuarioId) {
    return (await S.filas(`SELECT * FROM conversacion WHERE usuario = ${lit(rid('usuario', usuarioId))} ORDER BY fecha_inicio DESC;`)).map(planoId);
  },
  async renombrar(id, nombre) {
    await S.consulta(`UPDATE ${lit(rid('conversacion', id))} SET nombre = ${lit(nombre)};`);
  },
  async eliminar(id) {
    const c = lit(rid('conversacion', id));
    await S.consulta([
      'BEGIN TRANSACTION;',
      `DELETE reporte WHERE mensaje_destino.lenguaje_conversacion.conversacion = ${c};`,
      `DELETE mensaje_destino WHERE lenguaje_conversacion.conversacion = ${c};`,
      `DELETE mensaje_original WHERE lenguaje_conversacion.conversacion = ${c};`,
      `DELETE lenguaje_por_conversacion WHERE conversacion = ${c};`,
      `DELETE ${c};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
  async lpcDe(convId) {
    const { pById, rById, lById } = await mapas();
    const rows = await S.filas(`SELECT * FROM lenguaje_por_conversacion WHERE conversacion = ${lit(rid('conversacion', convId))};`);
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
    return contar('lenguaje_por_conversacion', `conversacion = ${lit(rid('conversacion', convId))}`);
  },
  async crearLpc({ id, nombre, convId, lenguajeId, regionId, rol }) {
    return crearRegistro('lenguaje_por_conversacion', id, {
      nombre, conversacion: rid('conversacion', convId), lenguaje: rid('lenguaje', lenguajeId),
      region: regionId ? rid('region', regionId) : null, rol,
    });
  },
};

// --- mensajes (original + destino) ----------------------------------------------------
const mensajes = {
  async deConversacion(convId) {
    const { cById, eById } = await mapas();
    const c = lit(rid('conversacion', convId));
    const originales = await S.filas(`SELECT * FROM mensaje_original WHERE lenguaje_conversacion.conversacion = ${c} ORDER BY fecha_creacion;`);
    const destinos = await S.filas(`SELECT * FROM mensaje_destino WHERE lenguaje_conversacion.conversacion = ${c};`);
    const reportados = new Set((await S.filas(`SELECT mensaje_destino FROM reporte WHERE mensaje_destino.lenguaje_conversacion.conversacion = ${c};`)).map((x) => idPlano(x.mensaje_destino)));
    const dPorOriginal = {};
    for (const d of destinos) dPorOriginal[idPlano(d.mensaje_original)] = d;
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
    const c = lit(rid('conversacion', convId));
    const mo = await S.fila(`SELECT * FROM mensaje_original WHERE lenguaje_conversacion.conversacion = ${c} ORDER BY fecha_creacion DESC LIMIT 1;`);
    if (!mo) return null;
    const d = await S.fila(`SELECT * FROM mensaje_destino WHERE mensaje_original = ${lit(rid('mensaje_original', idPlano(mo.id)))} LIMIT 1;`);
    return { contenido: mo.contenido, contenido_traducido: d ? d.contenido_traducido : null, fecha_creacion: mo.fecha_creacion };
  },
  async contar(convId) {
    return contar('mensaje_original', `lenguaje_conversacion.conversacion = ${lit(rid('conversacion', convId))}`);
  },
  async crear({ origen, destino }) {
    await S.consulta([
      'BEGIN TRANSACTION;',
      `CREATE ${lit(rid('mensaje_original', origen.id))} SET lenguaje_conversacion = ${lit(rid('lenguaje_por_conversacion', origen.lpcId))}, canal = ${lit(rid('canal', origen.canalId))}, entonacion = ${lit(rid('entonacion', origen.entonacionId))}, contenido = ${lit(origen.contenido)}, remitente = ${lit(origen.remitente)}, fecha_creacion = ${lit(origen.fecha)};`,
      `CREATE ${lit(rid('mensaje_destino', destino.id))} SET mensaje_original = ${lit(rid('mensaje_original', origen.id))}, lenguaje_conversacion = ${lit(rid('lenguaje_por_conversacion', destino.lpcId))}, contenido_traducido = ${lit(destino.contenido_traducido)}, nota_cultural = ${lit(destino.nota ?? null)}, aproximada = ${lit(!!destino.aproximada)}, motor = ${lit(destino.motor)}, estado_entrega = ${lit(destino.estado_entrega || 'Entregado')}, fecha_creacion = ${lit(destino.fecha)};`,
      'COMMIT TRANSACTION;',
    ].join('\n'));
  },
};

// --- reportes -------------------------------------------------------------------------
function selectReporte(where) {
  return `SELECT id, motivo, sugerencia, estado, nota_admin, fecha,
    mensaje_destino AS md_ref,
    mensaje_destino.contenido_traducido AS traduccion,
    mensaje_destino.nota_cultural AS nota_cultural,
    mensaje_destino.motor AS motor,
    mensaje_destino.mensaje_original.contenido AS original,
    mensaje_destino.mensaje_original.lenguaje_conversacion.lenguaje.codigo AS idioma_origen,
    mensaje_destino.lenguaje_conversacion.lenguaje.codigo AS idioma_destino,
    usuario.nombre AS u_nombre, usuario.apellido AS u_apellido
    FROM reporte ${where};`;
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
    const f = await S.fila(`SELECT id FROM mensaje_destino WHERE id = ${lit(rid('mensaje_destino', mdId))} AND mensaje_original.lenguaje_conversacion.conversacion.usuario = ${lit(rid('usuario', usuarioId))} LIMIT 1;`);
    return f ? { id: idPlano(f.id) } : null;
  },
  async existe(mdId, usuarioId) {
    return (await S.filas(`SELECT id FROM reporte WHERE mensaje_destino = ${lit(rid('mensaje_destino', mdId))} AND usuario = ${lit(rid('usuario', usuarioId))} LIMIT 1;`)).length > 0;
  },
  async crear({ id, mdId, usuarioId, motivo, sugerencia, estado, fecha }) {
    return crearRegistro('reporte', id, {
      mensaje_destino: rid('mensaje_destino', mdId), usuario: rid('usuario', usuarioId),
      motivo, sugerencia: sugerencia ?? null, estado: estado || 'abierto', fecha,
    });
  },
  async listar({ estado }) {
    const where = estado ? `WHERE estado = ${lit(estado)}` : '';
    const filas = (await S.filas(selectReporte(where))).map(mapReporte);
    filas.sort((a, b) => (a.estado === 'abierto' ? 0 : 1) - (b.estado === 'abierto' ? 0 : 1) || String(b.fecha).localeCompare(String(a.fecha)));
    return filas;
  },
  async porId(id) {
    return mapReporte(await S.fila(selectReporte(`WHERE id = ${lit(rid('reporte', id))}`)));
  },
  async actualizar(id, estado, nota) {
    await S.consulta(`UPDATE ${lit(rid('reporte', id))} SET estado = ${lit(estado)}, nota_admin = ${lit(nota ?? null)};`);
  },
};

module.exports = function crearRepoSurreal() {
  return { inicializar, usuarios, tokens, sesiones, recuperaciones, catalogo, conversaciones, mensajes, reportes, _surreal: S };
};
