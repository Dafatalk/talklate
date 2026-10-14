# Revision del proyecto contra el framework SoftVerse

**Fecha:** 2026-10-14. **Alcance:** documentos de `contexto.md`, `requerimientos/`, `arquitectura/`, `componentes/`, `convenciones/`, `seguimiento/`, el Excel `Mapa de Impacto.xlsx`, el historial de git y el codigo de `backend/` y `frontend/`.

Objetivo: encontrar contradicciones que un jurado pueda usar para "clavar el cuchillo", como dijo Farid: lo que se dice en un artefacto y se contradice en otro. Cada punto trae la pregunta probable y que hacer.

Severidad: **ALTA** (puede tumbar la sustentacion), **MEDIA** (pregunta incomoda), **BAJA** (detalle).

---

## 1. Coherencia metodologica (lo mas peligroso)

### 1.1 ALTA - El historial de git contradice la metodologia
- **Hechos:** las convenciones (`convenciones/git-versionamiento.md`) dicen GitFlow con ramas `feature/{issue}-...`, flujo issue-first, PR con revision cruzada y commits convencionales (`feat(traductor): ... (#12)`). En el repo no hay issues, ni ramas feature, ni PR: se subio directo a `develop`, con mensajes en otro formato.
- **Hechos:** el plan dice que el sprint 1 empieza el 19/10/2026, pero el backend y el frontend completos estan en commits del 14/10/2026, antes del sprint 1.
- **Pregunta probable:** "Dicen que trabajaron con Scrum en 3 sprints desde el 19 de octubre, pero el codigo ya estaba el 14. Muestrenme los issues y los PR de cada historia."
- **Que hacer:** desde el sprint 1 trabajar como dice la convencion: un issue por HU (HU0001 a HU0025), una rama `feature/{issue}-...` por issue, PR revisado por el otro integrante, commits con `(#N)`. Presentar lo del 14/10 como **spike / prueba de concepto** (el artefacto "Spikes/Pruebas de concepto" esta en la lista de etapas) y no como el sprint 1. Si no van a usar GitFlow, cambien la convencion; lo que no puede pasar es que la convencion diga una cosa y el repo otra.

### 1.2 ALTA - Uso de IA visible en el repositorio
- **Hechos:** la mayoria de commits tienen como autor "Claude" y la linea "Co-Authored-By: Claude". Farid advirtio que los jurados revisan el uso de IA.
- **Pregunta probable:** "Quien escribio este codigo?"
- **Que hacer:** **no ocultarlo**: declararlo en el Marco metodologico (que se uso un asistente de IA, para que tareas, y como lo revisaron y validaron ustedes). Lo que si deben poder hacer es explicar cada parte del codigo y cada decision; repasen el backend y el frontend antes de la sustentacion. Desde ahora, que los commits los hagan ustedes con lo que entienden y revisan.

### 1.3 ALTA - Las fases del framework dicen que el codigo no deberia existir
- **Hechos:** `.softverse/estado_fases.json` dice F2 "desbloqueada", F3 "bloqueada" y F6 a F8 "bloqueadas". `AGENTS.md`, `convenciones/README.md`, `componentes/especificacion_vistas_ui.md` y `requerimientos/mapa_impacto.md` dicen que el stack "no esta decidido" y que "no hay template". Pero ya hay stack, template y codigo.
- **Pregunta probable:** "Si su framework bloquea la construccion hasta cerrar la arquitectura, como construyeron?"
- **Que hacer:** actualizar el estado de fases y esos documentos. Argumento valido: Farid autorizo empezar a construir ("primero hacer y luego argumentar") y eso se registra como decision en el acta de la reunion. Hoy esa reunion no esta en `seguimiento/records/` (solo esta la del 15/08): agreguen el acta de la reunion presencial.

### 1.4 MEDIA - Dos versiones distintas del mapa de impacto
- **Hechos:** `requerimientos/mapa_impacto.md` y `requerimientos/req.md` siguen con la version vieja: actor "Inteligencia Artificial", 10 entregables viejos, sin Interlocutor ni Administrador. El Excel tiene la version nueva: 6 epicas, 25 HU y actores Interlocutor y Administrador.
- **Pregunta probable:** "En este documento la IA es un actor y en el Excel no. Cual es el bueno?"
- **Que hacer:** decidir que el Excel es la fuente de verdad y actualizar los `.md`, o borrar lo que ya no aplica. Tambien hay que explicar por que la IA dejo de ser actor (no es una persona que se beneficie: es parte del sistema).

