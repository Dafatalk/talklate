// Puertos de la arquitectura hexagonal (ADR-013): los contratos que la aplicacion necesita del
// mundo exterior. La aplicacion solo conoce estos contratos; los adaptadores (adaptadores/*) los
// cumplen y la composicion (composicion.js) decide cual se usa. Asi se cambia un motor de
// traduccion, la base de datos o el envio de correo sin tocar los casos de uso.

/**
 * Puerto MotorTraduccion (salida). Lo cumplen adaptadores/traduccion/{qwen,claude,reglas}.js.
 * @typedef {object} MotorTraduccion
 * @property {string} nombre                       identificador corto: 'qwen', 'claude', 'local'
 * @property {() => string} etiqueta              nombre que se guarda en el mensaje (ej. 'qwen:qwen2.5:7b')
 * @property {() => boolean} disponible           si se puede usar con la configuracion actual
 * @property {(origen: string, destino: string) => boolean} soportaPar  pares de idiomas que entiende
 * @property {(entrada: object) => Promise<{traduccion: string, nota: string|null, aproximada: boolean, tono?: string|null, regionOrigen?: string|null}>} traducir
 */
const MOTOR_TRADUCCION = ['nombre', 'etiqueta', 'disponible', 'soportaPar', 'traducir'];

/**
 * Puerto Repositorio (salida): persistencia del dominio. Lo cumplen
 * adaptadores/persistencia/surreal/repositorio.js y adaptadores/persistencia/sqlite/repositorio.js.
 */
const REPOSITORIO = {
  usuarios: ['crear', 'porCorreo', 'porId', 'paraSesion', 'existeCorreo', 'actualizarPassword', 'contarAdmins', 'eliminar'],
  tokens: ['crear', 'porHash', 'consumir', 'revocarHash', 'revocarDeUsuario'],
  sesiones: ['agregar', 'tiene', 'limpiarExpiradas'],
  recuperaciones: ['invalidarDeUsuario', 'crear', 'ultimaVigente', 'marcarUsada'],
  catalogo: ['obtener', 'lenguajePorId', 'lenguajePorCodigoActivo', 'existeLenguaje', 'crearLenguaje', 'existeLenguajeNombreOCodigo',
    'existeOtroLenguajeConNombre', 'renombrarLenguaje', 'activarLenguaje', 'addRegionLenguaje', 'setRegionesLenguaje',
    'regionValidaParaLenguaje', 'regionPorId', 'existeRegion', 'crearRegion', 'existeRegionEnPais', 'paisPorNombre',
    'existePaisCodigo', 'crearPais', 'entonacionesActivas', 'canalPorNombre', 'regionIdPorNombrePaisLenguaje'],
  conversaciones: ['crearConfigurada', 'porId', 'delUsuario', 'listarDeUsuario', 'renombrar', 'eliminar', 'lpcDe', 'contarLpc', 'crearLpc'],
  mensajes: ['deConversacion', 'ultimo', 'contar', 'crear'],
  reportes: ['mensajeDestinoPropio', 'existe', 'crear', 'listar', 'porId', 'actualizar'],
};

/**
 * Puerto Notificador (salida): avisos al usuario fuera de la app. Lo cumple adaptadores/correo/consola.js.
 * enviarCodigoRecuperacion(usuarioId, codigo) -> { devolverCodigo: boolean }
 */
const NOTIFICADOR = ['enviarCodigoRecuperacion'];

/**
 * Puerto Cifrador (salida): cifrado en reposo del contenido de los mensajes. Lo cumple adaptadores/cifrado/aesGcm.js.
 */
const CIFRADOR = ['cifrar', 'descifrar'];

// Verifica que un adaptador cumpla su puerto; falla al arrancar y no a mitad de una peticion.
function asegurarPuerto(nombre, objeto, metodos) {
  const faltan = metodos.filter((m) => !objeto || (typeof objeto[m] !== 'function' && !(m === 'nombre' && typeof objeto[m] === 'string')));
  if (faltan.length) throw new Error(`El adaptador de ${nombre} no cumple el puerto: falta ${faltan.join(', ')}`);
  return objeto;
}

function asegurarRepositorio(repo) {
  for (const [parte, metodos] of Object.entries(REPOSITORIO)) asegurarPuerto(`repositorio.${parte}`, repo && repo[parte], metodos);
  return repo;
}

module.exports = { MOTOR_TRADUCCION, REPOSITORIO, NOTIFICADOR, CIFRADOR, asegurarPuerto, asegurarRepositorio };
