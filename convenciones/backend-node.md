# Convenciones - Backend Node.js + Express + SurrealDB

**Fase 0 - manual por tecnologia (agregado al decidir el stack en F3).**

## Estructura (arquitectura hexagonal, ADR-013)
```
backend/
  src/dominio/          reglas puras: validaciones, errores de negocio, analisis de idioma, tono y region
  src/aplicacion/       casos de uso, uno por epica: cuentas, sesiones, conversaciones, traduccion, catalogo, reportes
  src/puertos/          contratos: Repositorio, MotorTraduccion, Notificador, Cifrador
  src/adaptadores/
    http/               entrada: app Express, rutas por recurso, sesion (Authorization) y limites de uso
    persistencia/       salida: surreal/ (cliente HTTP y repositorio) y sqlite/ (esquema y repositorio, pruebas)
    traduccion/         salida: motores qwen, claude y reglas, y el prompt comun
    correo/, cifrado/   salida: notificador (consola en desarrollo) y AES-256-GCM
  src/compartido/log.js logs estructurados (todas las capas)
  src/composicion.js    raiz de composicion: elige los adaptadores segun el entorno y arma los casos de uso
  src/server.js         arranque
  db/surreal/           esquema SurrealDB (schema.surql)
  test/                 pruebas con node:test (*.test.js)
  scripts/              utilidades (medir-traduccion.js, verificar-surreal.js, smoke-http.js)
  openapi.yaml          contrato de la API (OpenAPI 3)
```

## Reglas
- Node 22.5 o superior, CommonJS, 2 espacios, comillas simples, punto y coma.
- Identificadores del dominio en espanol, igual que el modelo de dominio (ADR-009).
- **Regla de dependencias:** `dominio` no importa nada del proyecto; `aplicacion` solo importa `dominio` y `puertos`; ningun caso de uso importa Express, la base ni un adaptador. Solo `composicion.js` conoce los adaptadores concretos.
- Las rutas HTTP solo traducen peticiones y respuestas (codigos, cabeceras, paginacion); las reglas de negocio viven en los casos de uso y las validaciones en `src/dominio/validaciones.js`.
- Una dependencia externa nueva (servicio, base, motor) entra como puerto en `src/puertos` y adaptador en `src/adaptadores`, y se conecta en `composicion.js`.
- Errores con `ErrorNegocio` (`src/dominio/errores.js`): 400 validacion, 401, 403, 404, 409, 422 regla de negocio, 429.
- Solo consultas parametrizadas en SQL (`db.prepare(...).run(?, ?)`) y valores serializados con `lit`/`rid` en SurrealDB; nunca concatenar datos del usuario.
- Contenido de mensajes siempre cifrado con el puerto `Cifrador` al guardar y descifrado al leer.
- Logs solo con `src/compartido/log.js`; nunca `console.log` con datos de usuarios.
- Secretos y configuracion por variables de entorno (`.env.example`); nunca en el codigo.

## Pruebas
- `npm test` corre todo; `npm run coverage` exige 80 % o mas de lineas y funciones.
- Cada historia nueva trae pruebas de sus criterios de aceptacion en `test/api.test.js`.
- Los casos de uso se pueden probar con adaptadores falsos que cumplan el puerto (ejemplo: motores de traduccion en `test/motores.test.js`).