---

## 2. Mapa de impacto e historias de usuario

### 2.1 ALTA - Los impactos no son SMART
- **Hechos:** Farid insistio en que el impacto es un objetivo SMART (especifico, medible, alcanzable, relevante, con tiempo). Ningun impacto tiene una medida ni un plazo. El "Why" es el parrafo de la vision, no un objetivo de negocio medible.
- **Pregunta probable:** "Como saben si lograron el impacto?"
- **Que hacer:** agregar a cada impacto un indicador y un plazo. Ejemplo: "Que el 80 % de los mensajes de prueba con modismos se traduzcan con su equivalente cultural, al terminar la liberacion 1". Y un Why medible, ejemplo: "Lograr que X usuarios de prueba sostengan una conversacion completa con alguien que habla otro idioma".

### 2.2 MEDIA - Impactos casi repetidos
- **Hechos:** fila 5 ("Comunicarse de inmediato sin repetir la configuracion de idioma en cada mensaje") y fila 6 ("Conversar de forma fluida y continua sin reconfigurar los idiomas ni los parametros en cada mensaje") dicen practicamente lo mismo y van a la misma epica.
- **Que hacer:** unirlos o diferenciarlos (por ejemplo, el 5 sobre empezar rapido y el 6 sobre mantener el contexto de la charla).

### 2.3 MEDIA - Impacto del Administrador redactado como funcion
- **Hechos:** fila 12: "Gestionar la configuracion de la aplicacion a nivel de idiomas o regiones" es una actividad, no un beneficio. Ademas sigue la duda en la columna DUDAS ("esto lo hace un administrador?").
- **Que hacer:** redactarlo como beneficio (ej. "Ampliar la oferta de idiomas y regiones con calidad confiable") y borrar la duda cuando la resuelva Farid.

### 2.4 MEDIA - Trazabilidad rota en una historia
- **Hechos:** HU0023 "Consultar los idiomas disponibles" esta en la epica Administracion de idiomas y regiones, pero su "Para" es el impacto de la fila 5, que en el mapa apunta a la epica Gestion de conversaciones.
- **Que hacer:** o se mueve a Gestion de conversaciones, o en el mapa el impacto 5 tambien apunta a Administracion. Farid dijo que un impacto puede ir a varios entregables, pero tiene que estar escrito asi en el mapa.

### 2.5 ALTA - El Interlocutor "no opera la aplicacion", pero en la app si la opera
- **Hechos:** el impacto dice "sin necesidad de conocer ni operar la aplicacion". En la app, para que el Interlocutor responda, alguien toca "Otra persona" en el celular del usuario y escribe o dicta la respuesta.
- **Pregunta probable:** "Si no opera la app, quien escribe su respuesta?"
- **Que hacer:** definir el escenario con claridad. Ejemplo: "el usuario le acerca el celular y la otra persona solo habla; el usuario cambia a 'Otra persona'". O cambiar el impacto a "sin instalar la aplicacion ni crear cuenta", que si es verdad.

### 2.6 MEDIA - "Cerrar sesion" va antes que "Iniciar sesion"
- **Hechos:** en la planificacion, HU0018 "Cerrar sesion" quedo en el sprint 2 como relleno, e "Iniciar sesion" y "Registrarme" en el sprint 3.
- **Pregunta probable:** "Como entregan cerrar sesion si todavia no hay inicio de sesion?"
- **Que hacer:** la regla de Farid es priorizar por valor, pero cerrar sesion no tiene valor sin iniciar sesion. Pasen "Cerrar sesion" al sprint 3 y usen otra historia pequena de relleno en el sprint 2.

### 2.7 MEDIA - "Traducir mi mensaje" como historia
- Farid dijo antes que "procesar mensaje" era un detalle interno (analogia del cajero) y despues nombro "traducir el mensaje" en el audio. Confirmenlo en la reunion y tengan lista la respuesta.

---

## 3. Vision contra lo que la app hace

### 3.1 ALTA - "Detecta acentos" pero la voz llega como texto
- **Hechos:** la vision dice que TalkLate "interpreta jerga local, acentos y variaciones regionales" y hay un impacto de "detectar el acento". En la app el dictado lo hace el navegador o el teclado y llega **texto**; la "region de origen" se adivina por palabras tipicas (parce, wey, che), no por el acento de la voz.
- **Pregunta probable:** "Muestren como detectan el acento."
- **Que hacer:** decir con precision que hoy se detecta la **variante regional por el vocabulario**, y que la deteccion de acento por audio es trabajo futuro. O bajar la promesa en la vision.

