const express = require('express');
const cors = require('cors');
const { ErrorNegocio } = require('./lib/errores');
const traductor = require('./lib/traductor');

function crearApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/salud', (_req, res) => res.json({ ok: true, servicio: 'talklate', motor_traduccion: traductor.modo() }));
  app.use('/api/auth', require('./routes/auth')(db));
  app.use('/api', require('./routes/catalogo')(db));
  app.use('/api', require('./routes/conversaciones')(db));
  app.use('/api', require('./routes/reportes')(db));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontramos esa ruta.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ErrorNegocio) return res.status(err.estado).json({ error: err.message });
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo de la peticion no es un JSON valido.' });
    console.error('[talklate] error inesperado:', err);
    res.status(500).json({ error: 'Ocurrio un error inesperado. Intenta de nuevo.' });
  });
  return app;
}

module.exports = { crearApp };
