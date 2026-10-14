# Convenciones - Backend Node.js + Express + SQLite

**Fase 0 - manual por tecnologia (agregado al decidir el stack en F3).**

## Estructura
```
backend/
  src/app.js            arma la app Express: CORS, /health, /api/v1, documentacion y manejo de errores
  src/server.js         arranque
  src/db.js             esquema SQLite, migraciones simples y datos iniciales
  src/routes/           una ruta por recurso (auth, catalogo, conversaciones, reportes)
  src/lib/              reglas y servicios: validaciones, auth, cifrado, log, limites, traductor y motores
  test/                 pruebas con node:test (*.test.js)
  scripts/              utilidades (medir-traduccion.js)
  openapi.yaml          contrato de la API (OpenAPI 3)
```

## Reglas
- Node 22.5 o superior, CommonJS, 2 espacios, comillas simples, punto y coma.
- Identificadores del dominio en espanol, igual que el modelo de dominio (ADR-009).
- Las rutas no contienen reglas de negocio repetidas: las validaciones viven en `src/lib/validaciones.js`.
- Errores con `ErrorNegocio` (`src/lib/errores.js`): 400 validacion, 401, 403, 404, 409, 422 regla de negocio, 429.
- Solo consultas SQL parametrizadas (`db.prepare(...).run(?, ?)`); nunca concatenar datos del usuario.
- Contenido de mensajes siempre con `cifrar()` al guardar y `descifrar()` al leer.
- Logs solo con `src/lib/log.js`; nunca `console.log` con datos de usuarios.
- Secretos y configuracion por variables de entorno (`.env.example`); nunca en el codigo.

## Pruebas
- `npm test` corre todo; `npm run coverage` exige 80 % o mas de lineas y funciones.
- Cada historia nueva trae pruebas de sus criterios de aceptacion en `test/api.test.js`.
