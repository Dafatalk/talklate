# Guia de la documentacion de TalkLate (para Dafa y Julian)

**Version:** 1.0 (11/11/2026)
**Para quien es:** el equipo (Julian y Dafa). No es para entregar al profesor: es para que los dos entiendan que documentacion tiene el proyecto, que promete, y donde nos pueden cuestionar los jurados.

## 1. Idea general en 30 segundos

La documentacion de TalkLate tiene **cuatro capas**:

| Capa | Carpeta | Para que sirve | Quien la lee |
| --- | --- | --- | --- |
| Trabajo | `requerimientos/`, `arquitectura/`, `convenciones/`, `componentes/`, `contexto.md` | Es donde se **edita**. Cada archivo `.md` es un artefacto del framework SoftVerse | El equipo |
| Entrega | `entrega/` | La version limpia para el profesor: 19 documentos en Word y PDF, un PDF completo con indice, diagramas y anexos | Farid y los jurados |
| Calidad | `calidad/` | Piramide de pruebas, seguridad con Trivy y la revision OWASP LLM Top 10 | Farid y los jurados |
| Seguimiento | `seguimiento/` | Bitacora, actas con el mentor, marco metodologico, revisiones | El equipo y, si piden evidencia, el profesor |

Y una quinta cosa: **el codigo tambien es documentacion** (`backend/openapi.yaml` describe la API, `backend/test/` demuestra lo que prometen los documentos, y el CI en `.github/workflows/` demuestra que corre solo).

## 2. Como esta hecha (y por que importa)

1. Los textos viven en Markdown: primero en las carpetas de trabajo y adaptados en `entrega/fuente/` (un `.md` por documento, numerados del 01 al 19).
2. Un script (`entrega/fuente/herramientas/gen.js`) convierte esos `.md` en Word, otro (`render.js`) dibuja los diagramas Mermaid como imagenes y un tercero (`actualizar.py`, con LibreOffice) llena el indice y saca los PDF. Los pasos exactos estan en `entrega/fuente/herramientas/README.md`.
3. Los diagramas interactivos de arquitectura se hicieron con Archify (`.archify/` y `entrega/diagramas/*.html`) y los editables con draw.io (`*.drawio`).
4. Casi todo el texto lo redacta un asistente de IA (Claude Code) a partir de lo que el equipo decide y del codigo real. Esto esta **declarado** en `seguimiento/marco_metodologico.md` seccion 7 y es correcto que lo este: lo que si exigen los jurados es que ustedes puedan explicar cada parte.

**Consecuencia que hay que entender:** hay dos copias de cada texto (la carpeta de trabajo y `entrega/fuente/`). Si se cambia una y no la otra, aparece una contradiccion. Eso es justo lo que le pasa hoy al proyecto con la voz (ver seccion 5).

## 3. Que promete la documentacion

Cada documento hace una promesa que el codigo tiene que cumplir. Un jurado va a elegir una y a pedirles que la demuestren.

| Promesa | Donde se dice | Como se demuestra |
| --- | --- | --- |
| "Traduce con conciencia cultural, no palabra por palabra" | Vision (01), RF de traduccion (05) | Prueba del navegador: "Hay que ponerse las pilas" pasa a "We need to get cracking on the work"; glosario cultural de 196 modismos |
| "Una traduccion tarda menos de 3 segundos" (DRV-01) | Drivers (06) | `npm run medir` (hoy solo medido con el motor de reglas) |
| "Adaptamos los modismos al menos en el 90 %" (DRV-02) | Drivers (06) | `arquitectura/medicion_traduccion.md`: 14 de 15 (93 %) con el motor de reglas |
| "Si un motor de IA falla, la app sigue funcionando" | ADR-004, Arquitectura (07) | Circuit Breaker en `aplicacion/traduccion.js` y su prueba unitaria |
| "Los datos personales estan protegidos (Ley 1581)" | Matriz (16), Politica (17) | Cifrado AES-256-GCM, logs sin datos personales, borrado de la cuenta (pruebas de integracion y E2E) |
| "El diseno es hexagonal: el nucleo no depende de nada externo" | ADR-013, Componentes (10) | `npm run arch:check` y el job del CI |
| "Todo se prueba en tres niveles y corre solo" | Piramide (18), ADR-017 | CI de GitHub en verde |
| "No hay vulnerabilidades altas ni criticas abiertas" | Trivy (19), ADR-018 | Job `trivy` en el CI |
| "Trabajamos con Scrum en tres sprints, con issues, ramas y PR" | Marco metodologico, Sprints (14) | Historial de GitHub: issues, ramas `feature/...`, PR |

## 4. Orden para leer los 19 documentos

Lean primero los marcados con (*): son los que mas preguntan. Para cada uno, la columna final es lo que deben poder decir sin mirar.

