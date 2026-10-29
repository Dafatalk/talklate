# Bitacora de avances y decisiones - TalkLate

> Contexto compartido entre Julian, Diego y las sesiones de IA. Cada IA **lee esto al empezar**
> y **agrega una entrada al terminar**, para que una sesion sepa que hizo la otra (avances +
> decisiones + que queda pendiente).
>
> Reglas para que se mantenga rapida aunque crezca:
> - **Entradas nuevas arriba** (orden inverso: lo mas reciente primero).
> - Corta y concreta. Si algo necesita detalle, enlaza al doc (no lo copies aca).
> - Una decision = que se decidio + por que (una linea cada cosa).
> - Lo que quedo abierto va en **Handoff**, para que la siguiente sesion lo retome.
>
> Plantilla (copiar y rellenar):
> ```
> ## AAAA-MM-DD - <autor> (<IA o persona>)
> - **Avances:** ...
> - **Decidi:** ... (por que)
> - **Handoff / pendiente:** ...
> ```

---

## 2026-10-23 (2) - Dafatalk (Claude / Opus)

- **Decidi (equipo):** **se mantiene SurrealDB; no se migra a PostgreSQL.** Justificacion tecnica (no solo "lo recomendo el profesor"): enlaces nativos para la cadena conversacion -> mensajes -> traducciones -> reportes, reglas del dominio en el esquema (UNIQUE, ASSERT), multimodelo para lo que viene (reportes flexibles, busqueda vectorial de modismos) y gestionada en la nube con usuarios de permisos limitados. Julian: confirma que el usuario de base del backend solo tenga permisos sobre `talklate/app`. El riesgo (tecnologia mas joven) se controla con la arquitectura hexagonal. La frase para la sustentacion esta en ADR-012.
- **Avances:** ADR-012 marcado como decision cerrada (con la decision final y como se atienden los puntos debiles); `revision_recomendaciones.md`, `arquitectura.md`, `tech_stack.md` y `validar_en_reunion.md` al dia.
- **Handoff / pendiente:** Julian, ya no hace falta tu opinion sobre PostgreSQL (lo pedido en la entrada de abajo queda resuelto). Sigue pendiente revisar indices en las consultas de SurrealDB que recorren enlaces, ademas de la medicion con Qwen, el tiempo de espera de Qwen, la gestion de claves y el despliegue.

## 2026-10-23 - Dafatalk (Claude / Opus)

