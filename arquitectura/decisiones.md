# Decisiones de Arquitectura - TalkLate

**Fase 3 - Arquitectura de Software & Base de Datos**

**Como se tomaron:** primero se construyo y despues se justifico, como lo autorizo Farid en la reunion presencial (`seguimiento/records/2026-10-14-reunion-presencial.md`). Las decisiones estan en el codigo de la prueba de concepto del 14/10/2026; aqui se sustentan. Las **alternativas** se compararon **al justificar** (no antes de construir): cada una dice por que se descarto para este proyecto. Los drivers estan en `drivers.md`; los patrones citados vienen del catalogo `convenciones/patrones-arquitectonicos.md`.

| ADR | Decision | Patron del catalogo | Estado |
| --- | --- | --- | --- |
| ADR-001 | App movil con Expo (React Native) y NativeWind | - | aceptada |
| ADR-002 | Backend monolitico en Node.js con Express, API REST sincrona | Request-Reply (2.3) | aceptada |
| ADR-003 | SQLite como base de datos inicial | - | reemplazada por ADR-012 (queda para pruebas sin servidor) |
| ADR-004 | Traduccion con Qwen local, Claude Sonnet de respaldo y motor de reglas | Circuit Breaker (4.1) con degradacion aceptable | aceptada |
| ADR-005 | Voz: dictado en el cliente y expo-speech para la salida | - | aceptada |
| ADR-006 | Autenticacion con JWT de acceso corto y token de refresco rotativo | Token-Based Authentication (5.1) | aceptada |
| ADR-007 | Interfaz basada en el template Luna | - | aceptada |
| ADR-008 | Ajustes al modelo de dominio al implementarlo | - | aceptada, **validar con el mentor** |
| ADR-009 | Identificadores del dominio en espanol (lenguaje ubicuo) | - | aceptada |
| ADR-010 | Proteccion de datos personales | Structured Logging (6.1) | aceptada |
| ADR-011 | API v1 segun la convencion REST y documentada con OpenAPI | Request-Reply (2.3) | aceptada |
| ADR-012 | SurrealDB como fuente de verdad, detras de un repositorio | Repository | aceptada, **validar con el mentor** |

Patrones del catalogo que **no** se usan y por que: Database per Service, API Gateway y BFF (un solo cliente y un solo backend; el catalogo lo indica asi para el MVP), Strangler Fig (no hay sistema legado), CQRS y Event Sourcing (el historial es un CRUD simple; no hay requisito de auditoria completa). Se revisaran si crece el volumen o aparecen nuevos clientes.

---

## ADR-001: App movil con Expo (React Native) y NativeWind

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-07

### Contexto
Dos personas desarrollan; la app debe servir en iOS y Android; el template de interfaz elegido (Luna) esta hecho en Expo.

### Decision
Expo SDK 54 con React Native, expo-router para la navegacion y NativeWind (Tailwind) para los estilos. La misma base de codigo corre en web, lo que permite probar sin celular.

### Alternativas (comparadas al justificar)
- **Flutter:** una sola base de codigo tambien, pero obliga a aprender Dart y no aprovecha el template ya comprado.
- **Nativo (Swift y Kotlin):** mejor acceso al dispositivo, pero son dos desarrollos para un equipo de dos.
- **Web responsiva (PWA):** mas simple, pero el microfono, la voz y la experiencia movil son mas limitados.

### Consecuencias
Se prueba en Expo Go sin compilar. El reconocimiento de voz nativo y las notificaciones pueden requerir un "development build" mas adelante.

## ADR-002: Backend monolitico en Node.js con Express, API REST sincrona

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-07, DRV-08 · **Patron:** Request-Reply

### Contexto
Un solo cliente (la app) y un equipo pequeno. La traduccion es "bajo demanda con respuesta inmediata esperada por el usuario", el caso de uso que el catalogo asigna a Request-Reply.

### Decision
Monolito modular en Node.js 22 con Express: rutas por recurso, reglas en `src/lib`, API REST sincrona. Mismo lenguaje (JavaScript/TypeScript) que la app.

### Alternativas (comparadas al justificar)
- **Microservicios** (traduccion aparte): el catalogo los reserva para despliegue y escalado independientes; aqui solo agregan complejidad.
- **WebSocket o streaming:** el catalogo lo menciona para tiempo real estricto; como la traduccion es por turno (ver `contexto.md`), REST basta. Si se pasa a traduccion simultanea, se revisa.
- **Python (FastAPI):** buena opcion para IA, pero agrega otro lenguaje; la IA se consume por HTTP (Ollama, Anthropic), no se entrena aqui.
- **Java (Spring Boot):** robusto, pero mucho mas pesado para este alcance.

