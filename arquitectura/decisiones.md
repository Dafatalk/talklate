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
| ADR-009 | Identificadores del dominio en espanol (lenguaje ubicuo) | - | aceptada (excepcion: esquema de SurrealDB en ingles, ver ADR-012) |
| ADR-010 | Proteccion de datos personales | Structured Logging (6.1) | aceptada |
| ADR-011 | API v1 segun la convencion REST y documentada con OpenAPI | Request-Reply (2.3) | aceptada |
| ADR-012 | SurrealDB como fuente de verdad, detras de un repositorio (esquema en ingles, instancia remota) | Repository | aceptada (decision cerrada el 2026-10-23; PostgreSQL descartado) |
| ADR-013 | Arquitectura hexagonal (puertos y adaptadores) dentro del monolito modular | Puertos y adaptadores | aceptada |

Patrones del catalogo que **no** se usan y por que: Database per Service, API Gateway y BFF (un solo cliente y un solo backend; el catalogo lo indica asi para el MVP), Strangler Fig (no hay sistema legado), CQRS y Event Sourcing (el historial es un CRUD simple; no hay requisito de auditoria completa). Se revisaran si crece el volumen o aparecen nuevos clientes.

---

## ADR-001: App movil con Expo (React Native) y NativeWind

**Fecha:** 2026-10-14 · **Estado:** aceptada · **Responde a:** DRV-07

### Contexto
Dos personas desarrollan; la app debe servir en iOS y Android; el template de interfaz elegido (Luna) esta hecho en Expo.

