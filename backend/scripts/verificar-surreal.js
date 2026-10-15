// Verificacion en vivo del repositorio SurrealDB contra la instancia corriendo.
// Uso: node scripts/verificar-surreal.js   (respeta SURREAL_* del entorno)
// No es parte del runtime; es una prueba de humo de los adaptadores.
process.env.TALKLATE_LOGS = process.env.TALKLATE_LOGS || 'silencio';
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const repo = require('../src/repos/surreal')();

let pasos = 0;
async function paso(nombre, fn) {
  await fn();
  pasos += 1;
  console.log(`  OK  ${nombre}`);
}

async function main() {
  console.log('Inicializando esquema + semilla en SurrealDB...');
  await repo.inicializar();

  await paso('admin sembrado y consultable', async () => {
    const admin = await repo.usuarios.porCorreo((process.env.ADMIN_CORREO || 'dafa123.daf@gmail.com').toLowerCase());
    assert.ok(admin, 'admin no encontrado');
    assert.equal(admin.rol, 'admin');
    assert.ok(typeof admin.id === 'string' && !admin.id.includes(':'), `id no plano: ${admin.id}`);
  });

  await paso('contarAdmins >= 1', async () => {
    assert.ok((await repo.usuarios.contarAdmins()) >= 1);
  });

  const correo = `verif_${Date.now()}@correo.com`;
  const uid = randomUUID();
  await paso('crear usuario', async () => {
    const u = await repo.usuarios.crear({
      id: uid, nombre: 'Verif', apellido: 'Temp', correo,
      password_hash: 'hash-1', fecha_nacimiento: '2000-01-01', rol: 'cliente',
      consentimiento_datos: new Date().toISOString(), creado: new Date().toISOString(),
    });
    assert.equal(u.id, uid);
  });

  await paso('porCorreo / porId / paraSesion', async () => {
    assert.equal((await repo.usuarios.porCorreo(correo)).id, uid);
    assert.equal((await repo.usuarios.porId(uid)).correo, correo);
    const sesion = await repo.usuarios.paraSesion(uid);
    assert.equal(sesion.id, uid);
    assert.equal(sesion.password_hash, undefined, 'paraSesion no debe traer password_hash');
  });

  await paso('existeCorreo / actualizarPassword', async () => {
    assert.equal(await repo.usuarios.existeCorreo(correo), true);
    assert.equal(await repo.usuarios.existeCorreo('nadie_' + correo), false);
    await repo.usuarios.actualizarPassword(uid, 'hash-2');
    assert.equal((await repo.usuarios.porId(uid)).password_hash, 'hash-2');
  });

  const hashTok = 'tok-' + randomUUID();
  await paso('tokens / sesiones / recuperaciones', async () => {
    await repo.tokens.crear({ id: randomUUID(), usuario_id: uid, hash: hashTok, expira: Date.now() + 100000 });
    assert.equal((await repo.tokens.porHash(hashTok)).usuario_id, uid);
    const consumos = await Promise.all([repo.tokens.consumir(hashTok, Date.now()), repo.tokens.consumir(hashTok, Date.now())]);
    assert.equal(consumos.filter(Boolean).length, 1); // un token de refresco solo se usa una vez
    assert.equal(consumos.find(Boolean).usuario_id, uid);
    await repo.tokens.revocarHash(hashTok);
    assert.equal((await repo.tokens.porHash(hashTok)).revocado, true);
    const jti = 'jti-' + randomUUID();
    await repo.sesiones.agregar(jti, Math.floor(Date.now() / 1000) + 100);
    assert.equal(await repo.sesiones.tiene(jti), true);
    const recId = randomUUID();
    await repo.recuperaciones.crear({ id: recId, usuario_id: uid, codigo_hash: 'cod', expira: Date.now() + 100000 });
    assert.equal((await repo.recuperaciones.ultimaVigente(uid)).id, recId);
    await repo.recuperaciones.marcarUsada(recId);
    assert.equal(await repo.recuperaciones.ultimaVigente(uid), null);
  });

  // --- catalogo -----------------------------------------------------------------------
  let esId, enId, antioquiaId, canalTextoId, entonacionId;
  await paso('catalogo: idiomas activos con regiones, entonaciones, canales', async () => {
    const cat = await repo.catalogo.obtener({ todos: false });
    const es = cat.idiomas.find((i) => i.codigo === 'es');
    const en = cat.idiomas.find((i) => i.codigo === 'en');
    assert.ok(es && en, 'faltan es/en activos');
    assert.ok(es.activo === true && en.activo === true);
    const antioquia = es.regiones.find((r) => r.nombre === 'Antioquia');
    assert.ok(antioquia, 'Antioquia no asociada a es');
    assert.ok(antioquia.pais && antioquia.pais.codigo === 'CO');
    assert.ok(cat.entonaciones.length >= 4 && cat.canales.length === 2);
    esId = es.id; enId = en.id; antioquiaId = antioquia.id;
    canalTextoId = (await repo.catalogo.canalPorNombre('Texto')).id;
    entonacionId = (await repo.catalogo.entonacionesActivas())[0].id;
  });

  await paso('catalogo: validaciones de region/lenguaje', async () => {
    assert.equal(await repo.catalogo.regionValidaParaLenguaje(esId, antioquiaId), true);
    assert.equal(await repo.catalogo.regionIdPorNombrePaisLenguaje('Antioquia', 'Colombia', esId), antioquiaId);
    assert.equal((await repo.catalogo.lenguajePorCodigoActivo('es')).id, esId);
  });

  // --- conversacion + lpc -------------------------------------------------------------
  const convId = randomUUID();
  const lpcDestinoId = randomUUID();
  const lpcOrigenId = randomUUID();
  await paso('crear conversacion configurada + lpc', async () => {
    await repo.conversaciones.crearConfigurada({
      convId, nombre: 'Conversacion de prueba', usuarioId: uid, fecha: new Date().toISOString(),
      destino: { lpcId: lpcDestinoId, lenguajeId: esId, regionId: antioquiaId }, origen: null,
    });
    assert.ok(await repo.conversaciones.delUsuario(convId, uid), 'no pertenece al usuario');
    assert.equal(await repo.conversaciones.contarLpc(convId), 1);
    await repo.conversaciones.crearLpc({ id: lpcOrigenId, nombre: 'LC2', convId, lenguajeId: enId, regionId: null, rol: 'origen' });
    const lpcs = await repo.conversaciones.lpcDe(convId);
    assert.equal(lpcs.length, 2);
    const destino = lpcs.find((x) => x.rol === 'destino');
    assert.equal(destino.idioma_codigo, 'es');
    assert.equal(destino.region_nombre, 'Antioquia');
    assert.equal(destino.pais_codigo, 'CO');
  });

  // --- mensaje (original + destino) ---------------------------------------------------
  const moId = randomUUID();
  const mdId = randomUUID();
  await paso('crear mensaje (original + traduccion) y leerlo', async () => {
    await repo.mensajes.crear({
      origen: { id: moId, lpcId: lpcOrigenId, canalId: canalTextoId, entonacionId, contenido: 'enc:hola', remitente: 'usuario', fecha: new Date().toISOString() },
      destino: { id: mdId, lpcId: lpcDestinoId, contenido_traducido: 'enc:hola-es', nota: 'modismo', aproximada: false, motor: 'local', estado_entrega: 'Entregado', fecha: new Date().toISOString() },
    });
    assert.equal(await repo.mensajes.contar(convId), 1);
    const msgs = await repo.mensajes.deConversacion(convId);
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].id, moId);
    assert.equal(msgs[0].canal, 'Texto');
    assert.ok(msgs[0].traduccion ?? msgs[0].contenido_traducido, 'sin traduccion');
    assert.equal(msgs[0].destino_id, mdId);
    assert.equal(msgs[0].reportado, false);
    assert.ok((await repo.mensajes.ultimo(convId)).contenido_traducido);
  });

  // --- reportes -----------------------------------------------------------------------
  await paso('reportes: crear, consultar join, actualizar', async () => {
    assert.ok(await repo.reportes.mensajeDestinoPropio(mdId, uid), 'md no es del usuario');
    assert.equal(await repo.reportes.existe(mdId, uid), false);
    const repId = randomUUID();
    await repo.reportes.crear({ id: repId, mdId, usuarioId: uid, motivo: 'mala traduccion', sugerencia: 'otra', estado: 'abierto', fecha: new Date().toISOString() });
    assert.equal(await repo.reportes.existe(mdId, uid), true);
    const detalle = await repo.reportes.porId(repId);
    assert.equal(detalle.idioma_origen, 'en');
    assert.equal(detalle.idioma_destino, 'es');
    assert.equal(detalle.reportado_por, 'Verif Temp');
    assert.ok((await repo.reportes.listar({})).some((x) => x.id === repId));
    await repo.reportes.actualizar(repId, 'revisado', 'ok');
    assert.equal((await repo.reportes.porId(repId)).estado, 'revisado');
    // ahora el mensaje debe figurar como reportado
    assert.equal((await repo.mensajes.deConversacion(convId))[0].reportado, true);
  });

  await paso('eliminar usuario en cascada (conversacion, mensajes, reportes)', async () => {
    await repo.usuarios.eliminar(uid);
    assert.equal(await repo.usuarios.porId(uid), null);
    assert.equal(await repo.conversaciones.porId(convId), null);
    assert.equal(await repo.mensajes.contar(convId), 0);
    assert.equal(await repo.tokens.porHash(hashTok), null);
  });

  console.log(`\nTODO OK — ${pasos} pasos verificados contra SurrealDB.`);
}

main().catch((e) => { console.error('\nFALLO:', e.message, '\n', e.stack); process.exit(1); });
