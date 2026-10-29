# 12. Modelo de datos - TalkLate

**Fase 3 - Arquitectura de software y base de datos**

**Version:** 1.0 (29/10/2026). Fuente: modelo de dominio enriquecido del proyecto.

Cada entidad documenta sus atributos, sus reglas de negocio y sus **combinaciones unicas**
(restricciones de unicidad simples o compuestas). Las combinaciones unicas salen de las reglas de
negocio de cada entidad y estan implementadas como indices `UNIQUE` en el esquema de SurrealDB
(`backend/db/surreal/schema.surql`). La correspondencia con la base de datos esta al final.

Diagrama editable de referencia: `diagramas/modelo_dominio.drawio`.

---

## Objetos de dominio

| Objeto de dominio | Descripcion |
| --- | --- |
| Usuario | Entidad que define a un usuario registrado en la aplicacion, guardando de el sus datos personales y de interes. |
| Conversacion | Entidad que representa una sesion de comunicacion entre usuarios, conteniendo multiples mensajes intercambiados a traves de un canal especifico. |
| Lenguaje | Entidad que representa un idioma disponible en el sistema para traduccion y comunicacion. |
| LenguajePorConversacion | Entidad de relacion que almacena las configuraciones de idioma especificas para cada conversacion individual. |
| MensajeOriginal | Entidad que almacena el contenido original del mensaje antes de cualquier procesamiento o traduccion. |
| MensajeDestino | Entidad que almacena el mensaje procesado/traducido listo para ser entregado al destinatario en su idioma preferido. |
| Canal | Entidad que define el medio a traves del cual se transmiten los mensajes. |
| Entonacion | Entidad que define el tono o estilo comunicativo a aplicar en los mensajes (formal, informal, tecnico, etc.). |
| Region | Entidad que representa una region geografica que puede influir en variaciones dialectales y culturales del lenguaje. |
| Pais | Entidad que representa un pais especifico, utilizado para contexto geografico y configuraciones regionales. |

---

## Usuario

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | correo | Usuario-RN-1: no puede haber dos cuentas con el mismo correo. |

| Atributo | Tipo | Longitud | Obligatorio | Sensible | Descripcion |
| --- | --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | No | Identifica de manera unica a un usuario. Autogenerado. |
| nombre | Alfanumerico | 1–50 | Si | No | Nombre del usuario. |
| apellido | Alfanumerico | 1–50 | Si | No | Apellido del usuario. |
| correo | Alfanumerico | 5–320 | Si | **Si** | Correo electronico, usado para contacto privado y seguridad. |
| fechaNacimiento | Fecha | — | Si | **Si** | Fecha de nacimiento; no puede ser mayor a la actual. |
| contrasena | Alfanumerico (hash bcrypt) | 60 | Si | **Si** | Solo se guarda el hash (Usuario-RN-4); nunca se devuelve ni se registra. |
| rol | Alfanumerico | 5–7 | Si | No | `cliente` (por defecto) o `admin`. Lo asigna el sistema. |
| consentimientoDatos | Fecha y tiempo | — | Si | **Si** | Cuando acepto la politica de tratamiento de datos (Ley 1581 de 2012). |

### Responsabilidades y reglas de negocio

| Responsabilidad | Entrada | Salida | Regla | Descripcion | Excepcion | Respuesta al usuario |
| --- | --- | --- | --- | --- | --- | --- |
| Registrar Usuario | identificador, nombre, apellido, correo, fecha de nacimiento | estado, mensaje | Usuario-RN-1 | Verificar que el correo no este asociado previamente a una cuenta activa. | Ya existe un usuario con el mismo correo | "El correo electronico ingresado ya esta registrado en TalkLate. Por favor inicie sesion." |
| Registrar Usuario | | | Usuario-RN-2 | La edad calculada desde la fecha de nacimiento debe ser ≥ 13 anos. | Usuario menor de 13 anos | "Lo sentimos, debes ser mayor de 13 anos para crear una cuenta." |
| Registrar Usuario | | | Usuario-RN-3 | El correo debe cumplir el formato estandar (usuario@dominio.com). | Formato invalido | "El formato del correo es invalido. Por favor reviselo." |
| Registrar Usuario | | | Usuario-RN-4 | La contrasena debe tener minimo 8 caracteres, incluyendo mayuscula, numero y caracter especial. | Contrasena debil | "La contrasena es debil. Debe tener al menos 8 caracteres, numeros y simbolos." |
| Iniciar sesion | correo, contrasena | estado, mensaje, token | Usuario-RN-5 | Verificar que el correo exista y la contrasena coincida. | Credenciales incorrectas | "Usuario o contrasena incorrectos. Por favor verifique sus credenciales." |
| Solicitar Recuperacion de contrasena | correo | estado, mensaje | Usuario-RN-6 | Buscar cuenta activa vinculada al correo. | Correo no registrado | "No encontramos una cuenta asociada a este correo electronico." |
| Solicitar Recuperacion de contrasena | | | Usuario-RN-7 | Verificar envio exitoso del correo con el codigo. | Fallo en servicio de mensajeria | "Ocurrio un error al enviar el codigo. Por favor intente nuevamente mas tarde." |
| Restablecer Contrasena | correo, codigo, nueva contrasena | estado, mensaje | Usuario-RN-8 | El codigo debe coincidir con el generado y no haber expirado (ej. 15 min). | Codigo incorrecto/expirado | "El codigo de verificacion es invalido o ha expirado. Solicite uno nuevo." |
| Restablecer Contrasena | | | Usuario-RN-9 | La nueva contrasena debe cumplir las mismas politicas que Usuario-RN-4. | Contrasena no valida | "La nueva contrasena no es segura. Use al menos 8 caracteres, numeros y simbolos." |
| Cerrar Sesion | — | estado, mensaje | Usuario-RN-10 | El token de autenticacion debe ser valido, no expirado y corresponder a una sesion activa. | Sesion inactiva | "La sesion ya ha expirado o no es valida." |

