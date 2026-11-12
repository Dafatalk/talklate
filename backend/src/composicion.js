// Raiz de composicion de la arquitectura hexagonal (ADR-013). Es el UNICO lugar que conoce a la vez
// los casos de uso y los adaptadores concretos: lee la configuracion (variables de entorno), elige
// cada adaptador, verifica que cumpla su puerto y entrega los casos de uso armados al adaptador HTTP.
const log = require('./compartido/log');
const { asegurarPuerto, asegurarRepositorio, NOTIFICADOR, CIFRADOR, TRANSCRIPTOR, SINTETIZADOR, DETECTOR_GENERO, HASHEADOR, FIRMADOR_TOKENS } = require('./puertos');
const { crearHasheadorBcrypt } = require('./adaptadores/credenciales/bcrypt');
const { crearFirmadorJwt } = require('./adaptadores/credenciales/jwt');
const { crearMotorQwen } = require('./adaptadores/traduccion/qwen');
const { crearMotorClaude } = require('./adaptadores/traduccion/claude');
const { crearMotorVertex } = require('./adaptadores/traduccion/vertex');
const { crearMotorReglas } = require('./adaptadores/traduccion/reglas');
const { crearNotificadorConsola } = require('./adaptadores/correo/consola');
const { crearCifradorAesGcm } = require('./adaptadores/cifrado/aesGcm');
const { crearTranscriptorWhisper } = require('./adaptadores/transcripcion/whisper');
const { crearSintetizadorAzure } = require('./adaptadores/sintesis/azure');
const { crearSintetizadorOpenAI } = require('./adaptadores/sintesis/openai');
const { crearSintetizadorElevenLabs } = require('./adaptadores/sintesis/elevenlabs');
const { crearDetectorGeneroPitch } = require('./adaptadores/audio/genero');
const { crearServicioVoz } = require('./aplicacion/voz');
const { crearServicioTraduccion } = require('./aplicacion/traduccion');
const { crearServicioSesiones } = require('./aplicacion/sesiones');
const { crearServicioCuentas } = require('./aplicacion/cuentas');
const { crearServicioConversaciones } = require('./aplicacion/conversaciones');
const { crearServicioCatalogo } = require('./aplicacion/catalogo');
const { crearServicioReportes } = require('./aplicacion/reportes');
const { crearServicioProblemas } = require('./aplicacion/problemas');

const esProduccion = (entorno) => entorno.NODE_ENV === 'production';

// Cadena de motores segun TRADUCTOR (ADR-004):
//   auto (por defecto): Qwen -> Claude (si esta disponible) -> reglas
//   qwen: Qwen -> reglas · claude: Claude -> reglas · local: solo reglas
// Claude se sirve por Google Vertex AI (Sonnet, auth por ADC) cuando ANTHROPIC_USE_VERTEX esta activo;
// si no, por la API directa de Anthropic (necesita ANTHROPIC_API_KEY). Ver adaptadores/traduccion/{vertex,claude}.js.
function crearMotores(entorno = process.env, { fetchFn } = {}) {
  const modo = (entorno.TRADUCTOR || 'auto').toLowerCase();
  const usaVertex = /^(1|true|si|sí|on|yes)$/i.test(String(entorno.ANTHROPIC_USE_VERTEX || ''));
  const qwen = () => crearMotorQwen({ url: entorno.OLLAMA_URL || undefined, modelo: entorno.QWEN_MODEL || undefined, timeoutMs: Number(entorno.QWEN_TIMEOUT_MS) || undefined, fetchFn });
  // Region propia de TalkLate (default 'global'): Claude en Vertex NO se sirve en todas las regiones
  // (p. ej. us-central1, el default del SDK, falla). No usamos CLOUD_ML_REGION para no heredar una
  // region generica de GCP que no sirva para Claude. Sobreescribible con TALKLATE_VERTEX_REGION.
  const claude = () => (usaVertex
    ? crearMotorVertex({
      proyecto: entorno.ANTHROPIC_VERTEX_PROJECT_ID,
      region: entorno.TALKLATE_VERTEX_REGION || undefined,
      modelo: entorno.TALKLATE_MODEL || entorno.ANTHROPIC_DEFAULT_SONNET_MODEL || undefined,
    })
    : crearMotorClaude({ apiKey: entorno.ANTHROPIC_API_KEY, modelo: entorno.TALKLATE_MODEL || undefined, fetchFn }));
  const reglas = crearMotorReglas();
  if (modo === 'local') return [reglas];
  if (modo === 'qwen') return [qwen(), reglas];
  if (modo === 'claude') return [claude(), reglas];
  return [qwen(), claude(), reglas];
}

