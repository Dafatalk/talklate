// Prueba de punta a punta (punta de la piramide): levanta el servidor REAL como proceso aparte
// (`node src/server.js`, con SQLite en un archivo temporal) y recorre la app por HTTP como lo haria el
// celular: registro, conversacion, mensaje escrito, mensaje hablado, voz natural, reporte y borrado de
// la cuenta. Los servicios de IA externos (Whisper y el motor de voz) se reemplazan por servidores HTTP
// falsos que hablan su mismo protocolo, asi que tambien se prueban los adaptadores reales de verdad.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const raizBackend = path.join(__dirname, '..', '..');
let servidor, whisper, vozFalsa, carpeta, base, raiz;
const pedidosVoz = [];

function escuchar(manejador) {
  return new Promise((resolver) => {
    const s = http.createServer(manejador).listen(0, '127.0.0.1', () => resolver(s));
  });
}
const puerto = (s) => s.address().port;

async function puertoLibre() {
  const s = await escuchar(() => {});
  const p = puerto(s);
  await new Promise((r) => s.close(r));
  return p;
}

test.before(async () => {
  // Whisper falso (API compatible con OpenAI): siempre "escucha" la misma frase
  whisper = await escuchar((req, res) => {
    req.resume();
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ text: 'Que mas parce, estoy muy feliz de verte' }));
    });
  });
  // Motor de voz falso (API compatible con OpenAI): guarda lo que le piden y devuelve audio
  vozFalsa = await escuchar((req, res) => {
    let cuerpo = '';
    req.on('data', (d) => { cuerpo += d; });
    req.on('end', () => {
      pedidosVoz.push({ ruta: req.url, cuerpo });
      res.writeHead(200, { 'content-type': 'audio/wav' });
      res.end(Buffer.from('RIFF-falso'));
    });
  });

  carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'talklate-e2e-'));
  const p = await puertoLibre();
  raiz = `http://127.0.0.1:${p}`;
  base = `${raiz}/api/v1`;
  servidor = spawn(process.execPath, ['src/server.js'], {
    cwd: raizBackend,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      PATH: process.env.PATH,
      PORT: String(p),
      DB_DRIVER: 'sqlite',
      TALKLATE_DB: path.join(carpeta, 'e2e.db'),
      JWT_SECRET: 'secreto-e2e',
      TRADUCTOR: 'local',
      TALKLATE_LOGS: 'silencio',
      CORREO_MODO: 'consola',
      TRANSCRIPCION_URL: `http://127.0.0.1:${puerto(whisper)}/v1/audio/transcriptions`,
      VOZ_MOTOR: 'openai',
      VOZ_URL: `http://127.0.0.1:${puerto(vozFalsa)}/v1/audio/speech`,
    },
  });
  let salida = '';
  servidor.stdout.on('data', (d) => { salida += d; });
  servidor.stderr.on('data', (d) => { salida += d; });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${raiz}/health`)).ok) return; } catch { /* aun arrancando */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`El servidor no arranco:\n${salida}`);
});

test.after(async () => {
  if (servidor) servidor.kill();
  await Promise.all([whisper, vozFalsa].filter(Boolean).map((s) => new Promise((r) => s.close(r))));
  if (carpeta) fs.rmSync(carpeta, { recursive: true, force: true });
});

async function api(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  return { estado: r.status, datos: texto ? JSON.parse(texto) : null };
}

test('recorrido completo: registro, conversar por texto y por voz, escuchar, reportar y borrar la cuenta', async () => {
  // 1. El servidor esta sano y reporta los motores de voz configurados
  const salud = await (await fetch(`${raiz}/health`)).json();
  assert.equal(salud.ok, true);
  assert.equal(salud.transcripcion_voz, true);
  assert.deepEqual(salud.voz_natural, ['openai']);

  // 2. Registro con consentimiento de datos (Ley 1581)
  const correo = `e2e_${Date.now()}@correo.com`;
  const reg = await api('POST', '/auth/registro', { nombre: 'Ana', apellido: 'Prueba', correo, password: 'Clave123!', fecha_nacimiento: '2000-01-01', acepta_tratamiento_datos: true });
  assert.equal(reg.estado, 201, JSON.stringify(reg.datos));
  const token = reg.datos.token;

  // 3. Elige idioma y region destino y crea la conversacion
  const catalogo = (await api('GET', '/catalogo', null, token)).datos;
  const ingles = catalogo.idiomas.find((i) => i.codigo === 'en');
  const ny = ingles.regiones.find((r) => r.nombre === 'New York');
  const conv = await api('POST', '/conversaciones', { idioma_destino_id: ingles.id, region_destino_id: ny.id }, token);
  assert.equal(conv.estado, 201);
  const id = conv.datos.id;

  // 4. Mensaje escrito: se reconoce el idioma, se adapta el modismo y se entrega por texto
  const texto = await api('POST', `/conversaciones/${id}/mensajes`, { contenido: 'Hay que ponerse las pilas con el trabajo', canal: 'texto' }, token);
  assert.equal(texto.estado, 201);
  assert.equal(texto.datos.mensaje.traduccion.contenido, 'We need to get cracking on the work');
  assert.equal(texto.datos.configuracion.origen.codigo, 'es');
  assert.equal(texto.datos.entrega.reproducir_audio, false);

  // 5. Mensaje hablado: el audio pasa por el Whisper (falso) y la voz alegre define el tono
  const alegre = { duracion_ms: 2500, volumen_promedio_db: -14, volumen_max_db: -4, variacion_db: 11 };
  const voz = await api('POST', `/conversaciones/${id}/mensajes/voz`, { audio_base64: Buffer.from('audio').toString('base64'), tipo: 'audio/m4a', prosodia: alegre }, token);
  assert.equal(voz.estado, 201, JSON.stringify(voz.datos));
  assert.equal(voz.datos.transcripcion, 'Que mas parce, estoy muy feliz de verte');
  assert.equal(voz.datos.mensaje.canal, 'Voz');
  assert.equal(voz.datos.entrega.reproducir_audio, true);

  // 6. La traduccion se escucha con voz natural: el motor de voz recibe la instruccion de emocion del tono
  const sint = await api('POST', '/voz', { texto: voz.datos.mensaje.traduccion.contenido, idioma: 'en', pais: 'Estados Unidos', tono: voz.datos.mensaje.tono, ritmo: voz.datos.entrega.ritmo_voz }, token);
  assert.equal(sint.estado, 201, JSON.stringify(sint.datos));
  assert.equal(sint.datos.motor, 'openai');
  assert.equal(pedidosVoz.at(-1).ruta, '/v1/audio/speech');
  assert.match(pedidosVoz.at(-1).cuerpo, /instructions/);
  const audio = await fetch(raiz + sint.datos.url);
  assert.equal(audio.status, 200);
  assert.equal(audio.headers.get('content-type'), 'audio/mpeg');

  // 7. Historial: la conversacion tiene sus dos mensajes en orden
  const abierta = await api('GET', `/conversaciones/${id}`, null, token);
  assert.equal(abierta.datos.mensajes.length, 2);

  // 8. Reporta una mala traduccion
  const rep = await api('POST', '/reportes', { mensaje_destino_id: abierta.datos.mensajes[0].traduccion.id, motivo: 'Suena muy formal' }, token);
  assert.equal(rep.estado, 201);

  // 9. Borra la cuenta: despues no puede volver a entrar (derecho al olvido)
  assert.equal((await api('DELETE', '/usuarios/yo', { password: 'Clave123!' }, token)).estado, 204);
  assert.equal((await api('POST', '/auth/login', { correo, password: 'Clave123!' })).estado, 401);
});

test('un visitante sin sesion no puede usar la API y recibe el error de la convencion', async () => {
  const r = await api('GET', '/conversaciones');
  assert.equal(r.estado, 401);
  assert.equal(r.datos.statusCode, 401);
  assert.equal(r.datos.path, '/api/v1/conversaciones');
  const voz = await api('POST', '/voz', { texto: 'hola', idioma: 'es' });
  assert.equal(voz.estado, 401);
});
