# Decisiones de Arquitectura - TalkLate

**Fase 3 - Arquitectura de Software & Base de Datos**

**Estado:** primero se construyo y ahora se justifica, como acordamos con Farid: las decisiones ya estan tomadas en el codigo y este documento las sustenta. Estado **tomada, justificacion por completar**: antes de la sustentacion hay que completar con las alternativas que el equipo si evaluo o descarto y dejar claro por que. Los drivers estan en `drivers.md`.

| ADR | Decision | Estado |
| --- | --- | --- |
| ADR-001 | App movil con Expo (React Native) y NativeWind | tomada, justificacion por completar |
| ADR-002 | Backend en Node.js con Express | tomada, justificacion por completar |
| ADR-003 | SQLite como base de datos inicial | tomada, justificacion por completar |
| ADR-004 | Traduccion con Claude y motor local de respaldo | tomada, justificacion por completar |
| ADR-005 | Voz: dictado en el cliente y voz de salida con expo-speech | tomada, justificacion por completar |
| ADR-006 | Autenticacion con JWT, revocacion en servidor y bcrypt | tomada, justificacion por completar |
| ADR-007 | Interfaz basada en el template Luna | tomada, justificacion por completar |
| ADR-008 | Cambios al modelo de dominio al implementarlo | tomada, justificacion por completar |

---

## ADR-001: App movil con Expo (React Native) y NativeWind

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-07

### Contexto
Dos personas desarrollan y la app debe servir en iOS y Android; el template de interfaz elegido (Luna) ya esta hecho en Expo.

### Decision
Usar Expo SDK 54 con React Native, expo-router para la navegacion y NativeWind (Tailwind) para los estilos. La misma base de codigo corre en web, lo que permite probar sin celular.

### Alternativas
- **Flutter:** una sola base de codigo tambien, pero obliga a aprender Dart y no aprovecha el template.
- **Nativo (Swift y Kotlin):** mejor acceso al dispositivo, pero son dos desarrollos.
- **Web responsiva (PWA):** mas simple, pero el microfono y la experiencia movil son mas limitados.

### Consecuencias
Se puede probar en Expo Go sin compilar. El reconocimiento de voz nativo y las notificaciones pueden requerir un "development build" mas adelante.

## ADR-002: Backend en Node.js con Express

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-07, DRV-08

### Contexto
La app esta en JavaScript/TypeScript y el equipo es pequeno.

### Decision
API REST con Node.js 22 y Express, en JavaScript. Las rutas siguen `convenciones/api-rest.md`; las reglas de negocio estan separadas en `src/lib/validaciones.js`.

### Alternativas
- **NestJS o TypeScript puro:** mas estructura, mas codigo inicial.
- **Python (FastAPI):** buena opcion para IA, pero agrega otro lenguaje al equipo.
- **Java (Spring Boot):** robusto, pero mucho mas pesado para este alcance.

### Consecuencias
Un solo lenguaje en todo el proyecto. Si el proyecto crece conviene pasar a TypeScript.

## ADR-003: SQLite como base de datos inicial

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-04, DRV-08

### Contexto
Hace falta persistir usuarios, conversaciones y mensajes con integridad referencial, y que cualquiera pueda correr el proyecto sin instalar un servidor de base de datos.

### Decision
SQLite mediante `node:sqlite` (incluido en Node 22). El esquema sigue el modelo de dominio y vive en `backend/src/db.js`. Las pruebas usan base en memoria.

### Alternativas
- **PostgreSQL:** mejor para produccion y para varios usuarios a la vez; es el siguiente paso natural.
- **MySQL:** similar a PostgreSQL.
- **MongoDB:** no encaja con un modelo tan relacional.

### Consecuencias
Instalacion cero. Para produccion habra que migrar a PostgreSQL; las consultas son SQL estandar, asi que el cambio es acotado. `node:sqlite` aun es experimental.

## ADR-004: Traduccion con Claude y motor local de respaldo

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-01, DRV-02, DRV-05, DRV-06, DRV-08

### Contexto
El valor de TalkLate es traducir conservando tono, intencion y modismos. Un traductor literal no lo logra.

