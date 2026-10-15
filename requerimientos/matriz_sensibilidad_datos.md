# Matriz de sensibilidad de datos - TalkLate

**Fase 2 - exigida por `convenciones/seguridad.md` seccion 1.** Clasifica cada dato del sistema y dice que control lo protege y donde esta implementado.

Clasificaciones: **Publico**, **Interno** (solo usuarios autenticados), **Confidencial** (roles especificos), **PII** (identifica personas naturales).

| Entidad | Dato | Clasificacion | Controles | Donde se implementa |
| --- | --- | --- | --- | --- |
| Usuario | identificador | Interno | JWT | `backend/src/lib/auth.js` |
| Usuario | nombre, apellido | PII | JWT, solo el dueno lo ve, se borra al eliminar la cuenta | `routes/auth.js` (`/usuarios/yo`) |
| Usuario | correo | PII | JWT; nunca se escribe en los logs; unico (Usuario-RN-1) | `lib/log.js` filtra `correo` |
| Usuario | fecha de nacimiento | PII | Solo para validar la edad minima (13 anos); no se muestra a terceros | `lib/validaciones.js` |
| Usuario | contrasena | Confidencial | Solo se guarda el hash (bcrypt); nunca en logs ni respuestas | `routes/auth.js` |
| Usuario | rol | Confidencial | Solo el servidor lo asigna; RBAC en rutas de administrador | `lib/auth.js` (`requerirAdmin`) |
| Usuario | consentimiento de datos | PII | Fecha de aceptacion de la politica (Ley 1581) | `usuario.consentimiento_datos` |
| Sesion | token de acceso | Confidencial | JWT de 15 minutos, revocable; nunca en logs | `lib/auth.js` |
| Sesion | token de refresco | Confidencial | 30 dias, se guarda solo su hash, se rota y se revoca al cerrar sesion | tabla `token_refresco` |
| Recuperacion | codigo de 6 digitos | Confidencial | Hash, 15 minutos, un solo uso, limite de solicitudes; nunca en logs | `routes/auth.js` |
| Conversacion | nombre, fechas | PII (asociado a la persona) | Solo el dueno; se borra con la cuenta | `routes/conversaciones.js` |
| MensajeOriginal | contenido (texto o voz transcrita) | PII | **Cifrado en reposo** AES-256-GCM; solo el dueno; nunca en logs; se borra con la conversacion o la cuenta | `lib/cifrado.js` |
| MensajeDestino | contenido traducido | PII | Igual que el mensaje original | `lib/cifrado.js` |
| MensajeDestino | nota cultural, motor, estado | Interno | JWT | - |
| Reporte | motivo, sugerencia | PII | Solo el autor (al crearlo) y el administrador; se borra con la cuenta | `routes/reportes.js` |
| Lenguaje, Region, Pais, Canal, Entonacion | catalogo | Interno | JWT para leer; solo administrador para cambiar | `routes/catalogo.js` |
| Logs | eventos | Interno | JSON, solo identificadores (nunca correo, contrasena, token, codigo ni contenido) | `lib/log.js` |

## Envio a terceros

- **Qwen local (Ollama):** corre en el servidor de TalkLate; el contenido no sale a terceros.
- **Claude Sonnet (respaldo):** si se usa, el texto del mensaje se envia a Anthropic para traducirlo. Se informa en la politica de tratamiento de datos (`politica_tratamiento_datos.md`), que el usuario acepta al registrarse.

## Retencion

Los datos se conservan mientras la cuenta exista. La persona puede borrar conversaciones o su cuenta completa en cualquier momento (derecho al olvido). Los tokens revocados y vencidos se limpian automaticamente.

## Pendiente para produccion

- TLS (HTTPS) en todos los tramos y cifrado de la base y los respaldos por el proveedor (hoy es SurrealDB local).
- Servicio de correo real para el codigo de recuperacion.
