// Raiz de composicion de la arquitectura hexagonal (ADR-013). Es el UNICO lugar que conoce a la vez
// los casos de uso y los adaptadores concretos: lee la configuracion (variables de entorno), elige
// cada adaptador, verifica que cumpla su puerto y entrega los casos de uso armados al adaptador HTTP.
const log = require('./compartido/log');
const { asegurarPuerto, asegurarRepositorio, NOTIFICADOR, CIFRADOR } = require('./puertos');
const { crearMotorQwen } = require('./adaptadores/traduccion/qwen');
const { crearMotorClaude } = require('./adaptadores/traduccion/claude');
const { crearMotorReglas } = require('./adaptadores/traduccion/reglas');
const { crearNotificadorConsola } = require('./adaptadores/correo/consola');
const { crearCifradorAesGcm } = require('./adaptadores/cifrado/aesGcm');
const { crearServicioTraduccion } = require('./aplicacion/traduccion');
const { crearServicioSesiones } = require('./aplicacion/sesiones');
const { crearServicioCuentas } = require('./aplicacion/cuentas');
const { crearServicioConversaciones } = require('./aplicacion/conversaciones');
const { crearServicioCatalogo } = require('./aplicacion/catalogo');
const { crearServicioReportes } = require('./aplicacion/reportes');

const esProduccion = (entorno) => entorno.NODE_ENV === 'production';

// Cadena de motores segun TRADUCTOR (ADR-004):
//   auto (por defecto): Qwen -> Claude (si hay ANTHROPIC_API_KEY) -> reglas
//   qwen: Qwen -> reglas · claude: Claude -> reglas · local: solo reglas
function crearMotores(entorno = process.env, { fetchFn } = {}) {
  const modo = (entorno.TRADUCTOR || 'auto').toLowerCase();
  const qwen = () => crearMotorQwen({ url: entorno.OLLAMA_URL || undefined, modelo: entorno.QWEN_MODEL || undefined, timeoutMs: Number(entorno.QWEN_TIMEOUT_MS) || undefined, fetchFn });
  const claude = () => crearMotorClaude({ apiKey: entorno.ANTHROPIC_API_KEY, modelo: entorno.TALKLATE_MODEL || undefined, fetchFn });
  const reglas = crearMotorReglas();
  if (modo === 'local') return [reglas];
  if (modo === 'qwen') return [qwen(), reglas];
  if (modo === 'claude') return [claude(), reglas];
  return [qwen(), claude(), reglas];
}

function crearTraduccion(entorno = process.env, opciones = {}) {
  return crearServicioTraduccion({ motores: opciones.motores || crearMotores(entorno, opciones), log });
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
  const sesiones = crearServicioSesiones({
    repo,
    secreto: secretoJwt(entorno),
    duracionAccesoSeg: Number(entorno.DURACION_ACCESO_SEG) || undefined,
    duracionRefrescoMs: (Number(entorno.DURACION_REFRESCO_DIAS) || 30) * 24 * 60 * 60 * 1000,
  });
  return {
    traduccion,
    sesiones,
    cuentas: crearServicioCuentas({ repo, sesiones, notificador, log }),
    conversaciones: crearServicioConversaciones({ repo, traduccion, cifrador, log }),
    catalogo: crearServicioCatalogo({ repo, log }),
    reportes: crearServicioReportes({ repo, cifrador, log }),
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

module.exports = { componer, crearMotores, crearTraduccion, crearPersistencia };