### Decision
Una fachada (`traductor.js`) con dos motores: **Claude** (API de Anthropic) con un prompt que pide equivalente cultural segun la region destino y devuelve tono, region de origen y una nota cultural; y un **motor local** espanol/ingles con modismos y variantes por pais, usado sin clave o si Claude falla. El idioma, el tono y la region de origen tambien se estiman con reglas locales.

### Alternativas
- **DeepL o Google Translate:** buena calidad literal, pero no explican ni adaptan modismos por region.
- **Modelo abierto propio (por ejemplo Argos o NLLB):** sin costo por uso, pero poca calidad con jerga y mas infraestructura.
- **Solo motor local:** gratis y rapido, pero no escala a mas idiomas ni a jerga nueva.

### Consecuencias
La calidad real depende de Claude y tiene costo por mensaje (DRV-06). El motor local sirve para demostrar y probar sin clave, no para produccion. Falta medir la latencia real (DRV-01).

## ADR-005: Voz: dictado en el cliente y expo-speech para la salida

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-07

### Contexto
El usuario habla y escucha la traduccion. Transcribir audio en el servidor exige un servicio adicional y subir audio.

### Decision
El dictado se hace en el cliente (reconocimiento de voz del navegador en web; teclado del sistema en celular) y llega como texto con `canal: "voz"`. La traduccion se escucha con `expo-speech`, ajustando tono y velocidad segun la entonacion detectada.

### Alternativas
- **Whisper u otro servicio de transcripcion en el servidor:** mas preciso y uniforme, pero sube audio (privacidad) y cuesta.
- **Reconocimiento nativo dentro de la app:** requiere un development build.

### Consecuencias
Funciona sin costos extra. La voz en celular depende del teclado. Pendiente: reconocimiento nativo o transcripcion en servidor y validar formato y duracion del audio (Conversacion-RN-4).

## ADR-006: Autenticacion con JWT, revocacion en servidor y bcrypt

**Fecha:** 2026-10-14 · **Estado:** tomada · **Responde a:** DRV-03

### Contexto
Usuario-RN-5 y RN-10: iniciar sesion y cerrar sesion invalidando el token.

### Decision
Tokens JWT de 7 dias con identificador. Al cerrar sesion el identificador se guarda como revocado y deja de servir. Contrasenas con bcrypt. Limite de intentos fallidos por correo. Codigo de recuperacion de 6 digitos con hash y vigencia de 15 minutos.

### Alternativas
- **Sesiones en servidor:** revocacion trivial, pero obliga a guardar estado por sesion.
- **Proveedor externo (Firebase Auth, Auth0):** menos codigo propio, pero depende de un tercero.

### Consecuencias
Cada peticion consulta si el token fue revocado. El envio real del codigo por correo esta pendiente: en desarrollo se imprime en el log.

## ADR-007: Interfaz basada en el template Luna

**Fecha:** 2026-10-14 · **Estado:** tomada

### Contexto
El equipo compro el template Luna (chatbot) para no disenar la interfaz desde cero.

### Decision
Se conservo su sistema de componentes y tema (Header, Button, Chip, Input, ThemedText, claro y oscuro) y se reemplazaron sus vistas por las de TalkLate. Se retiraron los componentes y dependencias que no se usan (mapas, graficas, calendarios, etc.). El template original queda en `componentes/template/native-luna`.

### Consecuencias
La interfaz es consistente y rapida de construir. Las pantallas de TalkLate estan en `frontend/app` y `frontend/components/talklate`.

## ADR-008: Cambios al modelo de dominio al implementarlo

**Fecha:** 2026-10-14 · **Estado:** tomada, **validar con el mentor** · **Responde a:** DRV-04

### Contexto
Al implementar aparecieron dos diferencias con `modelo_datos.md`.

### Decision
1. Un idioma puede tener varias regiones y una region varios idiomas (tabla `lenguaje_region`), porque Conversacion-RN-1 pide validar que la region sea valida para el idioma. El modelo actual deja una sola region por lenguaje.
2. Se agrego la tabla `reporte` (mensaje reportado, motivo, estado), porque el reporte de mala traduccion necesita guardarse. El mentor comento que los reportes son dinamicos y no hacen parte del modelo de dominio inicial; aqui es solo una tabla de apoyo.

### Consecuencias
Si el mentor prefiere el modelo original, hay que ajustar el catalogo y la validacion de la region.