### 3.2 MEDIA - "Tiempo real"
- **Hechos:** la traduccion es por turnos (cada mensaje se envia y vuelve), no simultanea. El catalogo de patrones dice que el tiempo real "puede requerir streaming/WebSocket". El driver de 3 segundos no se ha medido, y con Qwen local en un portatil puede tardar mas.
- **Que hacer:** definir "tiempo real" como "menos de N segundos por turno" y medirlo antes de la sustentacion con Qwen (DRV-01). No decir que se cumple si no se ha medido.

### 3.3 MEDIA - "Qwen local" en una app movil
- **Pregunta probable:** "El modelo corre en el celular?"
- **Que hacer:** aclarar que corre en el **servidor** (hoy, el computador de desarrollo con Ollama) y que en produccion necesitaria un servidor con GPU o el respaldo con Claude Sonnet. Si se usa Claude, los mensajes salen a un tercero (ver 5.3).

### 3.4 BAJA - El Customer Journey Map no coincide con la app
- Etapa 2 dice "enlace de recuperacion" (la app usa un codigo de 6 digitos). Etapa 8 dice que "la app identifica automaticamente el idioma de la respuesta" (en la app se marca a mano "Otra persona"). Etapa 9 habla de "calificar la traduccion" (solo hay reportar). Ajusten el journey o expliquen la diferencia.

---

## 4. Modelo de dominio contra la base de datos

| Tema | Modelo (`modelo_datos.md`) | Codigo (`backend/src/db.js`) | Severidad |
| --- | --- | --- | --- |
| Region de un idioma | Lenguaje tiene una sola region | Un idioma puede tener varias regiones (`lenguaje_region`) | MEDIA (ADR-008) |
| Reportes | Solo una responsabilidad de Lenguaje | Tabla `reporte` | MEDIA (Farid dijo que no es dominio: explicarlo como tabla de soporte) |
| Usuario | No tiene contrasena ni rol | Tiene `password_hash` y `rol` | MEDIA: agregarlos al modelo |
| Sesion y recuperacion | No existen | Tablas `sesion_revocada` y `recuperacion` | BAJA: tablas tecnicas |
| MensajeDestino.mensajeOriginal | Tipo "Texto" | Referencia a MensajeOriginal | BAJA: corregir el modelo |
| Conversacion-RN-2 | Origen se detecta con el primer mensaje **de audio** | Se detecta con el primero, de texto o voz | BAJA: actualizar la regla |
| Canal | "Se establece por defecto para el resto de la conversacion" | Cada mensaje elige su canal | BAJA |
| Entonaciones | Ejemplos: Formal, Informal, Tecnico | Neutral, Amigable, Alegre, Preocupado, Enojado, Formal | BAJA |

**Que hacer:** que Julian revise el MER contra `db.js` y que el modelo de dominio y la base digan lo mismo. Los nombres de tablas tambien chocan con la regla de idioma (punto 6.1).

---

## 5. Seguridad y datos personales (`convenciones/seguridad.md`)

### 5.1 ALTA - Falta la matriz de sensibilidad de datos
La convencion la exige (`requerimientos/matriz_sensibilidad_datos.md`) y no existe. Los mensajes son datos personales.

### 5.2 ALTA - Ley 1581 de 2012 (Colombia)
- No hay aceptacion de **tratamiento de datos** al registrarse.
- No hay forma de **eliminar la cuenta** (derecho al olvido); solo se borran conversaciones.
- Los mensajes no estan **cifrados en reposo** (la convencion lo recomienda para PII).
- **Que hacer:** agregar el consentimiento en el registro y una HU de eliminar cuenta, o declararlos como pendientes con su riesgo.

### 5.3 MEDIA - Transferencia a un tercero
Si se usa el respaldo con Claude, el contenido de los mensajes sale a un proveedor externo. Debe decirse en el consentimiento. Con Qwen local no pasa.

### 5.4 MEDIA - Cosas de la convencion que el codigo no cumple
- **Logs:** el backend imprime el correo y el codigo de recuperacion en consola, y los logs no son JSON. La regla dice "nunca loguear datos personales" y "logs estructurados".
- **CORS:** abierto a cualquier origen; la regla pide origenes explicitos.
- **Rate limiting:** solo en el login; la regla lo pide sobre todo en los endpoints de traduccion.
- **Recuperar contrasena** dice "No encontramos una cuenta asociada a este correo": permite saber que correos estan registrados (lo pide la regla Usuario-RN-6, pero es un riesgo conocido; mencionarlo).
- **JWT:** un solo token de 7 dias; la convencion pide token corto y token de refresco.
- **SQL:** la regla dice "ORM, nunca SQL concatenado". El codigo usa consultas parametrizadas (no concatena, no hay inyeccion), pero no usa ORM. Ajusten la regla o el codigo.

