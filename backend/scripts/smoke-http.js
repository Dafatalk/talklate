// Smoke test HTTP contra un backend corriendo (DB_DRIVER=surreal).
// Uso: BASE=http://127.0.0.1:3100 node scripts/smoke-http.js
const assert = require('node:assert/strict');
const raiz = process.env.BASE || 'http://127.0.0.1:3100';
const base = `${raiz}/api/v1`;

async function api(metodo, ruta, cuerpo, token) {
  const resp = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await resp.text();
  return { estado: resp.status, datos: texto ? JSON.parse(texto) : null };
}

async function main() {
  const salud = await (await fetch(`${raiz}/health`)).json();
  assert.equal(salud.ok, true);
  assert.equal(salud.db.ok, true, 'health.db.ok debe ser true (SurrealDB)');
  console.log(`  OK  /health -> db ${JSON.stringify(salud.db)}`);

  const correo = `smoke_${Date.now()}@correo.com`;
  const reg = await api('POST', '/auth/registro', { nombre: 'Smoke', apellido: 'Test', correo, password: 'Clave123!', fecha_nacimiento: '2000-01-01', acepta_tratamiento_datos: true });
  assert.equal(reg.estado, 201, `registro fallo: ${JSON.stringify(reg.datos)}`);
  const token = reg.datos.token;
  assert.ok(token);
  console.log('  OK  registro + sesion');

  const login = await api('POST', '/auth/login', { correo, password: 'Clave123!' });
  assert.equal(login.estado, 200);
  console.log('  OK  login');

  const cat = await api('GET', '/catalogo', null, token);
  assert.equal(cat.estado, 200);
  const es = cat.datos.idiomas.find((i) => i.codigo === 'es');
  assert.ok(es && es.regiones.length, 'catalogo sin es/regiones');
  console.log(`  OK  catalogo (${cat.datos.idiomas.length} idiomas, ${cat.datos.canales.length} canales)`);

  const conv = await api('POST', '/conversaciones', { nombre: 'Prueba Surreal', idioma_destino_id: es.id, region_destino_id: es.regiones[0].id }, token);
  assert.equal(conv.estado, 201, `crear conversacion fallo: ${JSON.stringify(conv.datos)}`);
  const convId = conv.datos.id;
  console.log('  OK  crear conversacion');

  const msg = await api('POST', `/conversaciones/${convId}/mensajes`, { contenido: 'Hello, how are you?', canal: 'texto' }, token);
  assert.equal(msg.estado, 201, `mensaje fallo: ${JSON.stringify(msg.datos)}`);
  assert.ok(msg.datos.mensaje.traduccion.contenido, 'sin traduccion');
  console.log(`  OK  mensaje traducido -> "${msg.datos.mensaje.traduccion.contenido}" (motor ${msg.datos.mensaje.traduccion.motor})`);

  const hist = await api('GET', '/conversaciones', null, token);
  assert.equal(hist.estado, 200);
  assert.ok(hist.datos.data.some((c) => c.id === convId));
  console.log(`  OK  historial (${hist.datos.pagination.total} conversaciones)`);

  // limpieza: borrar la cuenta de prueba (cascada)
  const del = await api('DELETE', '/usuarios/yo', { password: 'Clave123!' }, token);
  assert.equal(del.estado, 204);
  console.log('  OK  borrar cuenta de prueba (cascada)');

  console.log('\nSMOKE HTTP OK — el backend sirve desde SurrealDB.');
}

main().catch((e) => { console.error('\nFALLO:', e.message); process.exit(1); });
