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

## 2026-11-05 (2) - Julian (Claude / Opus)

- **Voz: se revierte VoiceStudio y entra ElevenLabs (ADR-016 -> ADR-017).** IndexTTS 2 no usa la GPU de Apple (solo CPU, ~30 s/frase), inviable en vivo; se elimino su adaptador, su guia y su config.
- **ElevenLabs (nube):** adaptador `sintesis/elevenlabs.js` (REST con `fetch`, modelo `eleven_multilingual_v2`). Voz natural con emocion (`voice_settings`) y acento regional: paisa (es-CO) y New York (en-US), cada una con voz hombre/mujer. Rapido (1-5 s). Config `.env`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOZ_PAISA_HOMBRE/MUJER`, `ELEVENLABS_VOZ_NY_HOMBRE/MUJER`, `ELEVENLABS_GENERO`; `VOZ_MOTOR=elevenlabs`.
- **Genero automatico:** lo infiere el modelo de traduccion local y elige la voz por mensaje. Bug corregido: el servicio de traduccion descartaba el campo `genero`, por eso siempre salia voz de hombre.
- **Emocion y velocidad:** ya se detectaban (LLM + prosodia); ahora tambien alimentan a ElevenLabs. Tests 43/43.
- **Handoff / pendiente:** la deteccion de genero por texto es floja en ingles (evaluar pitch del audio o persistir el genero por mensaje). Las voces de la Voice Library requieren plan pago via API.

## 2026-11-05 - Julian (Claude / Opus)

- **Avances:** Script `run-talklate.sh` en la raiz: levanta backend (`:3000`) y frontend Expo en LAN (`:8081`) con un comando. Instala dependencias si faltan (frontend con `--legacy-peer-deps`), muestra el estado de Ollama/Whisper/VoiceStudio y, con `--full`, intenta levantar Ollama y Whisper. `Ctrl+C` detiene back y front; los servicios de IA quedan aparte. Probado: `/health` OK con SurrealDB y Expo arriba en ~10 s (sin `--full`).
- **Decidi:** Un `.sh` sin dependencias nuevas en vez de un `package.json` raiz con `concurrently` (cero dependencias, sin `node_modules` en la raiz).
- **Handoff / pendiente:** Para traduccion real con Qwen, correr con `--full` o dejar `ollama serve` aparte. Issue #41; PR a `develop`.

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
- **Documentos en Word y PDF:** la entrega ya no se muestra en Markdown. `entrega/TalkLate_Documento_Completo.pdf` (84 paginas, con portada e indice) y los 17 documentos por separado en `entrega/documentos/` (Word y PDF), con tablas con formato y diagramas como figuras numeradas. Los textos quedan en `entrega/fuente/` y se regeneran con `entrega/fuente/herramientas/`.

## 2026-11-05 - Dafatalk (Claude / Opus)

- **Piramide de pruebas (ADR-017):** pruebas ordenadas por nivel. Base: 46 unitarias del backend (`backend/test/unitarias/`) + 5 del frontend. Medio: 18 de integracion (`backend/test/integracion/`, contra SQLite y SurrealDB). Punta: 2 E2E de la API con el servidor real como proceso (`backend/test/e2e/`) y 2 E2E de la app web con Playwright (`e2e/`). Cobertura del backend 96.6 %. Un paso por nivel en el CI y un job `e2e-web`.
- **Arquitectura:** bcrypt y jsonwebtoken pasan detras de los puertos `Hasheador` y `FirmadorTokens` (8 puertos en total). `npm run arch:check` queda sin violaciones y ahora corre en el CI. Diagrama Archify hexagonal actualizado.
- **Trivy (ADR-018):** workflow `.github/workflows/seguridad.yml` en cada PR, push y cada lunes; binario v0.69.3 con checksum (no se usa trivy-action, comprometida en marzo de 2026). Se corrigieron 1 HIGH del backend (express/body-parser) y 1 CRITICAL + 50 HIGH del frontend con `overrides`. Excepcion documentada: `decode-uri-component` (vence 28/02/2027). Nuevo RNF-011.
- **Accesibilidad:** el icono para cambiar entre burbuja y chat ahora tiene nombre accesible ("Cambiar a chat" / "Cambiar a voz").
- **Docs:** carpeta `calidad/` y documentos 18 y 19 en la entrega (Word y PDF); entrega en version 1.1.
- **Revision:** PR #42 de Julian (`run-talklate.sh`) revisado; dos sugerencias menores en el PR.
- **Integracion de `feature/glosario-cultural` (Julian):** glosario cultural paisa / New York en el prompt de Qwen y Claude, y la region de ejemplo pasa de Miami a New York. Se probo toda la piramide con sus cambios (Expo SDK 58, nueva pantalla de Nueva conversacion con selectores desplegables, ElevenLabs): backend 63 unitarias, 81 con cobertura (96.3 % de lineas), 2 E2E de la API, `arch:check` limpio, frontend 5 pruebas y tipos ok, Trivy limpio. La prueba de Playwright se adapto a los selectores desplegables y a New York.

## 2026-11-11 - Dafatalk (Claude / Sonnet)

- **OWASP LLM Top 10 (edicion 2026):** el profesor pregunto si se aplico. No habia ninguna mencion en el proyecto. Se reviso el codigo contra los 10 riesgos y se documento en `calidad/owasp_llm_top10.md`: 2 cubiertos (LLM03 y LLM08), 1 no aplica (LLM09) y 7 parciales. Brechas de bajo esfuerzo identificadas, aun sin corregir: tipo y largo de `nota_cultural` y `region_origen`, delimitar el texto del usuario en el prompt, `num_predict` en Qwen, y agregar ElevenLabs a la politica de datos.
- **Guia interna de la documentacion:** `seguimiento/guia_documentacion_equipo.md` (que tiene la documentacion, que promete, orden de lectura y donde pueden cuestionarla los jurados).
- **Contradicciones encontradas, sin corregir:** los documentos de la entrega aun describen VoiceStudio (11 de 19) y el codigo usa ElevenLabs (ADR-019 no esta en `entrega/fuente/11`); las cifras dicen 51 pruebas unitarias y hoy son 68; `.softverse/estado_fases.json` no refleja lo construido; el glosario cultural tiene 0 de 196 entradas validadas por nativos; el administrador por defecto usa `Admin123!`.

## 2026-11-12 - Dafatalk (Claude / Sonnet)

- **Guia tecnica para exponer:** `seguimiento/guia_tecnica_para_exponer.md` (contexto completo del proyecto de cero: producto, recorrido de un mensaje, arquitectura hexagonal con 9 puertos, traduccion, voz, datos, seguridad, app, pruebas, metodologia, puntos debiles, preguntas probables, guion y glosario).
- **Diagramas Archify actualizados** (los 4 pasan validate, deliver, check y browser-check): arquitectura general y hexagonal con ElevenLabs, Claude de respaldo, deteccion de genero por pitch y 9 puertos (antes decian VoiceStudio y 8 puertos); nuevos: secuencia de un mensaje de voz (`entrega/diagramas/secuencia_voz.html`) y modelo de datos (`entrega/diagramas/modelo_datos.html`).
- **Hallazgos nuevos sin corregir:** el genero inferido de la voz se guarda por mensaje y no esta en la matriz de sensibilidad; `tech_stack.md` dice Expo SDK 57 / React Native 0.86 (hoy 58 / 0.88); el documento de vision dice que frances y portugues existen inactivos (en el codigo solo hay espanol e ingles).
- Engram no esta disponible en esta sesion; esta bitacora es el registro.

## 2026-11-12 (2) - Dafatalk (Claude / Sonnet): integracion del PR 53 de Julian y reescaneo

- **Pull request 53 (Julian):** traduccion con Claude Sonnet en Google Vertex AI (`vertex.js`, credenciales ADC), prompt de transcreacion cultural con ejemplos del glosario, motor de reglas que falla sin modismos conocidos, pantalla de inicio con la lista de conversaciones, busqueda, tarjetas con menu, efecto glass, reporte de problemas (backend, app y vista de administrador), audio cacheado al volver a escuchar y script de arranque sin Ollama. La voz es ElevenLabs.
- **Verificado:** backend 73 unitarias y 102 en total con cobertura (96.5 % de lineas), E2E de la API 2/2, `arch:check` limpio, frontend 5/5 y tipos, Playwright 2/2 y **Trivy: 0 vulnerabilidades, 0 secretos, 0 configuraciones inseguras** (base de datos actualizada el mismo dia).
- **Ajustes:** (1) Playwright abre "Nueva conversacion" con el boton + porque la pantalla inicial es la lista; (2) `POST /problemas` con limite de 10 por hora por usuario; (3) `nota_cultural` y `region_origen` del modelo solo como texto de largo acotado; (4) Qwen con `num_predict`; (5) Vertex con tiempo limite de 30 s y sin reintentos del SDK; (6) OpenAPI con `/problemas` y `/admin/problemas`; (7) en produccion el servidor exige `ADMIN_PASSWORD`.
- **Documentos:** ADR-019 y ADR-020 en la entrega; actualizados los 11 documentos que decian VoiceStudio o Qwen como motor principal, la politica de datos y la matriz (Google Cloud, ElevenLabs, genero de la voz, problemas), Trivy con historial de escaneos y OWASP v1.1 como documento 20. Entrega version 1.2 con Word y PDF regenerados. Diagramas de Archify al dia (Claude en Vertex, ElevenLabs, 9 puertos) mas la secuencia de voz y el modelo de datos.
- **Pendiente:** medir calidad y tiempo con el motor de produccion; validar el glosario con nativos; probar en celular fisico; aviso en la app de que el texto sale a terceros; tope de gasto; SBOM; unificar el modelo por defecto (`claude-sonnet-4-6` en Vertex y `claude-sonnet-5-5` en la API directa); sacar el identificador del proyecto de Google y el correo personal del codigo.
- Engram no esta disponible en esta sesion; esta bitacora es el registro.

## 2026-11-12 (3) - Dafatalk (Claude / Sonnet)

- PR 54 integrado en develop (CI en verde: backend, backend-surreal, frontend, e2e-web y trivy).
- **Manual de entendimiento:** `seguimiento/manual_de_entendimiento_talklate.md` (19 partes: producto, mapa de impacto, las 26 historias con criterios, los 26 REQ y 11 RNF, funcionalidades, recorrido de un mensaje, arquitectura, IA, voz, datos, seguridad, app, pruebas, metodologia, puntos debiles, preguntas, guion y glosario).
- `requerimientos/req.md` ya lista los 11 requisitos no funcionales (antes 9).
- Criterios de HU0001 y HU0004 siguen hablando de dictado y voz del dispositivo; hoy es grabacion + Whisper y voz de ElevenLabs.
- Engram no esta disponible en esta sesion; esta bitacora es el registro.
