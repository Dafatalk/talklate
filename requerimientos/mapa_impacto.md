# Mapa de Impacto — TalkLate

**Fase 2 · Especificación de Requerimientos (insumo)**

**Estado:** todos los entregables desglosados en características e historias de usuario,
aplicando la misma metodología que guió el mentor Wider Farid Sánchez Garzón con "Traductor de
mensajes" en la sesión del 2026-08-15 (ver `seguimiento/2026-08-15-mentoria.md`). Las historias
de usuario nuevas se derivaron de las responsabilidades y reglas de negocio ya documentadas en
`arquitectura/modelo_datos.md` — donde el dominio no soporta todavía una capacidad implicada por
el impacto original (ej. "compartir" o "personalizar" audio), queda marcado como pregunta
abierta en vez de inventarse. Falta que el equipo lo valide con el mentor en la próxima sesión.
**Fuente:** `Mapa de Impactoxlsx.xlsx` (tabla Why/Who/How/What y desgloses del "Traductor de
mensajes") + `arquitectura/modelo_datos.md` (fundamento de las historias de usuario nuevas).

---

## ¿Qué es un mapa de impacto?

Técnica (Impact Mapping, Gojko Adzic) que conecta, de izquierda a derecha: **Why** (objetivo/visión)
→ **Who** (actores que pueden ayudar a alcanzar la meta) → **How** (impactos: el beneficio que
cada actor obtiene) → **What** (entregables de software que producen esos impactos). Los impactos
se redactan como objetivos SMART (Específico, Medible, Alcanzable, Relevante, con límite de
Tiempo) y son el insumo directo del "para" en las historias de usuario.

## Why — Objetivo (la Visión, ver `contexto.md`)

Ofrecer una experiencia de traducción que va más allá de la conversión literal de palabras,
considerando contexto, emociones, matices culturales e intenciones.

## Who / How / What

| Actor | Impacto (How) | Entregable (What) |
| --- | --- | --- |
| Cliente Traductor | Poder consultar, reaprovechar y compartir fácilmente traducciones y conversaciones anteriores, convirtiéndolas en un recurso de aprendizaje y referencia. | Historial y gestión de conversaciones traducidas |
| Cliente Traductor | Poder crear y administrar mi perfil de usuario de forma sencilla y segura, para sentir que mi identidad y mis preferencias están claramente definidas dentro de la aplicación. | Gestión de perfil de usuario |
| Cliente Traductor | Poder definir y ajustar los idiomas con los que me quiero comunicar, dejando claro desde el inicio qué idioma hablo y a qué idioma necesito que se traduzca mi mensaje. | Configuración de idiomas origen–destino |
| Cliente Traductor | Poder expresarme hablando de forma natural a través del micrófono o texto según la situación lo requiera. | Captura de mensajes por voz y texto |
| Cliente Traductor | Poder escuchar el mensaje traducido en un audio claro y natural, para que la otra persona pueda recibir mi mensaje de forma cómoda y comprensible. | Reproducción y personalización de audio traducido |
| Cliente Traductor | Poder realizar traducciones en tiempo real teniendo claridad del contexto y del lenguaje geográficamente, garantizando que el mensaje traducido tenga el significado esperado para quien lo debe interpretar. | Gestión de conversaciones |
| Cliente Traductor | Traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para comunicarse fácil y rápidamente con otras personas (manteniendo el contexto cultural). | **Traductor de mensajes** ✅ desglosado (ver abajo) |
| Inteligencia Artificial | Poder detectar el acento y el tono de forma eficiente para así entregar el mensaje al usuario final. | Análisis de acento, tono y características de la voz |
| Inteligencia Artificial | Poder dar una experiencia que mejore con el tiempo, incorporando nuevos idiomas, acentos y capacidades, manteniendo siempre la calidad y naturalidad de la comunicación. | Evolución del modelo de IA y ampliación de idiomas y acentos |
| Inteligencia Artificial | Poder garantizar que los mensajes traducidos conserven la intención, el estilo, el tono y los modismos del hablante original, evitando traducciones planas o literales. | Traducción contextual con preservación de jergas y matices culturales |

> Nota de metodología (mentor, 2026-08-15): un mismo impacto puede verse alcanzado por varios
> entregables, y un entregable puede agrupar varias historias de usuario que comparten ese mismo
> "para". Si al redactar una historia de usuario el "para" no encaja con ningún impacto existente,
> es señal de que falta un impacto por definir en esta tabla — no de que la historia esté mal.

---

## Entregable desglosado: Traductor de mensajes

**Impacto (el "para" de todas sus historias de usuario):** Traducir un mensaje de un idioma
origen a un idioma destino en tiempo real, para comunicarse fácil y rápidamente con otras
personas manteniendo el contexto cultural — es decir, poder establecer comunicación en el mismo
instante y entender qué quiere decir la otra persona sin intermediarios, incluso cuando esa
persona habla de forma muy particular en su propio lenguaje.

**Actor:** Cliente Traductor

### Características (nivel módulo)

1. Recibir entrada de mensaje
2. Procesar mensaje
3. Entregar mensaje traducido

### Historias de usuario (formato Como / Necesito / Para)

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Recibir entrada de mensaje | Cliente Traductor | Decir (hablar) mi mensaje | Traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para comunicarse fácil y rápidamente con otras personas (manteniendo el contexto cultural) |
| Recibir entrada de mensaje | Cliente Traductor | Escribir mi mensaje | (mismo "para" — ambas formas de entrada convergen en el mismo impacto) |

> Durante la sesión del 2026-08-15 se identificó que "procesar mensaje" (ej. transcribir audio a
> texto) probablemente **no** es una historia de usuario en sí misma sino un detalle de
> implementación interno al entregable — el mentor lo ilustró con la analogía del cajero
> automático: el usuario pide dinero y lo recibe, sin necesitar saber cómo el cajero valida saldo,
> valida clave o distribuye billetes por dentro. Queda pendiente decidir si "procesar mensaje"
> pertenece a otro entregable/módulo separado (ej. un componente de reconocimiento de voz) o si
> se mantiene como detalle interno del Traductor de mensajes.

---

## Consolidaciones sugeridas (a validar con el mentor)

Al aplicar la validación que el propio mentor describió — *"si la historia de usuario completa
como/necesito/para no cuadra con el impacto, hay que revisar el impacto, probablemente falta
otro o el actual no es el correcto"* — aparecen dos solapamientos entre entregables que ya
existían en el `Mapa de Impactoxlsx.xlsx` original. Se dejan señalados aquí, no resueltos
unilateralmente: la fila original de la tabla Why/Who/How/What **no se modifica**, y la decisión
de fusionar o no queda para que el equipo la confirme con el mentor.

1. **"Captura de mensajes por voz y texto"** (fila 4 de la tabla) describe exactamente la misma
   capacidad que la característica **"Recibir entrada de mensaje"** ya desglosada dentro de
   **Traductor de mensajes** (voz y texto, mismo "para"). Sugerencia: tratar "Captura de mensajes
   por voz y texto" como el mismo entregable que Traductor de mensajes en vez de dos entregables
   distintos — parece un impacto redactado en un borrador previo al ejercicio guiado por el
   mentor, donde se llegó a la versión más refinada ("Traducir un mensaje de un idioma origen a
   un idioma destino en tiempo real...").
2. **"Gestión de conversaciones"** (fila 6) y el impacto de **Traductor de mensajes** (fila 7)
   también se solapan: ambos hablan de traducir en tiempo real con contexto. Para que "Gestión de
   conversaciones" tenga un impacto propio y no duplicado, se propuso abajo **acotarlo al nivel
   de la conversación como contenedor** (crearla, configurarla, mantener su continuidad) en vez
   de repetir el acto de traducir un mensaje puntual, que ya es responsabilidad de Traductor de
   mensajes. Esto es coherente con las responsabilidades ya documentadas de la entidad
   `Conversación` en `arquitectura/modelo_datos.md` ("Configurar Parámetros de Traducción",
   distinta de "Traducir Mensaje").

---

## Entregable: Historial y gestión de conversaciones traducidas

**Impacto:** Poder consultar, reaprovechar y compartir fácilmente traducciones y conversaciones
anteriores, convirtiéndolas en un recurso de aprendizaje y referencia.
**Actor:** Cliente Traductor
**Fundamento en el dominio:** responsabilidades de `Conversación` — "Consultar historial de
conversaciones", "Registrar/Eliminar/Consultar/Modificar Conversación" (`arquitectura/modelo_datos.md`).

### Características

1. Consultar historial de conversaciones
2. Renombrar una conversación
3. Eliminar una conversación
4. (abierta) Compartir/exportar una conversación

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Consultar historial | Cliente Traductor | ver la lista de mis conversaciones anteriores | consultar traducciones pasadas y usarlas como recurso de aprendizaje y referencia |
| Consultar historial | Cliente Traductor | abrir una conversación anterior y ver sus mensajes originales y traducidos | reaprovechar el contenido de una conversación pasada |
| Renombrar conversación | Cliente Traductor | cambiar el nombre de una conversación | identificarla fácilmente en mi historial |
| Eliminar conversación | Cliente Traductor | eliminar una conversación que ya no necesito | mantener organizado mi historial |

> ⚠️ **Pregunta abierta:** el impacto menciona explícitamente "compartir" conversaciones, pero
> `arquitectura/modelo_datos.md` no documenta ninguna responsabilidad de exportar/compartir (ni
> mecanismo, ni formato). No se inventa aquí una historia de usuario para eso — queda pendiente
> definir con el mentor si aplica al MVP o a una iteración posterior.

---

## Entregable: Gestión de perfil de usuario

**Impacto:** Poder crear y administrar mi perfil de usuario de forma sencilla y segura, para
sentir que mi identidad y mis preferencias están claramente definidas dentro de la aplicación.
**Actor:** Cliente Traductor
**Fundamento en el dominio:** responsabilidades de `Usuario` — Registrar Usuario, Iniciar sesión,
Solicitar Recuperación de contraseña, Restablecer Contraseña, Cerrar Sesión, con sus reglas
Usuario-RN-1 a RN-10 (`arquitectura/modelo_datos.md`).

### Características

1. Registro de cuenta
2. Inicio de sesión
3. Recuperación de contraseña
4. Cierre de sesión
5. (abierta) Edición de datos de perfil ya registrados

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Registro de cuenta | Cliente Traductor | registrarme con nombre, apellido, correo y fecha de nacimiento | crear mi cuenta y que mi identidad quede definida en la aplicación |
| Registro de cuenta | Cliente Traductor | que el sistema valide que tengo al menos 13 años al registrarme | cumplir la normativa de protección de menores (Usuario-RN-2) |
| Inicio de sesión | Cliente Traductor | iniciar sesión con mi correo y contraseña | acceder a mis configuraciones y conversaciones guardadas |
| Recuperación de contraseña | Cliente Traductor | solicitar un código de recuperación a mi correo si olvido mi contraseña | no perder el acceso a mi cuenta |
| Recuperación de contraseña | Cliente Traductor | definir una nueva contraseña usando el código recibido | recuperar el acceso de forma segura, incluso si olvidé la anterior |
| Cierre de sesión | Cliente Traductor | cerrar mi sesión activa | proteger mi cuenta si uso un dispositivo compartido |

> ⚠️ **Pregunta abierta:** "administrar mi perfil" en el impacto original sugiere poder *editar*
> datos ya registrados (nombre, apellido, correo), pero el Modelo de Dominio Enriquecido solo
> documenta responsabilidades de crear la cuenta y gestionar la sesión — no hay una regla de
> negocio para "Actualizar Usuario". Se deja como pendiente en vez de asumir cómo debería
> comportarse (ej. si cambiar el correo requiere re-verificación).

---

## Entregable: Configuración de idiomas origen–destino

**Impacto:** Poder definir y ajustar los idiomas con los que me quiero comunicar, dejando claro
desde el inicio qué idioma hablo y a qué idioma necesito que se traduzca mi mensaje.
**Actor:** Cliente Traductor
**Fundamento en el dominio:** `Conversación` (Configurar Parámetros de Traducción, Conversacion-RN-1/RN-2),
`Lenguaje` (Listar lenguajes disponibles), `Región` (Listar regiones disponibles, Configurar
región destino) — `arquitectura/modelo_datos.md`.

### Características

1. Seleccionar idioma y región destino
2. Detección automática del idioma origen
3. Consultar idiomas y regiones disponibles

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Seleccionar idioma y región destino | Cliente Traductor | elegir el idioma y la región a los que quiero traducir | que mi mensaje se adapte al lugar y a la persona correctos antes de empezar a traducir |
| Detección automática del idioma origen | Cliente Traductor | que el sistema detecte automáticamente mi idioma de origen desde mi primer mensaje de voz | no tener que configurarlo manualmente cada vez (Conversacion-RN-2) |
| Consultar idiomas disponibles | Cliente Traductor | ver la lista de idiomas y regiones que TalkLate soporta | saber qué combinaciones origen-destino puedo usar antes de empezar una conversación (Conversacion-RN-3) |

---

## Entregable: Reproducción y personalización de audio traducido

**Impacto:** Poder escuchar el mensaje traducido en un audio claro y natural, para que la otra
persona pueda recibir mi mensaje de forma cómoda y comprensible.
**Actor:** Cliente Traductor
**Fundamento en el dominio:** `MensajeDestino` (Generar la traducción, `estadoEntrega`), `Canal`
(Entregar mensaje traducido — "se debe aplicar el canal configurado al mensaje destino"),
`Entonación` (Aplicar el tono y matiz de un mensaje original a un mensaje destino) —
`arquitectura/modelo_datos.md`.

### Características

1. Reproducir el mensaje traducido en audio
2. Entregar el mensaje por el mismo canal de entrada (voz → audio, texto → texto)
3. (abierta) Personalizar la voz de reproducción

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Reproducir audio traducido | Cliente Traductor | escuchar el mensaje traducido en un audio claro y natural | que la otra persona reciba mi mensaje de forma cómoda y comprensible |
| Entregar por el mismo canal | Cliente Traductor | recibir el mensaje traducido en el mismo formato que usé para enviarlo (audio si hablé, texto si escribí) | mantener una experiencia consistente con cómo me comuniqué |

> ⚠️ **Pregunta abierta:** "personalización" en el nombre del entregable sugiere poder elegir o
> ajustar la voz de reproducción (ej. tono, velocidad, tipo de voz), pero no hay ninguna
> responsabilidad ni atributo documentado en el dominio para eso — la `Entonación` ya identificada
> se *aplica automáticamente* según el mensaje original, no se elige manualmente. Queda pendiente
> definir si "personalizar" es una funcionalidad real del MVP o una aspiración a futuro.

---

## Entregable: Gestión de conversaciones

**Impacto (redefinido, ver "Consolidaciones sugeridas" arriba):** Poder mantener una conversación
como un espacio configurado y continuo — con su idioma/región destino definidos y su hilo de
mensajes agrupado — para no tener que reconfigurar el contexto en cada mensaje que se traduce
dentro de ella.
**Actor:** Cliente Traductor
**Fundamento en el dominio:** `Conversación` — "Configurar Parámetros de Traducción", relación con
`LenguajePorConversacion` (`arquitectura/modelo_datos.md`); etapa 8 del Customer Journey Map
("Conversación continua", `componentes/especificacion_vistas_ui.md`).

### Características

1. Crear una conversación
2. Configurar los parámetros de traducción de la conversación (una sola vez, no por mensaje)
3. Mantener el hilo de conversación mientras se traducen mensajes sucesivos

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Crear conversación | Cliente Traductor | iniciar una nueva conversación | agrupar todos los mensajes que intercambie con la misma persona bajo un mismo contexto |
| Configurar parámetros | Cliente Traductor | definir el idioma y la región destino una sola vez al crear la conversación | no tener que repetir esa configuración en cada mensaje que envíe dentro de ella (Conversacion-RN-1) |
| Mantener hilo continuo | Cliente Traductor | que la app siga traduciendo automáticamente cada respuesta dentro de la misma conversación | mantener un flujo de comunicación fluido y natural sin reconfigurar nada (etapa 8, Customer Journey Map) |

> Si el equipo prefiere no redefinir este entregable y mantenerlo como en el xlsx original
> (duplicando el impacto de Traductor de mensajes), esta sección debe descartarse y "Gestión de
> conversaciones" debe fusionarse directamente con Traductor de mensajes en la tabla Why/Who/How/What.

---

## Entregable: Análisis de acento, tono y características de la voz

**Impacto:** Poder detectar el acento y el tono de forma eficiente para así entregar el mensaje
al usuario final.
**Actor:** Inteligencia Artificial
**Fundamento en el dominio:** `Entonación` (Identificar el tono y matices de un mensaje),
`Región` (Identificar región origen automáticamente a partir del mensaje) — `arquitectura/modelo_datos.md`.

### Características

1. Detectar la entonación del mensaje origen
2. Detectar la región/acento del mensaje origen

### Historias de usuario

> Nota de metodología: estas historias se redactan desde la perspectiva del actor
> "Inteligencia Artificial" tal como lo define el propio Mapa de Impacto original — es un actor
> no humano cuya "necesidad" es una capacidad técnica que el sistema debe garantizar, no una
> acción voluntaria de una persona.

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Detectar entonación | Inteligencia Artificial | identificar el tono y los matices de un mensaje origen recibido | poder aplicar ese mismo tono al mensaje destino y no entregar una traducción plana (Entonación, responsabilidad "Identificar el tono y matices de un mensaje") |
| Detectar región/acento | Inteligencia Artificial | identificar automáticamente la región a la que pertenece el mensaje que se va a traducir | configurar correctamente el contexto regional de la traducción sin que el usuario tenga que indicarlo manualmente (Región, responsabilidad "Identificar región origen") |

---

## Entregable: Evolución del modelo de IA y ampliación de idiomas y acentos

**Impacto:** Poder dar una experiencia que mejore con el tiempo, incorporando nuevos idiomas,
acentos y capacidades, manteniendo siempre la calidad y naturalidad de la comunicación.
**Actor:** Inteligencia Artificial
**Fundamento en el dominio:** `Lenguaje` — responsabilidad "Generar reporte de mala traducción"
(`arquitectura/modelo_datos.md`).

### Características

1. Reportar traducciones de mala calidad
2. (abierta) Ampliar el catálogo de idiomas/acentos soportados
3. (abierta) Reentrenar o mejorar el modelo con el feedback recibido

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Reportar mala traducción | Cliente Traductor | reportar cuando una traducción no fue correcta o natural | contribuir a que el modelo de IA mejore con el tiempo (Lenguaje, responsabilidad "Generar reporte de mala traducción") |

> ⚠️ **Pregunta abierta:** "ampliar idiomas/acentos" y "mejorar el modelo con el feedback" son
> capacidades de evolución del producto a mediano/largo plazo, no funcionalidades de una sola
> pantalla — el dominio solo documenta el mecanismo de *entrada* (reportar mala traducción), no el
> proceso de mejora en sí. Es esperable que esto se convierta más en un objetivo de roadmap
> (fuera del alcance de una historia de usuario puntual) que en una característica más del MVP.

---

## Entregable: Traducción contextual con preservación de jergas y matices culturales

**Impacto:** Poder garantizar que los mensajes traducidos conserven la intención, el estilo, el
tono y los modismos del hablante original, evitando traducciones planas o literales.
**Actor:** Inteligencia Artificial
**Fundamento en el dominio:** `Región` — responsabilidad "Aplicar matices culturales de la región
al mensaje destino de forma automática"; `Conversación` — responsabilidad "Traducir Mensaje"
("Procesa el contenido buscando modismos y contexto emocional") — `arquitectura/modelo_datos.md`.
Este entregable es, junto con "Traductor de mensajes", el que materializa directamente la
diferenciación de la Visión de TalkLate (ver `contexto.md` — "conexión profunda").

### Características

1. Detectar modismos y jerga en el mensaje original
2. Aplicar el equivalente cultural correspondiente en el mensaje destino

### Historias de usuario

| Característica | Como | Necesito | Para |
| --- | --- | --- | --- |
| Detectar modismos | Inteligencia Artificial | identificar modismos, jerga y expresiones propias de la región de origen dentro de un mensaje | no traducir esas expresiones de forma literal (Conversación, responsabilidad "Traducir Mensaje") |
| Aplicar equivalente cultural | Inteligencia Artificial | reemplazar esas expresiones por su equivalente cultural en la región de destino | que el mensaje traducido conserve la intención, el estilo y el tono del hablante original (Región, responsabilidad "Aplicar matices culturales de la región al mensaje destino") |

---

## Pendiente (explícito, sin inventar contenido)

- **Validar con el mentor** las dos consolidaciones sugeridas arriba (Captura de mensajes por voz
  y texto ↔ Traductor de mensajes; Gestión de conversaciones redefinida) antes de darlas por
  definitivas — no se modificó la tabla Why/Who/How/What original para no decidir esto
  unilateralmente.
- Resolver la pregunta, abierta desde la sesión del 2026-08-15, de si "procesar mensaje" (ej.
  transcribir audio a texto) es un módulo separado o un detalle interno de Traductor de mensajes.
- Definir explícitamente los roles/actores más allá de "Cliente Traductor" e "Inteligencia
  Artificial" si el sistema los requiere (ej. administrador) — no se definieron actores nuevos en
  este documento por no tener sustento en la documentación original.
- Resolver las preguntas abiertas marcadas con ⚠️ en cada entregable (compartir conversaciones,
  editar perfil, personalizar audio, ampliar idiomas/reentrenar modelo).
- Crear un cronograma de trabajo para las próximas semanas de fase de diseño (mencionado como
  pendiente por el equipo en la sesión del 2026-08-15, sin definir todavía).