> **Estado:** fusionado en `develop` (PR #34). Julian: lee primero la seccion **Para Julian** de esta entrada.

- **Avances:**
  - Revise el commit de Julian del 22/10 (documento maestro, C4 nivel 3, diagramas, bitacora): coincide con el codigo; se actualizaron sus rutas de archivos a la nueva estructura.
  - **Arquitectura hexagonal implementada** en `backend/src` (frente 4 de la revision): `dominio/`, `aplicacion/` (un caso de uso por epica), `puertos/` (Repositorio, MotorTraduccion, Notificador, Cifrador), `adaptadores/` (http, persistencia, traduccion, correo, cifrado) y `composicion.js`. El contrato de la API no cambio.
  - Pruebas: 34 con SQLite (cobertura ~97 %), 16 de la API contra SurrealDB 3.0.4, `verificar-surreal.js` 12/12 y `smoke-http.js` OK. El Circuit Breaker ahora se prueba con motores falsos.
  - Docs: ADR-013 en `decisiones.md`, `componentes.md` rehecho por capas (C01-C27), `arquitectura.md`, `tech_stack.md`, `convenciones/backend-node.md` (regla de dependencias), READMEs, `drivers.md`, `modelo_datos.md` y matriz de sensibilidad.
  - Analisis de las demas recomendaciones en `arquitectura/revision_recomendaciones.md`.
- **Decidi:**
  - Hexagonal dentro del monolito y no microservicios: limites claros sin costo distribuido (ADR-013).
  - Solo `composicion.js` conoce adaptadores concretos; los casos de uso solo importan dominio y puertos.
  - No migrar a PostgreSQL todavia: con la arquitectura hexagonal cuesta un adaptador (talla L), pero hay que decidirlo con Farid al validar ADR-012.
- **Hallazgos:** el tiempo de espera de Qwen (60 s) incumple DRV-01 cuando Ollama falla; el glosario de `npm run medir` esta dentro del motor de reglas (la linea base de 14/15 no es evidencia) y usa regiones fuera del alcance (California, Ciudad de Mexico); la clave de cifrado no tiene politica de rotacion ni exige fuerza en produccion.
- **Handoff / pendiente (orden propuesto):**
  1. Medicion real con Qwen con un glosario aparte de unos 40 modismos (ES-CO / EN-US), 3 repeticiones y el equipo registrado.
  2. Acotar el tiempo de espera de Qwen y Claude; politica de claves y rotacion (`enc:v2:<id>`).
  3. Decidir SurrealDB o PostgreSQL con Farid.
  4. Metricas (`/metrics`) y despliegue (Docker, F10).
- **Para Julian (cambios que te afectan):**
  - **Se movieron todos los archivos de `backend/src`.** Si tienes una rama vieja, haz merge de `develop` antes de seguir. Equivalencias: `lib/traductor.js` -> `aplicacion/traduccion.js`; `lib/motorQwen|motorClaude|motorLocal.js` -> `adaptadores/traduccion/qwen|claude|reglas.js`; `lib/auth.js` -> `aplicacion/sesiones.js` + `adaptadores/http/sesion.js`; `routes/*.js` -> `adaptadores/http/rutas/*.js` (la logica paso a `aplicacion/*.js`); `repos/surreal.js` + `surreal.js` -> `adaptadores/persistencia/surreal/repositorio.js` + `cliente.js`; `repos/sqlite.js` + `db.js` -> `adaptadores/persistencia/sqlite/repositorio.js` + `esquema.js`; `lib/errores|validaciones|analisis.js` -> `dominio/`; `lib/log.js` -> `compartido/log.js`; `lib/cifrado.js` -> `adaptadores/cifrado/aesGcm.js`; `lib/correo.js` -> `adaptadores/correo/consola.js`; `app.js` -> `adaptadores/http/app.js`.
  - **Regla nueva** (`convenciones/backend-node.md`): un caso de uso (`aplicacion/`) solo importa `dominio/` y `puertos/`; nunca Express, la base ni un adaptador. Solo `composicion.js` conoce los adaptadores concretos.
  - **Tu adaptador de SurrealDB no cambio por dentro** (esquema en ingles, `tokens.consumir`, token de sesion); solo se movio de carpeta y ahora se verifica contra el puerto `Repositorio` al arrancar. Si agregas un metodo al repositorio, agregalo tambien en `puertos/index.js` y en el adaptador SQLite.
  - **Tus documentos** (`arquitectura.md`, `componentes.md`, diagrama de secuencia) se actualizaron a la nueva estructura; `componentes.md` quedo renumerado por capas (C01-C27).
  - **Archify:** sirve para regenerar los diagramas con la estructura hexagonal (capas: dominio, aplicacion, puertos, adaptadores).
  - **Necesito tu opinion** sobre SurrealDB o PostgreSQL antes de la reunion con Farid (`arquitectura/revision_recomendaciones.md`, punto 5), y si puedes correr la medicion con Qwen en tu equipo (punto 6).


## 2026-10-22 (2) - Julian (Claude / Opus)

- **Avances:** Instalada la skill **Archify** (diagramas HTML interactivos desde el repo) project-scoped en `.agents/skills/archify`, con symlink para Claude Code. Reinstalar con `npx skills add tt-a1i/archify`.
- **Decidi:** NO versionar los 17 MB de la skill. Se ignora `.agents/` y `.claude/skills/` en `.gitignore`; se versiona solo `skills-lock.json` para que el equipo reproduzca la misma version.
- **Handoff / pendiente:** Util para regenerar los diagramas de `arquitectura/` (c4, despliegue, secuencia) de forma interactiva. Falta probarla pidiendole al agente que mapee el repo.

## 2026-10-22 - Julian (Claude / Opus)

- **Avances:** Documentacion de la arquitectura actual.
  - `arquitectura/arquitectura.md` (NUEVO): documento maestro que amarra todas las vistas y justifica cada decision contra su ADR + driver. Incluye matriz driver->ADR->mecanismo->evidencia, vista dinamica (secuencia) y vista de despliegue (nuevas).
  - `arquitectura/componentes.md` (NUEVO): C4 Nivel 3 de la API (20 componentes C01-C20) + Nivel 3 de la App movil.
  - `arquitectura/diagramas/despliegue.drawio` y `secuencia_traduccion.drawio` (NUEVOS): fuentes editables.
  - `arquitectura/c4.md`: enlazado al doc maestro.
- **Decidi:**
  - Documentar solo el C4 L3 tomando del framework SOFIA el catalogo de componentes + trazabilidad; se rechazo el resto (mingrammer, formato ADR de SOFIA, FinOps). Se mantiene Mermaid + drawio como convencion propia.
  - El **monolito modular se mantiene**: justificado por trade-offs contra RNF-001 (latencia), RNF-007 (una base de codigo) y RNF-008 (testing), no por "sube complejidad". Microservicios pierde en los tres.
- **Handoff / pendiente:** Revision critica de arquitectura abierta. Hay 4 frentes sobre la mesa y falta que Julian elija por cual arrancar:
  1. **Medir con Qwen** latencia (DRV-01) y calidad con glosario held-out (DRV-02). La tesis del proyecto esta sin validar; la medicion actual (motor de reglas) no cuenta.
  2. **Reconsiderar SurrealDB -> PostgreSQL**: el dominio es relacional puro y el patron Repository ya aisla la base, el cambio seria barato. ADR-012 ya esta marcado "validar con el mentor".
  3. **Desplegar API + Ollama + metricas** (F10). Hoy nada corre en servidor.
  4. **Formalizar limites hexagonales** del subsistema de traduccion (port + adapters) para robustez sin microservicios.
  - Pendientes de repo: `seguimiento/follow-up/modelo_dominio/schema/` esta sin commitear (confirmar con Diego antes de subir). Servicio de correo de recuperacion sigue pendiente (ADR-006).

## 23/10/2026 - Voz con burbuja animada y mapa de impacto por valor

- **Voz (para Julian y Diego):** el boton hablar ya graba en Expo Go con `expo-audio` y el servidor transcribe con Whisper (ADR-014). Hay que correr `npm install` en `frontend/` y levantar un Whisper local y poner `TRANSCRIPCION_URL` en `backend/.env`.
- La entonacion se detecta por las palabras y por la voz, y la traduccion se escucha con ese mismo tono y ritmo.
- La pantalla cambia entre la burbuja animada (modo voz) y el chat con el icono de arriba.
- **Mapa de impacto:** ahora esta ordenado de mayor a menor valor, igual que los sprints, como pidio el profesor. Los IDs de las historias no cambiaron.

## 26/10/2026 - Voz natural con emocion y flujo de la burbuja

- **Voz natural (ADR-015):** la traduccion ya no suena robotica si se configura Azure Speech (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`) o una API de voz compatible con OpenAI (`VOZ_URL`, `VOZ_API_KEY`). El enojo, la alegria y la preocupacion se notan en la voz. Sin clave, se usa la voz del celular como antes.
- **Flujo de la burbuja:** toda conversacion abre en la burbuja. Al tocarla escucha (salen ondas), al dejar de hablar ~1.5 s traduce sola (la burbuja gira), luego suena la traduccion y vuelve a quedar lista. El chat sigue a un toque en la cabecera.

## 29/10/2026 - VoiceStudio como voz local con emocion

- Se agrego VoiceStudio como primer motor de voz (ADR-016). Con IndexTTS 2 la emocion se manda como vector (enojo, alegria, tristeza...), corre local y gratis en la Mac M5.
- Si VoiceStudio falla, se usa Azure u OpenAI (si hay claves) y si no, la voz del celular.
- Guia para montar todo en la Mac y medir: `backend/VOICESTUDIO_MAC.md`. Comando de medicion: `npm run medir:voz`.
- Pendiente: medir en la Mac y confirmar el id del motor y los campos de la API (ver la guia, seccion 7).

## 29/10/2026 - Carpeta de entrega

- Toda la documentacion para la entrega quedo en `entrega/`, numerada en orden de lectura (01 vision a 17 politica de datos), con indice en `entrega/README.md`.
- Los documentos de la entrega ya incluyen la voz: Whisper (entrada), prosodia, voz con emocion (VoiceStudio, Azure, OpenAI), ADR-014 a ADR-016 y RNF-010.
- Se quitaron las notas de trabajo internas ("validar con...", pendientes de revision) y los textos quedaron sin tildes.
- Diagramas actualizados con Whisper y VoiceStudio: draw.io de contexto, contenedores y despliegue.
- **Archify:** se actualizo el diagrama hexagonal que subio Julian (`.archify/architecture-talklate-hexagonal-20261022-203500/`) con la voz: 6 puertos (se suman Transcriptor y Sintetizador), adaptadores de transcripcion y sintesis, Whisper, VoiceStudio y Azure/OpenAI, citando el codigo de develop (135d4d4). Se agrego la vista general con el flujo de voz (`.archify/architecture-talklate-voz-20261029-180000/`). Las dos pasan `finalize` (validate, deliver, check y browser-check) y estan copiadas en `entrega/diagramas/`.
- `npm run arch:check` marca 2 dependencias de librerias en la capa de aplicacion (bcryptjs en `cuentas.js` y jsonwebtoken en `sesiones.js`) que hay que mover detras de un puerto; CI no corre ese chequeo todavia.
- Se regenero `backend/package-lock.json`: faltaba dependency-cruiser y `npm ci` fallaba en CI.
- Las carpetas de trabajo (`requerimientos/`, `arquitectura/`) siguen siendo la fuente que se edita; `entrega/` es la version para entregar.