### Consecuencias
Un solo lenguaje en todo el proyecto. Si crece, el modulo de traduccion se puede separar sin cambiar el contrato de la API.

## ADR-003: SQLite como base de datos inicial

**Fecha:** 2026-10-14 · **Estado:** reemplazada por ADR-012 el 2026-10-15 (SQLite sigue como motor de las pruebas sin servidor) · **Responde a:** DRV-04, DRV-08

### Contexto
Hace falta persistir usuarios, conversaciones y mensajes con integridad referencial, y que cualquiera pueda correr el proyecto sin instalar un servidor de base de datos.

### Decision
SQLite con `node:sqlite` (incluido en Node 22) y solo consultas parametrizadas. El esquema sigue el modelo de dominio (`backend/src/db.js`). Las pruebas usan base en memoria.

### Alternativas (comparadas al justificar)
- **PostgreSQL:** mejor para produccion y concurrencia; es el siguiente paso (F10).
- **MySQL:** similar a PostgreSQL, sin ventaja para este caso.
- **MongoDB:** no encaja con un modelo tan relacional (combinaciones unicas, relaciones muchos a muchos).
- **ORM (Prisma, Sequelize):** util con muchas entidades; con 11 tablas y consultas simples, las consultas parametrizadas cumplen la regla de seguridad sin otra dependencia.

### Consecuencias
Instalacion cero. Para produccion hay que migrar a PostgreSQL; el SQL es estandar, asi que el cambio es acotado. `node:sqlite` aun es experimental en Node 22.

## ADR-004: Traduccion con Qwen local, Claude Sonnet de respaldo y motor de reglas

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-01, DRV-02, DRV-05, DRV-06, DRV-08 · **Patron:** Circuit Breaker con degradacion aceptable

### Contexto
El valor de TalkLate es traducir conservando tono, intencion y modismos; un traductor literal no lo logra. El equipo decidio usar **Qwen corriendo local** por ahora y volver a **Claude Sonnet** si no funciona.

### Decision
Una fachada (`backend/src/lib/traductor.js`) prueba los motores en orden: **Qwen** servido por Ollama en el servidor de TalkLate, luego **Claude Sonnet** (API de Anthropic, si hay clave) y por ultimo un **motor de reglas** espanol/ingles con modismos y variantes por pais. Los dos modelos reciben el mismo prompt (equivalente cultural segun la region destino; devuelven tono, region de origen y nota cultural).
Es el patron **Circuit Breaker** del catalogo: si un motor falla, se "abre" durante un minuto (no se le vuelve a llamar) y el sistema **degrada** al siguiente; el catalogo menciona justamente "traduccion literal como degradacion aceptable", que es el papel del motor de reglas. No se usa Retry con backoff dentro de una misma peticion porque el usuario esta esperando: se prefiere pasar de inmediato al siguiente motor.

### Alternativas (comparadas al justificar)
- **DeepL o Google Translate:** buena calidad literal, pero no explican ni adaptan modismos por region.
- **Solo Claude:** mejor calidad esperada, pero costo por mensaje, dependencia de internet y los mensajes salen a un tercero.
- **Solo motor de reglas:** gratis y rapido, pero no escala a mas idiomas ni a jerga nueva.
- **Otros modelos abiertos de traduccion (NLLB, Argos):** traducen frases, pero no siguen instrucciones de tono ni explican modismos.

### Consecuencias
Qwen local no cuesta por mensaje y no envia datos a terceros (DRV-03, DRV-06), pero necesita un servidor con Ollama y el modelo descargado; su velocidad depende de ese equipo. Qwen corre en el **servidor**, no en el celular. La medicion real de tiempo y calidad se hace con `npm run medir` (DRV-01, DRV-02).

## ADR-005: Voz: dictado en el cliente y expo-speech para la salida

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-07

### Contexto
El usuario habla y escucha la traduccion. Transcribir audio en el servidor exige otro servicio y subir audio (dato personal).

### Decision
El dictado se hace en el cliente (reconocimiento de voz del navegador en web; teclado del sistema en celular) y llega como texto con `canal: "voz"`. La traduccion se escucha con `expo-speech`, ajustando tono y velocidad segun la entonacion detectada.

### Alternativas (comparadas al justificar)
- **Whisper u otro servicio de transcripcion en el servidor:** mas preciso y uniforme, y permitiria analizar el acento por el sonido; pero sube audio y requiere mas infraestructura.
- **Reconocimiento nativo dentro de la app:** requiere un development build de Expo.

### Consecuencias
Sin costos extra y sin subir audio. Por eso el acento se reconoce por el vocabulario, no por el sonido (ver `contexto.md`). Transcripcion en servidor queda como evolucion.

