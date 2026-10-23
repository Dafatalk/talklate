// Arranque de la API: elige el adaptador de persistencia, compone los casos de uso y escucha HTTP.
const { crearApp } = require('./adaptadores/http/app');
const { componer, crearPersistencia } = require('./composicion');
const log = require('./compartido/log');

async function main() {
  const { driver, repo, saludDb } = crearPersistencia();
  await repo.inicializar(); // conecta a SurrealDB y aplica esquema + semilla (o no-op en sqlite)
  const servicios = componer({ repo });

  const puerto = Number(process.env.PORT) || 3000;
  crearApp(servicios, { saludDb }).listen(puerto, '0.0.0.0', () => {
    log.info('api_iniciada', { puerto, driver, base: '/api/v1', docs: '/api/v1/docs', motores_traduccion: servicios.traduccion.cadena() });
  });
}

main().catch((e) => {
  log.error('arranque_fallido', { detalle: e.message });
  process.exit(1);
});