### Decision
Expo con React Native, expo-router para la navegacion y NativeWind (Tailwind) para los estilos. Se empezo con el SDK 54 y el 15/10/2026 se paso al SDK 57 para que la app abra en la version actual de Expo Go (PR #31). La misma base de codigo corre en web, lo que permite probar sin celular.

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
Monolito modular en Node.js 22 con Express: rutas por recurso y reglas separadas de HTTP (desde ADR-013, en capas hexagonales: `src/dominio`, `src/aplicacion`, `src/adaptadores`), API REST sincrona. Mismo lenguaje (JavaScript/TypeScript) que la app.

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
SQLite con `node:sqlite` (incluido en Node 22) y solo consultas parametrizadas. El esquema sigue el modelo de dominio (`backend/src/adaptadores/persistencia/sqlite/esquema.js`). Las pruebas usan base en memoria.

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
Una fachada (`backend/src/aplicacion/traduccion.js`) prueba los motores en orden: **Qwen** servido por Ollama en el servidor de TalkLate, luego **Claude Sonnet** (API de Anthropic, si hay clave) y por ultimo un **motor de reglas** espanol/ingles con modismos y variantes por pais. Los dos modelos reciben el mismo prompt (equivalente cultural segun la region destino; devuelven tono, region de origen y nota cultural).
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
Excepcion (2026-10-15): el esquema de SurrealDB usa nombres en ingles para alinearse con el modelo de dominio en ingles; la traduccion de nombres queda encerrada en el adaptador (ver ADR-012).

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

**Fecha:** 2026-10-15 · **Estado:** aceptada (decision cerrada el 2026-10-23) · **Reemplaza:** ADR-003 · **Responde a:** DRV-01, DRV-03, DRV-04, DRV-08

### Contexto
ADR-003 dejo SQLite como base inicial y anoto que para produccion habia que pasar a un servidor de base de datos. Julian construyo el cambio (PR #29): el modelo de dominio tiene muchas relaciones (conversacion, lenguaje por conversacion, mensaje original y destino, reporte) y combinaciones unicas que se querian expresar directo en la base.

### Decision
- **SurrealDB 3.x** es la fuente de verdad del backend. El esquema esta en `backend/db/surreal/schema.surql` (SCHEMAFULL) y se aplica al arrancar.
- Las relaciones son enlaces nativos (`record<...>`); las combinaciones unicas son indices `UNIQUE`; los valores permitidos (rol, estado, remitente) son `ASSERT` en el campo.
- El acceso a datos pasa por un **repositorio** con la misma interfaz para dos motores: `src/adaptadores/persistencia/surreal/repositorio.js` (ejecucion) y `src/adaptadores/persistencia/sqlite/repositorio.js` (pruebas sin servidor). Las rutas no conocen el motor; `DB_DRIVER` elige cual usar.
- La conexion es por HTTP (`/sql`) sin dependencias nuevas. Se entra una vez con `/signin` y se reutiliza el token; los valores se escriben como literales serializados (`lit`, `rid`), nunca concatenando texto del usuario.

### Alternativas (comparadas al justificar)
- **Seguir con SQLite:** instalacion cero, pero es un archivo local; para varios usuarios a la vez y para produccion habia que cambiarla igual.
- **PostgreSQL:** muy maduro y era el paso previsto en ADR-003; las relaciones se modelan con llaves foraneas y JOIN. Se eligio SurrealDB porque los enlaces entre registros siguen el modelo de dominio sin tablas intermedias de mas y el esquema con ASSERT deja reglas del dominio en la base.
- **SDK oficial de SurrealDB:** mas comodo, pero agrega una dependencia; el endpoint HTTP basta para estas consultas.

### Consecuencias
- Hace falta un servidor SurrealDB 3.x: el remoto para usar la app, o uno local para las pruebas (`backend/README-surreal.md`). Con la 2.x el esquema no carga; el backend lo revisa al arrancar.
- Mandar usuario y clave en cada consulta costaba unos 35 ms por consulta (unos 420 ms por mensaje); con el token de sesion bajo a unos 28 ms por mensaje. Sigue por encima de SQLite (unos 7 ms), pero muy lejos del limite de 3 s de DRV-01.
- La renovacion de la sesion revoca el token de refresco en un solo paso (`tokens.consumir`), porque con un servidor dos pedidos pueden llegar al mismo tiempo.
- CI corre la suite de la API contra los dos motores (job `backend-surreal`).
- En produccion son obligatorias `SURREAL_USER` y `SURREAL_PASS` (no se acepta root/root).
- Pendiente: algunas consultas filtran recorriendo enlaces (por ejemplo mensajes de una conversacion) y no aprovechan indices; con muchos datos hay que revisarlas.

### Decision final del 2026-10-23: se mantiene SurrealDB
La revision critica del 22/10 propuso reconsiderar PostgreSQL (`revision_recomendaciones.md`, punto 5). El equipo comparo las dos opciones contra lo que pide TalkLate y decidio **mantener SurrealDB**. Las razones:

1. **El dominio es una cadena de relaciones y SurrealDB las guarda como enlaces nativos.** Conversacion -> idioma de la conversacion -> mensaje original -> mensaje traducido -> reporte. Cada campo `record<...>` apunta directo al registro relacionado, y una consulta lo recorre sin JOIN. Ejemplo real del adaptador: para saber si una traduccion es del usuario se escribe `mensaje_original.lenguaje_conversacion.conversacion.usuario = $usuario` en una sola expresion (REQ-CONV-007, REQ-REP-001).
2. **Las reglas del dominio tambien viven en la base (defensa en profundidad).** El esquema es SCHEMAFULL: las combinaciones unicas que pidio el mentor son indices `UNIQUE` (correo, nombre y codigo de idioma, region dentro del pais, un reporte por traduccion y usuario); los valores permitidos son `ASSERT` (rol, estado del reporte, remitente, estado de entrega); y hay validaciones de formato y longitud (correo con `string::is_email`, nombre de conversacion de 3 a 80 caracteres). Si un error en la API dejara pasar un dato invalido, la base lo rechaza.
3. **Es multimodelo, y eso encaja con lo que viene sin agregar otra base.** Los reportes son dinamicos, segun el mentor (sin estructura fija): SurrealDB admite campos flexibles junto a tablas estrictas. La evolucion prevista, usar los reportes y un glosario de modismos para mejorar la traduccion, puede apoyarse en sus indices vectoriales (HNSW) y en relaciones de grafo (`RELATE`) para equivalencias entre regiones, todo en la misma base.
4. **Gestionada y con control de acceso fino.** SurrealDB Cloud evita instalar y operar un servidor de base de datos, algo importante para un equipo de dos personas. SurrealDB permite crear usuarios con permisos limitados a un namespace o a una base; el backend usa un usuario de base propio y no el root (minimo privilegio, ADR-010; confirmar que sus permisos queden limitados a `talklate/app`).
5. **Ya esta construida y probada.** Funciona contra una instancia real y CI corre la suite de la API contra SurrealDB en cada cambio.

Ademas, es la base que recomendo el mentor. Esa recomendacion respalda la decision, pero lo que la sostiene son las razones de arriba.

**Lo que se acepta a cambio (y como se maneja):**
- Es mas joven que PostgreSQL y su comunidad es menor. Se usa la version 3.x fija en CI, y el acceso a datos queda aislado detras del puerto `Repositorio` (ADR-013): si algun dia hubiera que cambiar de base, seria un adaptador nuevo y no una reescritura.
- No se usan consultas preparadas como en SQL: el adaptador nunca concatena texto del usuario; todo valor pasa por `lit`/`rid` y hay pruebas de inyeccion (comillas, saltos de linea, `"; DELETE ...`).
- Las consultas que recorren enlaces no usan indices: se revisan con mas datos y se agregan indices donde haga falta.

**Como explicarlo en la sustentacion:** "Elegimos SurrealDB porque nuestro dominio es una cadena de relaciones (conversacion, mensajes, traducciones, reportes) que guarda como enlaces nativos, porque nos deja poner las reglas del dominio en el propio esquema y porque, al ser multimodelo, soporta lo que viene (reportes flexibles, busqueda vectorial de modismos) sin agregar otra base. Su riesgo, ser una tecnologia mas joven, lo controlamos con la arquitectura hexagonal: la base esta detras de un puerto y se puede cambiar sin tocar las reglas."

### Ajuste del 2026-10-15 (PR #30)
- **Esquema en ingles:** las tablas y campos de SurrealDB estan en ingles (`user`, `conversation`, `original_message`, `translated_message`...), alineados con el modelo de dominio en ingles de `seguimiento/follow-up/modelo_dominio/`. Es una excepcion a ADR-009 solo para la base: la API, el codigo y los valores de los enumerados (`origen`/`destino`, `abierto`...) siguen en espanol, y el adaptador (`src/adaptadores/persistencia/surreal/repositorio.js`) traduce los nombres en cada consulta.
- **Instancia remota:** la app usa por defecto una instancia de SurrealDB Cloud; las credenciales van en `backend/.env` (fuera del repo). Las pruebas y CI usan un SurrealDB local para no crear ni borrar datos en el remoto.

## ADR-013: Arquitectura hexagonal (puertos y adaptadores) dentro del monolito modular

**Fecha:** 2026-10-23 · **Estado:** aceptada · **Complementa:** ADR-002, ADR-004, ADR-012 · **Responde a:** DRV-04, DRV-05, DRV-08

### Contexto
La revision de arquitectura del 22/10/2026 (`seguimiento/bitacora.md`) confirmo que el monolito modular es la decision correcta (ADR-002), pero senalo que su modularidad no era explicita: las rutas HTTP mezclaban reglas de negocio, acceso a datos y cifrado, y la fachada de traduccion conocia cada motor por su nombre. La pregunta "y si manana crece?" debe poder responderse sin partir el sistema en microservicios. El mentor tambien pidio revisar capas y separacion de responsabilidades.

### Decision
Organizar la API en capas de **puertos y adaptadores** (Alistair Cockburn), sin cambiar su contrato:
- **Dominio** (`src/dominio`): validaciones, errores de negocio y analisis de texto. No depende de nada externo.
- **Aplicacion** (`src/aplicacion`): un caso de uso por epica (cuentas, sesiones, conversaciones, traduccion, catalogo, reportes). Solo importa el dominio y los puertos.
- **Puertos** (`src/puertos`): contratos `Repositorio`, `MotorTraduccion`, `Notificador` y `Cifrador`, verificados al arrancar.
- **Adaptadores** (`src/adaptadores`): de entrada, HTTP con Express; de salida, SurrealDB y SQLite, Qwen, Claude y reglas, correo y AES-GCM.
- **Composicion** (`src/composicion.js`): unico lugar que conoce los adaptadores concretos; los elige segun el entorno y arma los casos de uso.

El subsistema de traduccion queda detras del puerto `MotorTraduccion`: el caso de uso aplica el Circuit Breaker (ADR-004) sobre cualquier lista de motores, sin saber cuales son.

### Alternativas (comparadas al justificar)
- **Dejar el monolito como estaba:** funciona, pero las reglas viven en las rutas y cambiar un motor o la base obliga a tocar varios archivos.
- **Microservicios (traduccion aparte):** limites claros, pero agrega red, despliegue y fallas distribuidas que un equipo de dos no necesita (ADR-002).
- **Capas clasicas (controlador, servicio, repositorio) sin puertos:** separa responsabilidades, pero el servicio sigue dependiendo de implementaciones concretas.
- **Clean Architecture completa con un framework de inyeccion de dependencias:** mas ceremonia y dependencias para el mismo resultado; aqui la composicion manual basta.

### Consecuencias
- Limites claros sin el costo distribuido: cambiar de base de datos (por ejemplo a PostgreSQL) o agregar un motor es escribir un adaptador nuevo; los casos de uso no cambian.
- El caso de uso de traduccion y el Circuit Breaker se prueban con motores falsos, sin red ni HTTP (`test/motores.test.js`).
- Un adaptador incompleto falla al arrancar (`asegurarPuerto`), no a mitad de una peticion.
- Mas archivos y una indireccion mas. El contrato de la API, la base y las pruebas de punta a punta no cambiaron (las mismas 16 pruebas de la API pasan con SQLite y con SurrealDB).
- Los nombres siguen ADR-009 (dominio en espanol).


## ADR-014: Voz en Expo Go con grabacion en el celular, Whisper en el servidor y entonacion por texto y voz

**Estado:** Aceptada (23/10/2026). Reemplaza la parte de ADR-005 que usaba el dictado del teclado.

**Contexto:** En Expo Go no hay reconocimiento de voz nativo; el boton "hablar" solo mostraba "Toca el microfono del teclado para dictar". Ademas la traduccion debe sonar con la misma entonacion de quien habla.

**Decision:**
- La app graba con `expo-audio` (funciona en Expo Go) y mide el volumen cada 100 ms.
- El audio va en base64 a `POST /api/v1/conversaciones/:id/mensajes/voz`. El nuevo puerto `Transcriptor` lo pasa a texto con un adaptador Whisper (API compatible con OpenAI `/v1/audio/transcriptions`: faster-whisper/speaches o whisper.cpp locales). Variables: `TRANSCRIPCION_URL`, `TRANSCRIPCION_MODELO`.
- `dominio/prosodia.js` saca el tono de la voz (volumen, variacion y palabras por segundo). El tono del texto manda salvo que sea Neutral; la descripcion de la prosodia va al prompt del LLM y `entrega.ritmo_voz` ajusta la velocidad de la voz de salida.
- La interfaz tiene dos modos, como ChatGPT: la burbuja animada del template Luna (AiCircle) y el chat. El modo se recuerda en el celular.

**Consecuencias:** Se necesita un servidor Whisper (se recomienda el modelo `small`; `tiny` confunde jerga como "parce"). Sin `TRANSCRIPCION_URL` el endpoint de voz responde 503 y el texto sigue funcionando.