### Datos simulados (muestra)

| Identificador | Nombre | Apellido | Correo | Fecha de nacimiento |
| --- | --- | --- | --- | --- |
| f256dadb-... | Julian David | Diaz Medina | diazjulian460@gmail.com | 2002-04-16 |
| d72f77e6-... | Diego Alejandro | Franco Atehortua | dafa123.daf@gmail.com | 2002-04-29 |

---

## Conversacion

**Combinaciones unicas:** ninguna. El nombre tiene valor por defecto "Nueva Conversacion", asi que se repite. El identificador no cuenta porque ya es unico.

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 3–80 | Si | Default "Nueva Conversacion"; no puede contener caracteres especiales o palabras ofensivas (Conversacion-RN-4). No se puede modificar el identificador (Conversacion-RN-5). |
| fecha y hora de inicio | Fecha y tiempo | — | Si | Autogenerado. |
| usuario | Referencia a Usuario | — | Si | Usuario que crea la conversacion. |
| lenguajePorConversacion | Referencia a LenguajePorConversacion | — | Si | Configuracion de idiomas de la conversacion. |

### Reglas de negocio

| Regla | Descripcion |
| --- | --- |
| Conversacion-RN-1 | Una conversacion debe tener definido un idioma destino antes de iniciar la traduccion; la Region seleccionada debe ser valida para el Lenguaje elegido. |
| Conversacion-RN-2 | El idioma origen se detecta automaticamente con el primer mensaje (de voz o de texto) y no puede cambiar durante esa conversacion. |
| Conversacion-RN-3 | Los pares de idiomas origen-destino deben estar soportados por el sistema antes de iniciar la conversacion. |
| Conversacion-RN-4 | El nombre de la conversacion no puede contener caracteres especiales o palabras ofensivas. |
| Conversacion-RN-5 | No se puede modificar el identificador. |

### Responsabilidades

| Responsabilidad | Entrada | Salida | Descripcion |
| --- | --- | --- | --- |
| Configurar Parametros de Traduccion | Lenguaje, Region | estado, mensaje | Establece el contexto antes de enviar mensajes; idioma y region destino obligatorios, origen opcional. |
| Traducir Mensaje | MensajeOriginal | estado, mensaje, MensajeDestino | Funcionalidad principal: recibe el mensaje (audio o texto), detecta origen si falta, procesa modismos/contexto emocional y genera el MensajeDestino por el mismo canal de entrada. Valida formato de audio compatible (mp3, wav, m4a), no vacio, dentro de limites de duracion. |
| Consultar historial de conversaciones | identificador | Lista\<Conversacion\> | Recupera mensajes origen y destino vinculados al ID de conversacion. |
| Registrar / Eliminar / Consultar Conversacion | — | — | CRUD estandar sobre la entidad. |

### Datos simulados (muestra)

| Identificador | Nombre | Usuario | Lenguaje por conversacion |
| --- | --- | --- | --- |
| 1520f08a-... | Conversacion 1 | Julian David | LC1 |
| cbe289b6-... | Conversacion 2 | Diego Alejandro | LC2 |

---

## Lenguaje

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | La regla del lenguaje dice que el nombre no puede repetirse. |
| 2 | Simple | codigo | El codigo ISO (es, en, fr) identifica un idioma. |

