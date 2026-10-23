const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { ErrorNegocio, cuerpoError } = require('../../dominio/errores');
const log = require('../../compartido/log');

// CORS con origenes explicitos (convenciones/seguridad.md seccion 7). Las apps nativas no envian Origin.
const ORIGENES = (process.env.CORS_ORIGENES || 'http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006')
  .split(',').map((o) => o.trim()).filter(Boolean);

// Adaptador HTTP (entrada) de la arquitectura hexagonal (ADR-013). crearApp(servicios, opciones):
// servicios son los casos de uso ya armados por composicion.js; esta capa solo traduce HTTP.
// opciones.saludDb: fn async opcional que informa el estado de la base para /health.
function crearApp(servicios, opciones = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({
    origin: (origen, cb) => cb(null, !origen || ORIGENES.includes('*') || ORIGENES.includes(origen)),
    exposedHeaders: ['Location'],
  }));
  // JSON de hasta 1 MB; solo el mensaje de voz (audio en base64) admite hasta 15 MB
  const json = express.json({ limit: '1mb' });
  const jsonVoz = express.json({ limit: '15mb' });
  app.use((req, res, next) => (/\/mensajes\/voz$/.test(req.path) ? jsonVoz : json)(req, res, next));

  // Health check (convenciones/api-rest.md seccion 8): incluye el estado de SurrealDB
  app.get('/health', async (_req, res) => {
    let db = { ok: true };
    if (opciones.saludDb) {
      try { db = await opciones.saludDb(); } catch (e) { log.error('salud_db_fallida', { detalle: e.message }); db = { ok: false }; }
    }
    res.status(db.ok === false ? 503 : 200).json({ ok: db.ok !== false, servicio: 'talklate', version: 'v1', motores_traduccion: servicios.traduccion.cadena(), transcripcion_voz: !!(servicios.transcriptor && servicios.transcriptor.disponible()), db });
  });

  // Documentacion OpenAPI 3.0 (convenciones/api-rest.md seccion 9)
  const especificacion = path.join(__dirname, '..', '..', '..', 'openapi.yaml');
  app.get('/api/v1/openapi.yaml', (_req, res) => res.type('text/yaml').send(fs.readFileSync(especificacion, 'utf8')));
  try {
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yaml');
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(YAML.parse(fs.readFileSync(especificacion, 'utf8'))));
  } catch (e) {
    log.advertencia('docs_no_disponibles', { detalle: e.message });
  }

  const v1 = express.Router();
  v1.use('/auth', require('./rutas/cuentas')(servicios));
  v1.use('/usuarios', require('./rutas/cuentas').rutasUsuarios(servicios));
  v1.use('/', require('./rutas/catalogo')(servicios));
  v1.use('/', require('./rutas/conversaciones')(servicios));
  v1.use('/', require('./rutas/reportes')(servicios));
  app.use('/api/v1', v1);

  app.use((req, res) => res.status(404).json(cuerpoError(404, 'No encontramos esa ruta.', req.originalUrl)));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof ErrorNegocio) return res.status(err.estado).json(cuerpoError(err.estado, err.message, req.originalUrl));
    if (err && err.type === 'entity.parse.failed') return res.status(400).json(cuerpoError(400, 'El cuerpo de la peticion no es un JSON valido.', req.originalUrl));
    log.error('error_inesperado', { ruta: req.originalUrl, detalle: err && err.message });
    res.status(500).json(cuerpoError(500, 'Ocurrio un error inesperado. Intenta de nuevo.', req.originalUrl));
  });
  return app;
}

module.exports = { crearApp };
