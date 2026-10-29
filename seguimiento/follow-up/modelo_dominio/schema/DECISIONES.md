# Decisiones de diseño — Schema SurrealDB TalkLate

Resoluciones frente a ambigüedades del Excel *Modelo de Dominio Enriquecido*.

## Idioma de los identificadores

- **Tablas y campos en inglés, snake_case** (2026-10-14). El dominio del Excel está en español,
  pero el schema y el seed usan nombres en inglés para alinearse con la convención de artefactos
  técnicos. Mapa tabla ES → EN: `pais`→`country`, `lenguaje`→`language`, `usuario`→`user`,
  `canal`→`channel`, `entonacion`→`tone`, `conversacion`→`conversation`,
  `lenguaje_por_conversacion`→`conversation_language`, `mensaje_original`→`original_message`,
  `mensaje_destino`→`translated_message`. `region` ya era inglés.
- Los **valores de enum** también van en inglés: `delivery_status INSIDE ['Pending','Sent','Delivered','Failed']`.

## Identificadores

- **IDs nativos SurrealDB:** se usa `id` del record (`country:uuid`, etc.) en lugar de un campo `identifier` UUID duplicado. Crear con `CREATE table:rand::uuid() SET ...` o dejando que Surreal asigne el id.
- **Claves de negocio** (email, códigos ISO, nombres de catálogo) se modelan como campos + índices `UNIQUE`, no como PK.

## Referencias tipadas (record links)

- `language.region` → `record<region>` (Excel traía UUID alfanumérico).
- `region.country` → `record<country>` (Excel traía UUID alfanumérico).
- Resto de FKs ya tipadas como objetos de dominio → `record<table>` con nombres snake_case.

## Conversation ↔ ConversationLanguage

- **Cardinalidad 1:N** modelada solo con `conversation_language.conversation`.
- **No** se define `conversation_language` (singular) en `conversation`: el Excel lo marca como N:1, pero los datos simulados asocian LC1 y LC2 a la misma “Conversación 1”.
- Así se evita la relación circular y se alinea con el patrón puente.

## TranslatedMessage ↔ OriginalMessage

- Se agrega `translated_message.original_message` como `record<original_message>` (enlace tipado).
- Se **elimina** el campo de texto libre `mensajeOriginal` del Excel (duplicaba contenido).
- Se conserva `translated_content`.
- Motivo: integridad referencial y un solo origen de verdad del contenido original.

## User y contraseña

- Se agrega `password_hash` (`string`): aparece en datos simulados y RN-4..RN-9, pero **no** en la lista de atributos del Excel.
- Solo se almacena el **hash**, nunca plaintext (validación de complejidad en la aplicación).
- `email` es UNIQUE e identificador de negocio; `birth_date` **no** se trata como identificador (el Excel lo marcaba por error junto con el correo).
- `birth_date` como `datetime` con ASSERT `<= time::now()`; edad ≥ 13 años (RN-2) se valida en aplicación.
- `nombre`/`apellido` del Excel → `first_name`/`last_name`.

## Enums y defaults

- `translated_message.delivery_status`: ASSERT `INSIDE ['Pending','Sent','Delivered','Failed']`, default `'Pending'`.
- `language.active` default `false`; `tone.active` default `true` (según Excel).
- `conversation.name` default `'New Conversation'`.
- `started_at` / `created_at`: `datetime` con default `time::now()` (aunque el Excel tipara a veces solo “Fecha”, las descripciones y datos simulados incluyen hora).

## Nombres y convenciones

- Tablas y campos en **snake_case inglés**: `birth_date`, `started_at`, `created_at`, `translated_content`, `delivery_status`, `password_hash`, `conversation_language`, etc.
- `country.code` (sin tilde) en lugar de `código` del Excel, para consistencia ASCII en SurrealQL.
- Typos del Excel ignorados en schema: “Lenguage”, “Paisales”, etc.

## Índices UNIQUE

| Tabla | Campos |
|---|---|
| `user` | `email` |
| `language` | `name`; `code` |
| `channel` | `name` |
| `tone` | `name` |
| `country` | `name`; `code` |
| `region` | `name` + `country` |
| `conversation_language` | `conversation` + `language` |

## Datos base del seed (`seed_catalogos.surql`)

- **Alcance regional acotado** a dos contextos: inglés → `country:united_states` / `region:miami`,
  y español → `country:colombia` / `region:antioquia`.
- Incluye catálogos (country, region, language, channel, tone) **y** datos transaccionales
  (user, conversation, conversation_language, original_message, translated_message) que replican
  las muestras de simulación de `arquitectura/modelo_datos.md` y las RN (email único y válido,
  solo `password_hash`, edad ≥ 13, unicidad compuesta de region, enum de `delivery_status`).
- Las traducciones del seed son **conscientes del matiz cultural** (ej. “parcero” → “buddy”),
  acorde a la visión de TalkLate, no literales palabra por palabra.

## Fuera de alcance del schema

- Permisos finos (`PERMISSIONS`) omitidos; aplicar según despliegue.
- Tokens de sesión / códigos de recuperación: no son entidades del workbook; viven en capa de auth.
- Herencia: no hay en el dominio.
