const { crearApp } = require('./app');
const traductor = require('./lib/traductor');
const log = require('./lib/log');

// DB_DRIVER selecciona la fuente de verdad: 'surreal' (por defecto) o 'sqlite'.
async function main() {
  const driver = (process.env.DB_DRIVER || 'surreal').toLowerCase();
  let repo;
  let saludDb;
  if (driver === 'sqlite') {
    const { abrir } = require('./db');
    repo = require('./repos/sqlite')(abrir());
    saludDb = async () => ({ ok: true, motor: 'sqlite' });
  } else {
    const surreal = require('./surreal');
    repo = require('./repos/surreal')();
    saludDb = () => surreal.estado();
  }

  await repo.inicializar(); // conecta a SurrealDB y aplica esquema + semilla (o no-op en sqlite)

  const puerto = Number(process.env.PORT) || 3000;
  crearApp(repo, { saludDb }).listen(puerto, '0.0.0.0', () => {
    log.info('api_iniciada', { puerto, driver, base: '/api/v1', docs: '/api/v1/docs', motores_traduccion: traductor.cadena() });
  });
}

main().catch((e) => {
  log.error('arranque_fallido', { detalle: e.message });
  process.exit(1);
});