Como la region ya no es un atributo del lenguaje sino una relacion muchos a muchos (`LenguajeRegion`), el nombre del lenguaje si puede ser unico: "Espanol" existe una vez y se relaciona con Antioquia, Bogota, Madrid, etc. Decision registrada en ADR-008.

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 1–50 | Si | Nombre del idioma. No puede repetirse. |
| regiones | Referencia a Region (varias) | — | No | Regiones donde se habla el lenguaje (relacion muchos a muchos `LenguajeRegion`, ver abajo). |
| codigo | Alfanumerico | 2–5 | Si | Formato ISO 639-1 / 639-2 (es, en, fr, etc.). |
| activo | Logico | — | Si | Indica si el idioma esta disponible para traduccion. Default `false`. |

### Reglas de negocio y responsabilidades

| Responsabilidad | Regla | Descripcion |
| --- | --- | --- |
| Listar lenguajes disponibles | — | El nombre de un lenguaje no puede repetirse; no pueden existir dos lenguajes con identificadores iguales. |
| Generar reporte de mala traduccion | — | Permite reportar una mala traduccion del modelo, promoviendo su mejora. |

### Datos simulados (muestra)

| Nombre | Region |
| --- | --- |
| Espanol | Antioquia |
| Ingles | California |
| Frances | Paris |
| Portugues | Rio de Janeiro |

---

## LenguajePorConversacion

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Compuesta | conversacion + lenguaje | Un mismo lenguaje no puede estar dos veces en la misma conversacion. |

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 3–5 | Si | Autogenerado y calculado, formato `LC{n}` incrementado por registro. |
| conversacion | Referencia a Conversacion | — | Si | Conversacion a la que pertenece el lenguaje. |
| lenguaje | Referencia a Lenguaje | — | Si | Lenguaje en el que esta dada la conversacion. |

### Reglas de negocio

No se puede modificar el identificador; no pueden existir dos registros con identificadores
iguales.

### Datos simulados (muestra)

| Nombre | Conversacion | Lenguaje |
| --- | --- | --- |
| LC1 | Conversacion 1 | Espanol |
| LC2 | Conversacion 1 | Ingles |

---

## MensajeOriginal

**Combinaciones unicas:** ninguna. Dos mensajes pueden tener el mismo contenido ("Hola") en la misma conversacion.

| Atributo | Tipo | Longitud | Obligatorio | Sensible | Descripcion |
| --- | --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | No | Autogenerado. |
| contenido | Texto | 1–5000 | Si | **Si** | Contenido textual del mensaje en su idioma original; no puede ser solo espacios. |
| fechaCreacion | Fecha | — | Si | No | Autogenerado, no mayor a la actual. |
| lenguajeConversacion | Referencia a LenguajePorConversacion | — | Si | Lenguaje en el que fue expresado el mensaje. |
| canal | Referencia a Canal | — | Si | Canal por el cual se transmite el mensaje. |
| entonacion | Referencia a Entonacion | — | Si | Entonacion con la que se dio el mensaje. |

### Datos simulados (muestra)

| LenguajeConversacion | Canal | Contenido | Entonacion |
| --- | --- | --- | --- |
| LC1 | Voz | "Hay que ponerse las pilas con el trabajo" | Preocupado |
| LC2 | Voz | "Let's start now" | Neutral |

---

## MensajeDestino

**Combinaciones unicas:** ninguna por ahora. Si se decide que un mensaje original tiene una sola traduccion por lenguaje, seria (mensajeOriginal + lenguajeConversacion).

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| mensajeOriginal | Referencia a MensajeOriginal | — | Si | Mensaje del que sale esta traduccion. |
| contenidoTraducido | Texto (cifrado) | 1–5000 | Si | Contenido del mensaje traducido; se guarda cifrado (AES-256-GCM). |
| notaCultural | Texto | 0–2000 | No | Explicacion del modismo adaptado, si lo hubo. |
| aproximada | Logico | — | Si | Verdadero si quedaron palabras sin traducir. |
| motor | Alfanumerico | 1–60 | Si | Motor que tradujo (`qwen:...`, `claude:...` o `local`). |
| fechaCreacion | Fecha | — | Si | Autogenerado, no mayor a la actual. |
| estadoEntrega | Alfanumerico | 1–15 | Si | Valores: `Pendiente` (default), `Enviado`, `Entregado`, `Fallido`. |
| lenguajeConversacion | Referencia a LenguajePorConversacion | — | Si | Lenguaje al que se tradujo el mensaje. |

### Datos simulados (muestra)

| LenguajeConversacion | Mensaje Original | Contenido Traducido |
| --- | --- | --- |
| LC2 | "Hay que ponerse las pilas con el trabajo" | "We need to get cracking on the work." |
| LC1 | "Let's start now" | "Empecemos de una vez." |

---

## Canal

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No puede haber dos canales llamados "Voz" o "Texto". |

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 3–50 | Si | Nombre descriptivo del canal (ej. Texto, Voz). |

### Responsabilidades

- Mostrar las opciones por las que se puede enviar o entregar un mensaje (cuadro de texto o
  captura por voz) una vez configuradas las opciones de traduccion.
