# Modelo de Datos — TalkLate

**Fase 3 · Arquitectura de Software & Base de Datos**

**Estado:** en construcción. Migrado íntegramente desde `Modelo de Dominio Enriquecido.xlsx`.
**Combinaciones unicas:** ya hay una propuesta por entidad (falta validarla con Farid y pasarla al xlsx, que esta usando Julian).
**Gap original:** a casi todas las entidades les faltaba modelar las **combinaciones
únicas** (constraints de unicidad, simples o compuestas) — señalado por el mentor Wider Farid
Sánchez Garzón en la sesión del 2026-08-15 (ver `seguimiento/2026-08-15-mentoria.md` para la
explicación completa de la metodología de combinaciones únicas con el ejemplo de País/Departamento).
Las propuestas salen de las reglas de negocio de cada entidad y de lo que explico Farid; son una propuesta hasta que el las valide.

Diagrama editable de referencia: [`diagramas/modelo_dominio.drawio`](diagramas/modelo_dominio.drawio).

---

## Objetos de dominio

| Objeto de dominio | Descripción |
| --- | --- |
| Usuario | Entidad que define a un usuario registrado en la aplicación, guardando de él sus datos personales y de interés. |
| Conversación | Entidad que representa una sesión de comunicación entre usuarios, conteniendo múltiples mensajes intercambiados a través de un canal específico. |
| Lenguaje | Entidad que representa un idioma disponible en el sistema para traducción y comunicación. |
| LenguajePorConversación | Entidad de relación que almacena las configuraciones de idioma específicas para cada conversación individual. |
| MensajeOriginal | Entidad que almacena el contenido original del mensaje antes de cualquier procesamiento o traducción. |
| MensajeDestino | Entidad que almacena el mensaje procesado/traducido listo para ser entregado al destinatario en su idioma preferido. |
| Canal | Entidad que define el medio a través del cual se transmiten los mensajes. |
| Entonación | Entidad que define el tono o estilo comunicativo a aplicar en los mensajes (formal, informal, técnico, etc.). |
| Región | Entidad que representa una región geográfica que puede influir en variaciones dialectales y culturales del lenguaje. |
| País | Entidad que representa un país específico, utilizado para contexto geográfico y configuraciones regionales. |

---

## Usuario

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | correo | Usuario-RN-1: no puede haber dos cuentas con el mismo correo. |

| Atributo | Tipo | Longitud | Obligatorio | Sensible | Descripción |
| --- | --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | No | Identifica de manera única a un usuario. Autogenerado. |
| nombre | Alfanumérico | 1–50 | Sí | No | Nombre del usuario. |
| apellido | Alfanumérico | 1–50 | Sí | No | Apellido del usuario. |
| correo | Alfanumérico | 5–320 | Sí | **Sí** | Correo electrónico, usado para contacto privado y seguridad. |
| fechaNacimiento | Fecha | — | Sí | No | Fecha de nacimiento; no puede ser mayor a la actual. |

### Responsabilidades y reglas de negocio