// Voz natural segun VOZ_MOTOR (ADR-015): auto (ElevenLabs -> Azure -> OpenAI compatible),
// elevenlabs, azure, openai o ninguno (ninguno = la app usa la voz del celular)
function crearSintetizadores(entorno = process.env, { fetchFn } = {}) {
  const modo = (entorno.VOZ_MOTOR || 'auto').toLowerCase();
  const azure = () => crearSintetizadorAzure({ clave: entorno.AZURE_SPEECH_KEY, region: entorno.AZURE_SPEECH_REGION, fetchFn });
  const openai = () => crearSintetizadorOpenAI({ url: entorno.VOZ_URL, modelo: entorno.VOZ_MODELO || undefined, voz: entorno.VOZ_NOMBRE || undefined, apiKey: entorno.VOZ_API_KEY, fetchFn });
  // ElevenLabs: voces por locale (es-CO=paisa, en-US=New York) con par hombre/mujer. El genero se detecta
  // por mensaje (lo infiere el modelo de traduccion); si no hay pista usa ELEVENLABS_GENERO (default hombre).
  const paisa = { hombre: entorno.ELEVENLABS_VOZ_PAISA_HOMBRE, mujer: entorno.ELEVENLABS_VOZ_PAISA_MUJER };
  const newYork = { hombre: entorno.ELEVENLABS_VOZ_NY_HOMBRE, mujer: entorno.ELEVENLABS_VOZ_NY_MUJER };
  const elevenlabs = () => crearSintetizadorElevenLabs({
    apiKey: entorno.ELEVENLABS_API_KEY,
    modelo: entorno.ELEVENLABS_MODELO || undefined,
    generoDefault: (entorno.ELEVENLABS_GENERO || 'hombre').toLowerCase(),
    voces: {
      'es-CO': paisa,
      'en-US': newYork,
      es: paisa,
      en: newYork,
      default: entorno.ELEVENLABS_VOZ_DEFAULT,
    },
    fetchFn,
  });
  const porModo = { ninguno: [], elevenlabs: [elevenlabs()], azure: [azure()], openai: [openai()] };
  const lista = porModo[modo] || [elevenlabs(), azure(), openai()];
  return lista.map((s) => asegurarPuerto(`sintetizador.${s.nombre}`, s, SINTETIZADOR));
}

function crearTraduccion(entorno = process.env, opciones = {}) {
  return crearServicioTraduccion({ motores: opciones.motores || crearMotores(entorno, opciones), log });
}

// Deteccion de genero por la agudeza de la voz segun GENERO_VOZ: auto/pitch (por defecto, usa ffmpeg)
// o ninguno (desactiva; cae a la inferencia por texto y al default). Ver adaptadores/audio/genero.js.
function crearDetectorGenero(entorno = process.env) {
  const habilitado = (entorno.GENERO_VOZ || 'auto').toLowerCase() !== 'ninguno';
  return crearDetectorGeneroPitch({ ffmpegPath: entorno.FFMPEG_PATH || undefined, habilitado, timeoutMs: Number(entorno.GENERO_VOZ_TIMEOUT_MS) || undefined });
}

function secretoJwt(entorno) {
  if (entorno.JWT_SECRET) return entorno.JWT_SECRET;
  if (esProduccion(entorno)) throw new Error('Falta JWT_SECRET en produccion');
  log.advertencia('jwt_secreto_desarrollo', { detalle: 'JWT_SECRET no esta definido; se usa un secreto de desarrollo.' });
  return 'secreto-solo-desarrollo';
}

