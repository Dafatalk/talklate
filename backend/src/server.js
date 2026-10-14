const { abrir } = require('./db');
const { crearApp } = require('./app');
const traductor = require('./lib/traductor');
const log = require('./lib/log');

const db = abrir();
const puerto = Number(process.env.PORT) || 3000;
crearApp(db).listen(puerto, '0.0.0.0', () => {
  log.info('api_iniciada', { puerto, base: '/api/v1', docs: '/api/v1/docs', motores_traduccion: traductor.cadena() });
});