| Responsabilidad | Entrada | Salida | Regla | Descripción | Excepción | Respuesta al usuario |
| --- | --- | --- | --- | --- | --- | --- |
| Registrar Usuario | identificador, nombre, apellido, correo, fecha de nacimiento | estado, mensaje | Usuario-RN-1 | Verificar que el correo no esté asociado previamente a una cuenta activa. | Ya existe un usuario con el mismo correo | "El correo electrónico ingresado ya está registrado en TalkLate. Por favor inicie sesión." |
| Registrar Usuario | | | Usuario-RN-2 | La edad calculada desde la fecha de nacimiento debe ser ≥ 13 años. | Usuario menor de 13 años | "Lo sentimos, debes ser mayor de 13 años para crear una cuenta." |
| Registrar Usuario | | | Usuario-RN-3 | El correo debe cumplir el formato estándar (usuario@dominio.com). | Formato inválido | "El formato del correo es inválido. Por favor revíselo." |
| Registrar Usuario | | | Usuario-RN-4 | La contraseña debe tener mínimo 8 caracteres, incluyendo mayúscula, número y carácter especial. | Contraseña débil | "La contraseña es débil. Debe tener al menos 8 caracteres, números y símbolos." |
| Iniciar sesión | correo, contraseña | estado, mensaje, token | Usuario-RN-5 | Verificar que el correo exista y la contraseña coincida. | Credenciales incorrectas | "Usuario o contraseña incorrectos. Por favor verifique sus credenciales." |
| Solicitar Recuperación de contraseña | correo | estado, mensaje | Usuario-RN-6 | Buscar cuenta activa vinculada al correo. | Correo no registrado | "No encontramos una cuenta asociada a este correo electrónico." |
| Solicitar Recuperación de contraseña | | | Usuario-RN-7 | Verificar envío exitoso del correo con el código. | Fallo en servicio de mensajería | "Ocurrió un error al enviar el código. Por favor intente nuevamente más tarde." |
| Restablecer Contraseña | correo, código, nueva contraseña | estado, mensaje | Usuario-RN-8 | El código debe coincidir con el generado y no haber expirado (ej. 15 min). | Código incorrecto/expirado | "El código de verificación es inválido o ha expirado. Solicite uno nuevo." |
| Restablecer Contraseña | | | Usuario-RN-9 | La nueva contraseña debe cumplir las mismas políticas que Usuario-RN-4. | Contraseña no válida | "La nueva contraseña no es segura. Use al menos 8 caracteres, números y símbolos." |
| Cerrar Sesión | — | estado, mensaje | Usuario-RN-10 | El token de autenticación debe ser válido, no expirado y corresponder a una sesión activa. | Sesión inactiva | "La sesión ya ha expirado o no es válida." |

### Datos simulados (muestra)

| Identificador | Nombre | Apellido | Correo | Fecha de nacimiento |
| --- | --- | --- | --- | --- |
| f256dadb-... | Julian David | Diaz Medina | diazjulian460@gmail.com | 2002-04-16 |
| d72f77e6-... | Diego Alejandro | Franco Atehortua | dafa123.daf@gmail.com | 2002-04-29 |

---

## Conversación

**Combinaciones unicas (propuesta, validar con Farid):** ninguna. El nombre tiene valor por defecto "Nueva Conversacion", asi que se repite. El identificador no cuenta porque ya es unico.

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 3–80 | Sí | Default "Nueva Conversación"; no puede contener caracteres especiales o palabras ofensivas (Conversacion-RN-4). No se puede modificar el identificador (Conversacion-RN-5). |
| fecha y hora de inicio | Fecha y tiempo | — | Sí | Autogenerado. |
| usuario | Referencia a Usuario | — | Sí | Usuario que crea la conversación. |
| lenguajePorConversacion | Referencia a LenguajePorConversacion | — | Sí | Configuración de idiomas de la conversación. |

### Reglas de negocio

| Regla | Descripción |
| --- | --- |
| Conversacion-RN-1 | Una conversación debe tener definido un idioma destino antes de iniciar la traducción; la Región seleccionada debe ser válida para el Lenguaje elegido. |
| Conversacion-RN-2 | El idioma origen se detecta automáticamente con el primer mensaje de audio y no puede cambiar durante esa conversación. |
| Conversacion-RN-3 | Los pares de idiomas origen-destino deben estar soportados por el sistema antes de iniciar la conversación. |
| Conversacion-RN-4 | El nombre de la conversación no puede contener caracteres especiales o palabras ofensivas. |
| Conversacion-RN-5 | No se puede modificar el identificador. |

### Responsabilidades

| Responsabilidad | Entrada | Salida | Descripción |
| --- | --- | --- | --- |
| Configurar Parámetros de Traducción | Lenguaje, Región | estado, mensaje | Establece el contexto antes de enviar mensajes; idioma y región destino obligatorios, origen opcional. |
| Traducir Mensaje | MensajeOriginal | estado, mensaje, MensajeDestino | Funcionalidad principal: recibe el mensaje (audio o texto), detecta origen si falta, procesa modismos/contexto emocional y genera el MensajeDestino por el mismo canal de entrada. Valida formato de audio compatible (mp3, wav, m4a), no vacío, dentro de límites de duración. |
| Consultar historial de conversaciones | identificador | Lista\<Conversacion\> | Recupera mensajes origen y destino vinculados al ID de conversación. |
| Registrar / Eliminar / Consultar Conversación | — | — | CRUD estándar sobre la entidad. |

### Datos simulados (muestra)