- Identificar el canal por el cual llego cada mensaje (cada mensaje lleva su propio canal: la persona
  puede alternar entre hablar y escribir dentro de la misma conversacion).
- Entregar el mensaje traducido aplicando el canal configurado.

### Datos simulados

| Nombre |
| --- |
| Texto |
| Voz |

---

## Entonacion

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No puede haber dos entonaciones con el mismo nombre. |

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 3–30 | Si | Nombre de la entonacion. Catalogo inicial: Neutral, Amigable, Alegre, Preocupado, Enojado, Formal. |
| activo | Booleano | — | Si | Default `true`. Indica si esta disponible para uso. |

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

## Region

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Compuesta | nombre + identificador de pais | El nombre de una region no se repite dentro del mismo pais . Si puede repetirse en paises distintos. |

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 2–100 | Si | Nombre de la region geografica. |
| identificador de Pais | Alfanumerico (UUID) | 36 | Si | Pais al que pertenece la region. |

### Responsabilidades

- Listar regiones disponibles al configurar opciones de traduccion.
- Configurar region destino para la conversacion.
- Identificar automaticamente la region origen a partir del mensaje.
- Aplicar matices culturales de la region destino al mensaje de forma automatica.

### Datos simulados

| Nombre | Pais |
| --- | --- |
| Antioquia | Colombia |
| California | Estados Unidos |
| Paris | Francia |
| Rio de Janeiro | Brasil |

---

## Pais

**Combinaciones unicas:**

| N. | Tipo | Atributos | Por que |
| --- | --- | --- | --- |
| 1 | Simple | nombre | No pueden existir dos paises con el mismo nombre. |
| 2 | Simple | codigo | No debe repetirse el codigo del pais (ISO 3166-1). |

| Atributo | Tipo | Longitud | Obligatorio | Descripcion |
| --- | --- | --- | --- | --- |
| identificador | Alfanumerico (UUID) | 36 | Si | Autogenerado. |
| nombre | Alfanumerico | 1–50 | Si | Nombre del pais. **Combinacion unica.** |
| codigo | Alfanumerico | 2–5 | Si | Formato ISO 3166-1 alfa-2 (CO, ES, MX, etc.). |

### Responsabilidades

- Identificar automaticamente el pais al cual pertenece una region.

### Datos simulados

| Nombre |
| --- |
| Colombia |
| Estados Unidos |
| Francia |
| Brasil |

---

## LenguajeRegion (relacion)

Relacion muchos a muchos entre Lenguaje y Region: una region puede hablar varios idiomas (Texas: ingles y espanol) y un idioma se habla en varias regiones. Permite validar Conversacion-RN-1 ("la region seleccionada debe ser valida para el lenguaje elegido").

**Combinacion unica:** compuesta (lenguaje + region).

## Tablas de soporte (no son objetos de dominio)

Los reportes son dinamicos y no hacen parte del modelo de dominio. Estas tablas existen para que el sistema funcione y se documentan para que el modelo coincida con la base de datos (ADR-008):

| Tabla | Para que |
| --- | --- |
| `reporte` | Guarda el reporte de mala traduccion (responsabilidad "Generar reporte de mala traduccion" de Lenguaje): mensaje, motivo, sugerencia, estado. Combinacion unica: mensaje destino + usuario. |
| `token_refresco` | Sesiones: hash del token de refresco, vencimiento y si fue revocado. |
| `sesion_revocada` | Tokens de acceso invalidados al cerrar sesion (Usuario-RN-10). |
| `recuperacion` | Codigo de recuperacion de contrasena (hash, vencimiento de 15 minutos, usado) (Usuario-RN-8). |

## Correspondencia con la base de datos

Los nombres de las tablas siguen el modelo de dominio (lenguaje ubicuo, ADR-009): `usuario`, `conversacion`, `lenguaje`, `lenguaje_por_conversacion`, `mensaje_original`, `mensaje_destino`, `canal`, `entonacion`, `region`, `pais`, `lenguaje_region`. `MensajeOriginal.contenido` y `MensajeDestino.contenidoTraducido` se guardan cifrados (ver `16_matriz_sensibilidad_datos.md`).

## Nota metodologica sobre combinaciones unicas

Las combinaciones unicas indican que datos no se pueden repetir entre registros (numeradas 1, 2,
3... si hay mas de una). Pueden ser:

- **Simples**: un solo atributo no se repite (ej. Pais.nombre).
- **Compuestas**: la combinacion de varios atributos no se repite, aunque cada atributo por
  separado si pueda repetirse (ej. Region.nombre no se repite *dentro del mismo* Pais, pero
  "Antioquia" podria existir como region en otro pais).

El identificador nunca se marca como combinacion unica (ya es unico por definicion). No es
obligatorio que un objeto de dominio tenga combinaciones unicas, y puede tener mas de una.
