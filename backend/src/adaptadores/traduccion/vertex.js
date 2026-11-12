// Adaptador del puerto MotorTraduccion (ver puertos/index.js): Claude (Sonnet) servido por Google Vertex AI.
// A diferencia de claude.js (API directa de Anthropic con x-api-key), Vertex se autentica con las credenciales
// de Google (ADC: gcloud auth application-default login o GOOGLE_APPLICATION_CREDENTIALS), no con ANTHROPIC_API_KEY.
// Solo esta disponible si hay proyecto de Vertex configurado (ANTHROPIC_VERTEX_PROJECT_ID). Ver ADR-004.
const { armarPrompt, leerRespuesta, paraPrompt } = require('./prompt');

// Carga perezosa del SDK: asi las pruebas pueden inyectar un cliente falso sin exigir la dependencia ni red.
function crearClienteVertex({ proyecto, region }) {
  const { AnthropicVertex } = require('@anthropic-ai/vertex-sdk');
  return new AnthropicVertex({ projectId: proyecto, region });
}

function crearMotorVertex({
  proyecto,
  region = 'global',
  modelo = 'claude-sonnet-4-6',
  maxTokens = 1024,
  timeoutMs = 30000, // el SDK espera minutos por defecto: se acota como en claude.js
  cliente, // inyectable en pruebas; si no se pasa, se construye con el SDK la primera vez que se usa
  crearCliente = crearClienteVertex,
} = {}) {
  const obtenerCliente = () => {
    if (cliente) return cliente;
    if (!proyecto) return null;
    cliente = crearCliente({ proyecto, region });
    return cliente;
  };
  return {
    nombre: 'claude', // mismo modelo que claude.js; cambia el transporte, no la familia (ver cadena en composicion.js)
    etiqueta: () => `vertex:${modelo}`,
    disponible: () => !!(cliente || proyecto),
    soportaPar: (origen, destino) => origen !== destino,
    async traducir(entrada) {
      const c = obtenerCliente();
      if (!c) throw new Error('Vertex no esta configurado (falta ANTHROPIC_VERTEX_PROJECT_ID)');
      // Sin reintentos del SDK (maxRetries 0): si falla, el Circuit Breaker pasa al siguiente motor (ADR-004)
      const respuesta = await c.messages.create({
        model: modelo,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: armarPrompt(paraPrompt(entrada)) }],
      }, { timeout: timeoutMs, maxRetries: 0 });
      return leerRespuesta((respuesta.content || []).map((b) => b.text || '').join(''), entrada.tonos);
    },
  };
}

module.exports = { crearMotorVertex };