## ADR-006: Autenticacion con JWT de acceso corto y token de refresco rotativo

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-03 · **Patron:** Token-Based Authentication

### Contexto
Usuario-RN-5 y RN-10, y `convenciones/seguridad.md`: "tokens con expiracion (access corto, refresh mas largo)". El catalogo advierte que los JWT "no son revocables sin infraestructura adicional".

### Decision
Token de acceso JWT de 15 minutos y token de refresco de 30 dias guardado solo como hash, que se rota en cada uso. Esa es la "infraestructura adicional": al cerrar sesion se revocan el token de acceso (lista de revocados) y el de refresco; al cambiar la contrasena se cierran las demas sesiones. Contrasenas con bcrypt, limite de intentos y codigo de recuperacion de un solo uso.

### Alternativas (comparadas al justificar)
- **Sesiones en servidor:** revocacion trivial, pero guardan estado por sesion; JWT es lo que el catalogo recomienda para una app movil.
- **Proveedor externo (Firebase Auth, Auth0):** menos codigo propio, pero depende de un tercero y saca datos personales del sistema.

### Consecuencias
La app renueva la sesion sola. El envio real del codigo por correo esta pendiente (en desarrollo se devuelve en la respuesta).

## ADR-007: Interfaz basada en el template Luna

**Fecha:** 2026-10-14 · **Estado:** aceptada

### Contexto
El equipo adquirio el template Luna (chatbot) para no disenar la interfaz desde cero.

### Decision
Se conservo su sistema de componentes y tema (claro y oscuro) y se reemplazaron sus vistas por las de TalkLate; se retiraron componentes y dependencias sin uso. El template original queda en `componentes/template/native-luna`.

### Consecuencias
Interfaz consistente y rapida de construir. El mapeo etapa del journey -> pantalla esta en `componentes/especificacion_vistas_ui.md`.

## ADR-008: Ajustes al modelo de dominio al implementarlo

**Fecha:** 2026-10-14 · **Estado:** aceptada, **validar con el mentor** · **Responde a:** DRV-04

### Contexto
Al implementar aparecieron diferencias con el modelo de dominio enriquecido.

### Decision
1. **Lenguaje - Region muchos a muchos** (`LenguajeRegion`): Conversacion-RN-1 pide validar que la region sea valida para el idioma, y un idioma se habla en varias regiones. Asi el nombre del lenguaje puede seguir siendo unico.
2. **Tablas de soporte** (`reporte`, `token_refresco`, `sesion_revocada`, `recuperacion`): no son objetos de dominio (el mentor dijo que los reportes son dinamicos), pero el sistema las necesita.
3. **Usuario** gana `contrasena` (hash), `rol` y `consentimientoDatos`; **MensajeDestino.mensajeOriginal** pasa a ser referencia.

### Consecuencias
`arquitectura/modelo_datos.md` ya refleja estos cambios; falta actualizar el Excel del modelo enriquecido y el MER.

## ADR-009: Identificadores del dominio en espanol (lenguaje ubicuo)

**Fecha:** 2026-10-14 · **Estado:** aceptada

### Contexto
La regla transversal 1 de F0 pedia identificadores en ingles, pero todo el descubrimiento (modelo de dominio, reglas de negocio, historias) esta en espanol: Usuario, Conversacion, MensajeOriginal, Conversacion-RN-2...

### Decision
Usar en el codigo los mismos nombres del modelo de dominio, en espanol (lenguaje ubicuo de Domain-Driven Design): tablas `conversacion`, `mensaje_original`; funciones `traducir`, `validarNombreConversacion`. Los terminos tecnicos y de librerias quedan en ingles. Se actualizo la regla en `convenciones/README.md`.

### Alternativas (comparadas al justificar)
- **Todo en ingles:** es la practica comun, pero obliga a traducir cada concepto y rompe la trazabilidad con el modelo de dominio y las reglas de negocio.

### Consecuencias
Trazabilidad directa: una regla como Conversacion-RN-2 se encuentra en el codigo con el mismo nombre. Mezcla de idiomas en el codigo (dominio en espanol, framework en ingles).

## ADR-010: Proteccion de datos personales

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-03 · **Patron:** Structured Logging

### Contexto
TalkLate guarda conversaciones personales (PII segun `convenciones/seguridad.md`) y opera en Colombia (Ley 1581 de 2012).

### Decision
- Matriz de sensibilidad (`requerimientos/matriz_sensibilidad_datos.md`).
- Consentimiento obligatorio al registrarse y politica de tratamiento de datos.
- Eliminar la cuenta con todos sus datos (derecho al olvido).
- Contenido de mensajes **cifrado en reposo** con AES-256-GCM (clave por variable de entorno).
- Logs JSON que nunca guardan correo, contrasena, tokens, codigos ni contenido (patron Structured Logging, obligatorio en el catalogo).
- CORS con origenes explicitos y limites de uso, en especial sobre la traduccion.