| Identificador | Nombre | Usuario | Lenguaje por conversación |
| --- | --- | --- | --- |
| 1520f08a-... | Conversación 1 | Julian David | LC1 |
| cbe289b6-... | Conversación 2 | Diego Alejandro | LC2 |

---

## Lenguaje

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | La regla del lenguaje dice que el nombre no puede repetirse. |
| 2 | Simple | codigo | El codigo ISO (es, en, fr) identifica un idioma. |

Duda: si un mismo idioma se usara en varias regiones (Espanol de Antioquia y de Madrid), el nombre se repetiria y habria que cambiar la combinacion 1 a (nombre, region).

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 1–50 | Sí | Nombre del idioma. No puede repetirse. |
| identificador de región | Alfanumérico (UUID) | 36 | Sí | Región que usa el lenguaje. |
| codigo | Alfanumérico | 2–5 | Sí | Formato ISO 639-1 / 639-2 (es, en, fr, etc.). |
| activo | Lógico | — | Sí | Indica si el idioma está disponible para traducción. Default `false`. |

### Reglas de negocio y responsabilidades

| Responsabilidad | Regla | Descripción |
| --- | --- | --- |
| Listar lenguajes disponibles | — | El nombre de un lenguaje no puede repetirse; no pueden existir dos lenguajes con identificadores iguales. |
| Generar reporte de mala traducción | — | Permite reportar una mala traducción del modelo, promoviendo su mejora. |

### Datos simulados (muestra)

| Nombre | Región |
| --- | --- |
| Español | Antioquia |
| Inglés | California |
| Francés | Paris |
| Portugués | Rio de Janeiro |

---

## LenguajePorConversación

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Compuesta | conversacion + lenguaje | Un mismo lenguaje no puede estar dos veces en la misma conversacion. |

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 3–5 | Sí | Autogenerado y calculado, formato `LC{n}` incrementado por registro. |
| conversacion | Referencia a Conversación | — | Sí | Conversación a la que pertenece el lenguaje. |
| lenguaje | Referencia a Lenguaje | — | Sí | Lenguaje en el que está dada la conversación. |

### Reglas de negocio

No se puede modificar el identificador; no pueden existir dos registros con identificadores
iguales.

### Datos simulados (muestra)

| Nombre | Conversación | Lenguaje |
| --- | --- | --- |
| LC1 | Conversación 1 | Español |
| LC2 | Conversación 1 | Inglés |

---

## MensajeOriginal

**Combinaciones unicas (propuesta, validar con Farid):** ninguna. Dos mensajes pueden tener el mismo contenido ("Hola") en la misma conversacion.

| Atributo | Tipo | Longitud | Obligatorio | Sensible | Descripción |
| --- | --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | No | Autogenerado. |
| contenido | Texto | 1–5000 | Sí | **Sí** | Contenido textual del mensaje en su idioma original; no puede ser solo espacios. |
| fechaCreacion | Fecha | — | Sí | No | Autogenerado, no mayor a la actual. |
| lenguajeConversacion | Referencia a LenguajePorConversacion | — | Sí | Lenguaje en el que fue expresado el mensaje. |
| canal | Referencia a Canal | — | Sí | Canal por el cual se transmite el mensaje. |
| entonación | Referencia a Entonación | — | Sí | Entonación con la que se dio el mensaje. |

### Datos simulados (muestra)

| LenguajeConversación | Canal | Contenido | Entonación |
| --- | --- | --- | --- |
| LC1 | Voz | "Hay que ponerse las pilas con el trabajo" | Preocupado |
| LC2 | Voz | "Let's start now" | Neutral |

---

## MensajeDestino

**Combinaciones unicas (propuesta, validar con Farid):** ninguna por ahora. Si se decide que un mensaje original tiene una sola traduccion por lenguaje, seria (mensajeOriginal + lenguajeConversacion).

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| mensajeOriginal | Texto | 1–5000 | Sí | Contenido del mensaje original sin procesar. |
| contenidoTraducido | Texto | 1–5000 | Sí | Contenido del mensaje traducido/procesado. |
| fechaCreacion | Fecha | — | Sí | Autogenerado, no mayor a la actual. |
| estadoEntrega | Alfanumérico | 1–15 | Sí | Valores: `Pendiente` (default), `Enviado`, `Entregado`, `Fallido`. |
| lenguajeConversacion | Referencia a LenguajePorConversacion | — | Sí | Lenguaje en el que fue expresado el mensaje. |