// Arma todos los casos de uso sobre un repositorio ya creado. Cada adaptador se puede reemplazar
// (por ejemplo, en pruebas) pasandolo en "adaptadores".
function componer({ repo, entorno = process.env, adaptadores = {} }) {
  asegurarRepositorio(repo);
  const cifrador = asegurarPuerto('cifrador', adaptadores.cifrador || crearCifradorAesGcm({ secreto: entorno.TALKLATE_CLAVE_CIFRADO, produccion: esProduccion(entorno) }), CIFRADOR);
  const notificador = asegurarPuerto('notificador', adaptadores.notificador || crearNotificadorConsola({ modo: entorno.CORREO_MODO || 'consola', produccion: esProduccion(entorno) }), NOTIFICADOR);
  const traduccion = crearTraduccion(entorno, { motores: adaptadores.motores, fetchFn: adaptadores.fetchFn });
  // Whisper (API compatible con OpenAI): local con speaches/faster-whisper o whisper.cpp, o en la nube
  const transcriptor = asegurarPuerto('transcriptor', adaptadores.transcriptor || crearTranscriptorWhisper({
    url: entorno.TRANSCRIPCION_URL, modelo: entorno.TRANSCRIPCION_MODELO || undefined, apiKey: entorno.TRANSCRIPCION_API_KEY,
    timeoutMs: Number(entorno.TRANSCRIPCION_TIMEOUT_MS) || undefined, fetchFn: adaptadores.fetchFn,
  }), TRANSCRIPTOR);
  const hasheador = asegurarPuerto('hasheador', adaptadores.hasheador || crearHasheadorBcrypt(), HASHEADOR);
  const firmador = asegurarPuerto('firmador de tokens', adaptadores.firmador || crearFirmadorJwt({ secreto: secretoJwt(entorno) }), FIRMADOR_TOKENS);
  const sesiones = crearServicioSesiones({
    repo,
    firmador,
    duracionAccesoSeg: Number(entorno.DURACION_ACCESO_SEG) || undefined,
    duracionRefrescoMs: (Number(entorno.DURACION_REFRESCO_DIAS) || 30) * 24 * 60 * 60 * 1000,
  });
  const voz = crearServicioVoz({ sintetizadores: adaptadores.sintetizadores || crearSintetizadores(entorno, { fetchFn: adaptadores.fetchFn }), log });
  const detectorGenero = asegurarPuerto('detector de genero', adaptadores.detectorGenero || crearDetectorGenero(entorno), DETECTOR_GENERO);
  return {
    traduccion,
    transcriptor,
    voz,
    sesiones,
    cuentas: crearServicioCuentas({ repo, sesiones, notificador, hasheador, log }),
    conversaciones: crearServicioConversaciones({ repo, traduccion, cifrador, transcriptor, detectorGenero, log }),
    catalogo: crearServicioCatalogo({ repo, log }),
    reportes: crearServicioReportes({ repo, cifrador, log }),
    problemas: crearServicioProblemas({ repo, log }),
  };
}

// Adaptador de persistencia segun DB_DRIVER: 'surreal' (fuente de verdad, ADR-012) o 'sqlite' (pruebas)
function crearPersistencia(entorno = process.env) {
  const driver = (entorno.DB_DRIVER || 'surreal').toLowerCase();
  if (driver === 'sqlite') {
    const { abrir } = require('./adaptadores/persistencia/sqlite/esquema');
    return { driver, repo: require('./adaptadores/persistencia/sqlite/repositorio')(abrir()), saludDb: async () => ({ ok: true, motor: 'sqlite' }) };
  }
  const cliente = require('./adaptadores/persistencia/surreal/cliente');
  return { driver, repo: require('./adaptadores/persistencia/surreal/repositorio')(), saludDb: () => cliente.estado() };
}

module.exports = { crearSintetizadores, componer, crearMotores, crearTraduccion, crearPersistencia };