### Alternativas (comparadas al justificar)
- **Cifrar toda la base** (SQLCipher): protege todo, pero agrega una dependencia nativa; se deja para produccion junto con el cifrado del proveedor.

### Consecuencias
Busquedas por contenido de mensajes no son posibles en la base (hoy no se necesitan). Sin la clave no se pueden leer los mensajes.

## ADR-011: API v1 segun la convencion REST y documentada con OpenAPI

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Patron:** Request-Reply

### Contexto
`convenciones/api-rest.md` define versionado, formato de error, codigos, paginacion, health check y OpenAPI.

### Decision
Base `/api/v1`; errores `{ statusCode, error, message, timestamp, path }`; `201` con `Location`; `204` al eliminar; `422` para reglas de negocio; listas `{ data, pagination }`; `GET /health`; contrato en `backend/openapi.yaml` con Swagger UI en `/api/v1/docs`.
Los campos de las respuestas usan los nombres del dominio en snake_case (por ejemplo `fecha_inicio`) y `id`, para coincidir con las columnas (ADR-009); el ejemplo `identificador`/`fechaCreacion` de la convencion se toma como ilustrativo.

### Consecuencias
Contrato claro para la app y para pruebas; cambios incompatibles van en `/api/v2`.

## ADR-012: SurrealDB como fuente de verdad, detras de un repositorio

**Fecha:** 2026-10-15 · **Estado:** aceptada, validar con el mentor · **Reemplaza:** ADR-003 · **Responde a:** DRV-01, DRV-03, DRV-04, DRV-08

### Contexto
ADR-003 dejo SQLite como base inicial y anoto que para produccion habia que pasar a un servidor de base de datos. Julian construyo el cambio (PR #29): el modelo de dominio tiene muchas relaciones (conversacion, lenguaje por conversacion, mensaje original y destino, reporte) y combinaciones unicas que se querian expresar directo en la base.

### Decision
- **SurrealDB 3.x** es la fuente de verdad del backend. El esquema esta en `backend/db/surreal/schema.surql` (SCHEMAFULL) y se aplica al arrancar.
- Las relaciones son enlaces nativos (`record<...>`); las combinaciones unicas son indices `UNIQUE`; los valores permitidos (rol, estado, remitente) son `ASSERT` en el campo.
- El acceso a datos pasa por un **repositorio** con la misma interfaz para dos motores: `src/repos/surreal.js` (ejecucion) y `src/repos/sqlite.js` (pruebas sin servidor). Las rutas no conocen el motor; `DB_DRIVER` elige cual usar.
- La conexion es por HTTP (`/sql`) sin dependencias nuevas. Se entra una vez con `/signin` y se reutiliza el token; los valores se escriben como literales serializados (`lit`, `rid`), nunca concatenando texto del usuario.

### Alternativas (comparadas al justificar)
- **Seguir con SQLite:** instalacion cero, pero es un archivo local; para varios usuarios a la vez y para produccion habia que cambiarla igual.
- **PostgreSQL:** muy maduro y era el paso previsto en ADR-003; las relaciones se modelan con llaves foraneas y JOIN. Se eligio SurrealDB porque los enlaces entre registros siguen el modelo de dominio sin tablas intermedias de mas y el esquema con ASSERT deja reglas del dominio en la base.
- **SDK oficial de SurrealDB:** mas comodo, pero agrega una dependencia; el endpoint HTTP basta para estas consultas.

### Consecuencias
- Hay que levantar un servidor SurrealDB 3.x para usar la app (`backend/README-surreal.md`). Con la 2.x el esquema no carga; el backend lo revisa al arrancar.
- Mandar usuario y clave en cada consulta costaba unos 35 ms por consulta (unos 420 ms por mensaje); con el token de sesion bajo a unos 28 ms por mensaje. Sigue por encima de SQLite (unos 7 ms), pero muy lejos del limite de 3 s de DRV-01.
- La renovacion de la sesion revoca el token de refresco en un solo paso (`tokens.consumir`), porque con un servidor dos pedidos pueden llegar al mismo tiempo.
- CI corre la suite de la API contra los dos motores (job `backend-surreal`).
- En produccion son obligatorias `SURREAL_USER` y `SURREAL_PASS` (no se acepta root/root).
- Pendiente: algunas consultas filtran recorriendo enlaces (por ejemplo mensajes de una conversacion) y no aprovechan indices; con muchos datos hay que revisarlas.

