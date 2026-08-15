# Requerimientos Funcionales — TalkLate

**Fase 2 · Especificación de Requerimientos**

**Estado:** borrador, pero ya cubre todos los entregables del Mapa de Impacto
(`requerimientos/mapa_impacto.md`), que ahora está completo a nivel de características e
historias de usuario. No se inventan requerimientos más allá de lo que el Mapa de Impacto y el
Modelo de Dominio Enriquecido (`arquitectura/modelo_datos.md`) ya sustentan — donde una historia
de usuario quedó marcada como "pregunta abierta" en el mapa de impacto, aquí tampoco se convierte
en requerimiento todavía.

---

## Actores

| Actor | Descripción |
| --- | --- |
| Cliente Traductor | Usuario final de la aplicación móvil que necesita comunicarse en un idioma que no domina. |
| Inteligencia Artificial | El motor/modelo que detecta acento, tono, y genera y mejora las traducciones. No es un actor humano, pero el Mapa de Impacto lo modela como actor porque sus capacidades generan impactos propios (ver `mapa_impacto.md`). |

## Requerimientos funcionales — módulo Traductor de mensajes

| ID | Requerimiento | Fuente |
| --- | --- | --- |
| REQ-TRAD-001 | El sistema debe permitir al Cliente Traductor ingresar un mensaje por voz (micrófono). | Mapa de Impacto — "Recibir entrada de mensaje" |
| REQ-TRAD-002 | El sistema debe permitir al Cliente Traductor ingresar un mensaje por texto escrito. | Mapa de Impacto — "Recibir entrada de mensaje" |
| REQ-TRAD-003 | El sistema debe traducir el mensaje de un idioma origen a un idioma destino en tiempo real, preservando el contexto cultural. | Mapa de Impacto — impacto del entregable Traductor de mensajes |
| REQ-TRAD-004 | El sistema debe entregar el mensaje traducido usando el mismo canal por el que fue recibido el mensaje original (voz → audio, texto → texto). | `arquitectura/modelo_datos.md` — Conversación, responsabilidad "Traducir Mensaje" |

## Requerimientos funcionales — Usuario (derivados del Modelo de Dominio Enriquecido)

| ID | Requerimiento | Regla de negocio asociada |
| --- | --- | --- |
| REQ-USR-001 | El sistema debe permitir registrar un nuevo usuario con nombre, apellido, correo y fecha de nacimiento. | Usuario-RN-1 a RN-4 |
| REQ-USR-002 | El sistema debe rechazar el registro si el correo ya está asociado a una cuenta activa. | Usuario-RN-1 |
| REQ-USR-003 | El sistema debe exigir que el usuario tenga al menos 13 años para registrarse. | Usuario-RN-2 |
| REQ-USR-004 | El sistema debe validar formato de correo y complejidad mínima de contraseña (8+ caracteres, mayúscula, número, carácter especial). | Usuario-RN-3, RN-4 |
| REQ-USR-005 | El sistema debe permitir iniciar sesión validando correo y contraseña. | Usuario-RN-5 |
| REQ-USR-006 | El sistema debe permitir recuperar contraseña mediante un código enviado al correo, válido por tiempo limitado. | Usuario-RN-6 a RN-9 |
| REQ-USR-007 | El sistema debe permitir cerrar sesión invalidando el token de autenticación activo. | Usuario-RN-10 |

## Requerimientos funcionales — Conversación (derivados del Modelo de Dominio Enriquecido)

| ID | Requerimiento | Regla de negocio asociada |
| --- | --- | --- |
| REQ-CONV-001 | El sistema debe permitir configurar idioma y región destino antes de iniciar la traducción (obligatorio); el origen es opcional y se detecta automáticamente si no se define. | Conversacion-RN-1, RN-2 |
| REQ-CONV-002 | El sistema debe validar que el par de idiomas origen-destino esté soportado antes de iniciar la conversación. | Conversacion-RN-3 |
| REQ-CONV-003 | El sistema debe validar el formato del archivo de audio recibido (mp3, wav, m4a) y su duración. | Conversacion-RN-4 (ver detalle en `arquitectura/modelo_datos.md`) |
| REQ-CONV-004 | El sistema debe permitir consultar el historial de mensajes de una conversación. | Responsabilidad "Consultar historial de conversaciones" |
| REQ-CONV-005 | El sistema debe permitir crear una nueva conversación como contenedor de mensajes, configurando idioma y región destino una sola vez para toda la conversación. | Mapa de Impacto — entregable "Gestión de conversaciones" (redefinido), Conversación-RN-1 |
| REQ-CONV-006 | El sistema debe permitir renombrar y eliminar una conversación existente. | `arquitectura/modelo_datos.md` — responsabilidades "Modificar Conversación" / "Eliminar Conversación" |