### Datos simulados (muestra)

| LenguajeConversación | Mensaje Original | Contenido Traducido |
| --- | --- | --- |
| LC2 | "Hay que ponerse las pilas con el trabajo" | "We need to get cracking on the work." |
| LC1 | "Let's start now" | "Empecemos de una vez." |

---

## Canal

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No puede haber dos canales llamados "Voz" o "Texto". |

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 3–50 | Sí | Nombre descriptivo del canal (ej. Texto, Voz). |

### Responsabilidades

- Mostrar las opciones por las que se puede enviar o entregar un mensaje (cuadro de texto o
  captura por voz) una vez configuradas las opciones de traducción.
- Identificar el canal por el cual llegó el mensaje y establecerlo por defecto para el resto de
  la conversación.
- Entregar el mensaje traducido aplicando el canal configurado.

### Datos simulados

| Nombre |
| --- |
| Texto |
| Voz |

---

## Entonación

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No puede haber dos entonaciones con el mismo nombre. |

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 3–30 | Sí | Nombre de la entonación (Formal, Informal, Técnico, etc.). |
| activo | Booleano | — | Sí | Default `true`. Indica si está disponible para uso. |

### Responsabilidades

- Identificar el tono y matices de un mensaje origen recibido.
- Aplicar el tono y matices identificados al mensaje destino generado.

### Datos simulados

| Nombre |
| --- |
| Preocupado |
| Amigable |
| Neutral |
| Enojado |

---

## Región

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Compuesta | nombre + identificador de pais | El nombre de una region no se repite dentro del mismo pais (caso del ejemplo de Farid). Si puede repetirse en paises distintos. |

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 2–100 | Sí | Nombre de la región geográfica. |
| identificador de País | Alfanumérico (UUID) | 36 | Sí | País al que pertenece la región. |

### Responsabilidades

- Listar regiones disponibles al configurar opciones de traducción.
- Configurar región destino para la conversación.
- Identificar automáticamente la región origen a partir del mensaje.
- Aplicar matices culturales de la región destino al mensaje de forma automática.

### Datos simulados

| Nombre | País |
| --- | --- |
| Antioquia | Colombia |
| California | Estados Unidos |
| Paris | Francia |
| Rio de Janeiro | Brasil |

---

## País

**Combinaciones unicas (propuesta, validar con Farid):**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No pueden existir dos paises con el mismo nombre. |
| 2 | Simple | codigo | No debe repetirse el codigo del pais (ISO 3166-1). |

| Atributo | Tipo | Longitud | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| identificador | Alfanumérico (UUID) | 36 | Sí | Autogenerado. |
| nombre | Alfanumérico | 1–50 | Sí | Nombre del país. **Combinación única.** |
| código | Alfanumérico | 2–5 | Sí | Formato ISO 3166-1 alfa-2 (CO, ES, MX, etc.). |

### Responsabilidades

- Identificar automáticamente el país al cual pertenece una región.

### Datos simulados

| Nombre |
| --- |
| Colombia |
| Estados Unidos |
| Francia |
| Brasil |

---

## Nota metodológica sobre combinaciones únicas (ya aplicada como propuesta a todas las entidades)

Explicada por el mentor en la sesión del 2026-08-15: las combinaciones únicas indican qué datos
no se pueden repetir dentro de un registro (numeradas Combinación Única 1, 2, 3... si hay más de
una, cada una con un color distintivo en la hoja de muestreo original). Pueden ser:

- **Simples**: un solo atributo no se repite (ej. País.nombre).
- **Compuestas**: la combinación de varios atributos no se repite, incluso si cada atributo por
  separado sí podría repetirse (ej. Región.nombre no se repite *dentro del mismo* País — la
  combinación (nombre, país) sí es única aunque "Antioquia" podría en teoría existir como nombre
  de región en otro país).

El identificador nunca se marca como combinación única (ya es único por definición). No es
obligatorio que un objeto de dominio tenga combinaciones únicas, pero es normal que tenga más de
una. **Este análisis está pendiente de aplicarse formalmente a Usuario, Conversación, Lenguaje,
LenguajePorConversación, MensajeOriginal, MensajeDestino, Canal y Entonación** — solo Región y
País tienen el caso ya identificado (aunque tampoco formalizado en tabla en este documento).
