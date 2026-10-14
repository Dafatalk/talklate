const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { ErrorNegocio, cuerpoError } = require('./lib/errores');
const traductor = require('./lib/traductor');
const log = require('./lib/log');

// CORS con origenes explicitos (convenciones/seguridad.md seccion 7). Las apps nativas no envian Origin.
const ORIGENES = (process.env.CORS_ORIGENES || 'http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006')
  .split(',').map((o) => o.trim()).filter(Boolean);

function crearApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({
    origin: (origen, cb) => cb(null, !origen || ORIGENES.includes('*') || ORIGENES.includes(origen)),
    exposedHeaders: ['Location'],
  }));
  app.use(express.json({ limit: '1mb' }));

  // Health check (convenciones/api-rest.md seccion 8)
  app.get('/health', (_req, res) => res.json({ ok: true, servicio: 'talklate', version: 'v1', motores_traduccion: traductor.cadena() }));

  // Documentacion OpenAPI 3.0 (convenciones/api-rest.md seccion 9)
  const especificacion = path.join(__dirname, '..', 'openapi.yaml');
  app.get('/api/v1/openapi.yaml', (_req, res) => res.type('text/yaml').send(fs.readFileSync(especificacion, 'utf8')));
  try {
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yaml');
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(YAML.parse(fs.readFileSync(especificacion, 'utf8'))));
  } catch (e) {
    log.advertencia('docs_no_disponibles', { detalle: e.message });
  }

  const v1 = express.Router();
  v1.use('/auth', require('./routes/auth')(db));
  v1.use('/usuarios', require('./routes/auth').usuariosRouter(db));
  v1.use('/', require('./routes/catalogo')(db));
  v1.use('/', require('./routes/conversaciones')(db));
  v1.use('/', require('./routes/reportes')(db));
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