## Requerimientos funcionales — Historial de conversaciones

| ID | Requerimiento | Fuente |
| --- | --- | --- |
| REQ-HIST-001 | El sistema debe permitir al Cliente Traductor consultar la lista de sus conversaciones anteriores. | Mapa de Impacto — entregable "Historial y gestión de conversaciones traducidas" |
| REQ-HIST-002 | El sistema debe permitir al Cliente Traductor abrir una conversación anterior y ver sus mensajes originales y traducidos. | Mapa de Impacto — misma fuente |

## Requerimientos funcionales — Configuración de idiomas

| ID | Requerimiento | Fuente |
| --- | --- | --- |
| REQ-IDIOMA-001 | El sistema debe permitir al Cliente Traductor seleccionar el idioma y la región destino antes de traducir. | Mapa de Impacto — entregable "Configuración de idiomas origen–destino"; Conversacion-RN-1 |
| REQ-IDIOMA-002 | El sistema debe detectar automáticamente el idioma origen a partir del primer mensaje de voz del usuario, si no fue configurado manualmente. | Conversacion-RN-2 |
| REQ-IDIOMA-003 | El sistema debe permitir consultar la lista de idiomas y regiones disponibles para traducción. | Lenguaje — "Listar lenguajes disponibles"; Región — "Listar regiones disponibles" |

## Requerimientos funcionales — Reproducción de audio traducido

| ID | Requerimiento | Fuente |
| --- | --- | --- |
| REQ-AUDIO-001 | El sistema debe permitir reproducir el mensaje traducido como audio claro y natural. | Mapa de Impacto — entregable "Reproducción y personalización de audio traducido" |
| REQ-AUDIO-002 | El sistema debe entregar el mensaje traducido por el mismo canal con el que fue enviado el mensaje original. | Canal — "Entregar mensaje traducido" |

## Requerimientos funcionales — Capacidades de Inteligencia Artificial

| ID | Requerimiento | Fuente |
| --- | --- | --- |
| REQ-IA-001 | El sistema debe identificar el tono/entonación de un mensaje origen recibido. | Entonación — "Identificar el tono y matices de un mensaje" |
| REQ-IA-002 | El sistema debe aplicar el tono identificado en el mensaje original al mensaje destino generado. | Entonación — "Aplicar el tono y matiz de un mensaje original a un mensaje destino" |
| REQ-IA-003 | El sistema debe identificar automáticamente la región de origen del mensaje que se va a traducir. | Región — "Identificar región origen" |
| REQ-IA-004 | El sistema debe detectar modismos y jerga cultural en el mensaje original y traducirlos por su equivalente cultural en el idioma/región destino, en vez de traducirlos literalmente. | Mapa de Impacto — entregable "Traducción contextual con preservación de jergas y matices culturales"; Conversación — "Traducir Mensaje" |
| REQ-IA-005 | El sistema debe permitir al Cliente Traductor reportar una traducción de mala calidad. | Lenguaje — "Generar reporte de mala traducción" |

## Requerimientos no funcionales (borrador, a validar)

| ID | Requerimiento |
| --- | --- |
| RNF-001 | Los mensajes originales y traducidos (dato sensible/PII) deben protegerse según `convenciones/seguridad.md`. |
| RNF-002 | La traducción debe sentirse "en tiempo real" para el usuario — falta definir un umbral de latencia concreto (pendiente de decisión técnica en F3). |

## Pendiente

- Confirmar con el mentor las dos consolidaciones de entregables sugeridas en
  `mapa_impacto.md` (Captura de mensajes por voz y texto ↔ Traductor de mensajes; redefinición de
  "Gestión de conversaciones") — si el equipo decide no consolidarlas, los REQ-CONV-005/006 deben
  revisarse.
- Convertir en requerimientos las "preguntas abiertas" del mapa de impacto una vez resueltas:
  compartir/exportar conversaciones, editar datos de perfil, personalizar la voz del audio
  traducido, ampliar idiomas/acentos y reentrenar el modelo de IA. Deliberadamente no se
  convirtieron en REQ todavía porque no tienen sustento en el modelo de dominio actual.
- Crear la Matriz de Sensibilidad de Datos (`matriz_sensibilidad_datos.md`, aún no creada) que
  formalice la clasificación mencionada en `convenciones/seguridad.md` para cada entidad del
  modelo de dominio.
- Definir requerimientos no funcionales adicionales (disponibilidad, escalabilidad, límites de
  uso del motor de IA) una vez se decida el stack técnico en F3.