| # | Documento | De que trata | Lo que deben poder explicar |
| --- | --- | --- | --- |
| 01 (*) | Vision y contexto | Que es TalkLate, para quien, alcance del MVP y riesgos | Que problema resuelve y que **no** hace (tiempo real = por turno; acento por vocabulario, no por sonido) |
| 02 | Mapa de impacto | Objetivo SMART, actores, impactos | Por que la IA no es un actor |
| 03 | Historias de usuario | 26 historias con prioridad, talla y sprint | Como se priorizo (por valor, sin mirar dependencias, como pidio el mentor) |
| 04 | Criterios de aceptacion | Cuando una historia esta terminada | Un ejemplo completo de principio a fin |
| 05 (*) | Requisitos | 26 funcionales y 11 no funcionales, trazabilidad | Como un requisito baja hasta un driver y una prueba |
| 06 (*) | Drivers | 8 metas medibles de arquitectura | Que mide cada uno y **que no esta medido todavia** |
| 07 (*) | Arquitectura | Documento maestro: estilo, vistas, flujo de voz | Dibujar el flujo de un mensaje de voz de memoria |
| 08 | Stack tecnologico | Tecnologia por capa y alternativas | Por que Node, SurrealDB, Expo, Qwen local |
| 09 | Diagramas C4 | Contexto y contenedores | Leer un C4 |
| 10 | Componentes | Componentes de la API y bounded contexts | Que hace cada componente |
| 11 (*) | Decisiones (ADR) | ADR-001 a 018 con alternativas | Las decisiones grandes: hexagonal (013), SurrealDB (012), motores en cadena (004) |
| 12 | Modelo de datos | Entidades y reglas de negocio | Las reglas de negocio con su prueba unitaria |
| 13 | Vistas y UI | Customer Journey y pantallas | El recorrido de una persona por la app |
| 14 | Sprints | Tallas, capacidad, cronograma | Cuantas horas, cuantos sprints, que entra en cada uno |
| 15 | Liberaciones | Tres liberaciones | Que recibe el usuario en cada una |
| 16 | Matriz de sensibilidad | Clasificacion de cada dato y su control | Que datos son PII y como se protegen |
| 17 | Politica de datos | Politica segun la Ley 1581 | Que se recoge, para que y como se borra |
| 18 (*) | Piramide de pruebas | Tres niveles de prueba y cobertura | Una prueba de cada nivel y por que la base es la mas numerosa |
| 19 (*) | Seguridad con Trivy | Escaneo de dependencias, secretos y configuracion | Que encontro, que se corrigio y cual es la excepcion |
| Nuevo | OWASP LLM Top 10 (`calidad/owasp_llm_top10.md`) | Revision contra la lista 2026 | Que esta cubierto, que no, y por que el modelo no tiene herramientas |

## 5. Donde nos pueden cuestionar

Revision hecha el 11/11/2026 y actualizada el 12/11/2026 (integracion del pull request 53 de Julian: traduccion con Claude en Vertex). Ordenado de mas a menos grave. Lo marcado **Corregido** ya esta en la rama `integracion/vertex-sonnet`.

### ALTA

| # | Problema | Evidencia | Pregunta probable | Que hacer |
| --- | --- | --- | --- | --- |
| 1 | **Corregido 12/11.** Los documentos de la entrega decian VoiceStudio y Qwen como motor principal; el codigo usa ElevenLabs y Claude en Vertex | Se agregaron ADR-019 y ADR-020, se actualizaron 11 documentos, la politica de datos y la matriz, y se regeneraron los Word y PDF | "El documento dice una cosa y el codigo otra" | Nada; solo mantener las dos copias iguales |
| 2 | **Corregido 12/11.** Cifras de pruebas | Ahora 78 unitarias (73 del backend y 5 del frontend), 29 de integracion y 4 de punta a punta; 96.5 % de cobertura | "Cuantas pruebas tienen?" | Volver a contarlas cada vez que cambien |
| 3 | El estado del framework dice una cosa y el repo otra | `.softverse/estado_fases.json`: F7 y F8 "desbloqueadas", F9 y F10 "bloqueadas", pero ya hay pruebas de punta a punta y CI | "Dicen que usan SoftVerse; su propio estado contradice lo construido" | Actualizar las fases y la bitacora; F10 (despliegue) si se declara pendiente, que sea explicito |
| 4 | Uso de IA | Muchos commits con coautor Claude | "Quien escribio este codigo?" | Ya esta declarado en el marco metodologico. Lo que deben hacer: poder explicar el backend, la arquitectura y las pruebas sin ayuda |

### MEDIA