---

## 6. Convenciones de codigo y API

### 6.1 MEDIA - Idioma del codigo
La regla transversal 1 dice: **identificadores en ingles** (variables, funciones, tablas). El codigo usa nombres en espanol (`traducir`, `conversacion`, `mensaje_original`). Decidan: cambiar la convencion (justificando que el dominio esta en espanol) o renombrar.

### 6.2 MEDIA - La API no sigue `convenciones/api-rest.md`
| Convencion | Codigo |
| --- | --- |
| Rutas con version `/api/v1/` | `/api/` sin version |
| Error con `statusCode`, `error`, `message`, `timestamp`, `path` | Solo `{ "error": "..." }` |
| `201` con cabecera `Location` | `201` sin `Location` |
| `DELETE` responde `204` | Responde `200` con mensaje |
| `422` para reglas de negocio (ej. par de idiomas no soportado) | Usa `400` |
| Listas con paginacion (`data`, `pagination`) | Listas sin paginacion |
| `GET /health` | `GET /api/salud` |
| Documentacion OpenAPI (Swagger) | No existe |

### 6.3 MEDIA - Pruebas
La regla pide **80 % de cobertura** en logica de negocio y pruebas en todo PR. Hay 19 pruebas en el backend sin medicion de cobertura, y ninguna en el frontend.

### 6.4 BAJA - Otros
- Falta `.editorconfig` y `.gitattributes` (regla 3).
- `seguimiento/estado_artefactos.csv` esta en UTF-8 **con** BOM (la regla 2 dice sin BOM; el BOM se puso para que Excel muestre bien las tildes).
- No hay diagramas C4 (la convencion de diagramas los recomienda para F4). Pueden hacerlos con Archify.

---

## 7. Arquitectura y ADR

### 7.1 MEDIA - Alternativas que no se evaluaron
Farid lo dijo: "muestreme cuales evaluaron". Los ADR listan alternativas razonables, pero el equipo no las evaluo. Antes de la sustentacion, que cada uno sepa por que se descarto cada alternativa, o que se quite la que no se considero.

### 7.2 BAJA - Los ADR no nombran los patrones del catalogo
`convenciones/patrones-arquitectonicos.md` recomienda **Request-Reply + JWT** para el MVP y **Circuit Breaker + Retry** para el motor de IA, con "traduccion literal como degradacion aceptable". Eso es casi exactamente lo que se hizo: la cadena Qwen, Claude y reglas, y saltar un motor un minuto cuando falla. Citarlo en ADR-002, ADR-004 y ADR-006 da mucha coherencia.

### 7.3 MEDIA - Drivers sin medir
Los umbrales de `drivers.md` (3 segundos, glosario de prueba) no se han medido. No presentarlos como cumplidos.

---

## 8. Planificacion

- **BAJA:** las tallas se estiman "para una persona", la capacidad usa 2 personas. Esta bien, pero diganlo asi si lo preguntan.
- **MEDIA:** el plan es de 3 semanas y el codigo base ya existe; expliquen que los sprints son para terminar, probar en celular, cumplir las convenciones de los puntos 5 y 6 y documentar, o rehagan las horas con lo que realmente falta.
- **BAJA:** el catalogo inicial incluye Frances y Portugues (inactivos). La vision habla de foco inicial en espanol e ingles: coherente, pero diganlo.

---

## Que corregir primero (antes de la reunion con Farid)

1. Acta de la reunion presencial en `seguimiento/records/` (respalda "empezar a construir").
2. Actualizar `.softverse/estado_fases.json`, `AGENTS.md`, `convenciones/README.md`, `componentes/especificacion_vistas_ui.md`, `requerimientos/mapa_impacto.md` y `req.md` para que no digan "stack por decidir".
3. Impactos SMART y Why medible (2.1), y arreglar 2.2, 2.3, 2.4, 2.5 y 2.6.
4. Matriz de sensibilidad de datos y consentimiento de datos (5.1 y 5.2).
5. Desde el sprint 1: issues, ramas feature, PR y commits convencionales (1.1).
6. Decidir y declarar el uso de IA en el Marco metodologico (1.2).
