/**
 * dependency-cruiser — Reglas de la arquitectura hexagonal de TalkLate (ADR-013).
 *
 * Valida, sobre el codigo real de backend/src, las dependencias permitidas entre capas:
 *   dominio     -> solo si mismo + builtins de node (capa pura)
 *   aplicacion  -> dominio, puertos           (casos de uso; nunca adaptadores concretos)
 *   puertos     -> contratos de salida        (a lo sumo dominio)
 *   adaptadores -> puertos, dominio, aplicacion (el adaptador HTTP invoca casos de uso)
 *   composicion -> todo                        (composition root: unico que arma adaptadores)
 *
 * Validar:   npm run arch:check     (desde backend/)
 * Diagrama:  npm run arch:graph     (mermaid, pegable en GitHub/Markdown)
 */
module.exports = {
  forbidden: [
    {
      name: 'no-ciclos',
      severity: 'error',
      comment: 'Las dependencias circulares rompen el desacoplamiento entre capas.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-imports-rotos',
      severity: 'error',
      comment: 'Todo import debe resolver a un modulo existente.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'dominio-puro',
      severity: 'error',
      comment:
        'El dominio no depende de otras capas, adaptadores, frameworks ni librerias: ' +
        'solo de si mismo y de los builtins de node.',
      from: { path: '^src/dominio' },
      to: { pathNot: '^src/dominio', dependencyTypesNot: ['core'] },
    },
    {
      name: 'aplicacion-no-usa-adaptadores',
      severity: 'error',
      comment: 'Los casos de uso dependen de puertos (contratos), nunca de adaptadores concretos.',
      from: { path: '^src/aplicacion' },
      to: { path: '^src/adaptadores' },
    },
    {
      name: 'puertos-son-contratos',
      severity: 'error',
      comment: 'Los puertos son contratos de salida: no dependen de la aplicacion ni de los adaptadores.',
      from: { path: '^src/puertos' },
      to: { path: '^src/(aplicacion|adaptadores)' },
    },
    {
      name: 'nucleo-sin-frameworks',
      severity: 'error',
      comment:
        'El nucleo (aplicacion/puertos) no importa frameworks de infraestructura; esos viven en adaptadores.',
      from: { path: '^src/(aplicacion|puertos)' },
      to: {
        dependencyTypes: ['npm'],
        path: 'node_modules/(express|cors|bcryptjs|jsonwebtoken|swagger-ui-express)(/|$)',
      },
    },
    {
      name: 'adaptadores-no-se-cruzan',
      severity: 'error',
      comment:
        'Un adaptador no importa a otro de distinta categoria; se integran en composicion.js. ' +
        'Dentro de la misma categoria si (ej. http/rutas -> http/sesion).',
      from: { path: '^src/adaptadores/([^/]+)/' },
      to: { path: '^src/adaptadores/([^/]+)/', pathNot: '^src/adaptadores/$1/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: false,
  },
};