| # | Problema | Evidencia | Que hacer |
| --- | --- | --- | --- |
| 5 | La medicion de calidad es circular | `medicion_traduccion.md` se hizo con el motor de reglas, construido con esos mismos 15 modismos; nunca se midio con el motor de produccion (Claude en Vertex) | Correr `npm run medir` con Claude y modismos nuevos; mientras tanto, decirlo como "linea base" |
| 6 | El glosario cultural no esta validado | 196 entradas, 0 con `native_validated: true` | Que un paisa y un neoyorquino lo revisen; o presentarlo como "investigado, pendiente de validar" |
| 7 | OWASP LLM Top 10 | **Revisado** en `calidad/owasp_llm_top10.md` (documento 20 de la entrega): 3 cubiertos, 1 no aplica y 6 parciales. Se cerraron 4 brechas el 12/11 | Cerrar las que quedan (prompt, SBOM, tope de gasto, aviso en la app) |
| 8 | **Corregido en produccion 12/11.** Administrador por defecto con contrasena conocida | En produccion el servidor exige `ADMIN_PASSWORD`; en desarrollo se conserva `Admin123!`. Falta sacar el correo personal del codigo | No mostrar `Admin123!` en pantalla durante la demo |
| 9 | La app no se ha probado en celular fisico | `estado_fases.json` F8: "falta probar en celular fisico"; las pruebas de punta a punta corren en la web | Probar en Expo Go con celular antes de la sustentacion y dejar evidencia (capturas) |
| 10 | No hay despliegue | No hay Dockerfile ni infraestructura como codigo (Trivy lo dice) | Declarar el alcance: el MVP corre local y en CI; despliegue es trabajo futuro |

### BAJA

| # | Problema | Que hacer |
| --- | --- | --- |
| 11 | Dos copias de cada texto (carpeta de trabajo y `entrega/fuente/`) se pueden separar | Antes de cada entrega, correr la lista de la seccion 6 |
| 12 | "Miami" sigue en `arquitectura/revision_recomendaciones.md` | Es historia de una revision; basta con no citarlo como ejemplo actual |
| 13 | **Nuevo, de privacidad:** con Claude en Vertex, el texto de cada mensaje sale a Google Cloud (antes, con Qwen local, no salia) | Esta en la politica de datos y la matriz desde el 12/11; falta un aviso en la app | Decirlo de frente: es el cambio de privacidad mas grande del proyecto |
| 14 | **Nuevo:** la traduccion depende de internet y de credenciales de Google; si Claude falla, el motor de reglas solo traduce modismos conocidos | Cambio de ADR-020 | Probar antes de exponer con internet y credenciales activas |
| 13 | Los limites de uso estan en memoria | Declararlo: el MVP corre en una sola instancia |

## 6. Lista para antes de entregar

1. Buscar en todos los `.md` las palabras que cambiaron: `VoiceStudio`, `51 pruebas`, `51 unitarias`, `Miami`.
2. Confirmar que las cifras salen de los comandos, no de memoria: `cd backend && npm run test:unitarias`, `npm run coverage`, y en el frontend `npm test`.
3. Confirmar que el CI de `develop` esta en verde.
4. Regenerar Word y PDF con las herramientas de `entrega/fuente/herramientas/` y abrir el PDF completo para revisar el indice.
5. Abrir los diagramas de Archify y comprobar que muestran ElevenLabs, no VoiceStudio.
6. Probar la app en un celular con Expo Go y guardar capturas.

## 7. Respuestas cortas para las preguntas que mas van a hacer

- **Por que arquitectura hexagonal?** Porque el nucleo solo depende de puertos; asi se puede cambiar Qwen por Claude, SQLite por SurrealDB o un motor de voz por otro sin tocar las reglas de negocio, y se prueba todo con piezas falsas (ADR-013, ADR-017).
- **Por que Qwen local primero?** Privacidad (el texto no sale del servidor), costo cero por mensaje y control. Claude queda de respaldo y el motor de reglas como ultimo recurso (ADR-004).
- **Que pasa si falla la IA?** Circuit Breaker: un motor caido se salta por 60 segundos y se pasa al siguiente. Si Qwen y Claude fallan, traduce el motor de reglas, de forma aproximada, y la app lo avisa.
- **Como saben que traduce bien?** Honestamente: hay reportes de usuarios, notas culturales, glosario con fuente y una medicion de linea base. Falta medirlo con Qwen y con hablantes nativos; esta dicho en el OWASP (LLM07) y en este documento.
- **Es seguro?** Cifrado de mensajes en reposo, contrasenas con bcrypt, tokens JWT cortos con refresco rotativo, limites de uso, Trivy en cada pull request y revision OWASP LLM Top 10. El modelo no tiene herramientas ni acceso a datos.
- **Que datos salen a terceros?** El texto a Anthropic solo si Qwen falla; el texto traducido a ElevenLabs para generar la voz. Lo segundo hay que agregarlo a la politica de datos.
- **Quien escribio el codigo?** El equipo con apoyo de un asistente de IA, declarado en el marco metodologico. Cada decision esta en un ADR y cada regla tiene su prueba.

## 8. Que sigue

Si quieren, el siguiente paso es un solo pull request que: corrija los puntos 1 a 3 y 7 a 8 (documentos, cifras, estado de fases, brechas de bajo esfuerzo del OWASP), regenere los Word y PDF y agregue el documento de OWASP como documento 20 de la entrega. El `.zip` con los documentos, los `.md` legibles y los diagramas se arma al final, cuando lo pidan.
