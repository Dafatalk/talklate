# 16. Matriz de sensibilidad de datos - TalkLate

**Fase 2 - Version 1.0 (29/10/2026).** Clasifica cada dato del sistema y dice que control lo protege y donde esta implementado.

Clasificaciones: **Publico**, **Interno** (solo usuarios autenticados), **Confidencial** (roles especificos), **PII** (identifica personas naturales).

| Entidad | Dato | Clasificacion | Controles | Donde se implementa |
| --- | --- | --- | --- | --- |
| Usuario | identificador | Interno | JWT | `backend/src/aplicacion/sesiones.js` |
| Usuario | nombre, apellido | PII | JWT, solo el dueno lo ve, se borra al eliminar la cuenta | `aplicacion/cuentas.js` (`/usuarios/yo`) |
| Usuario | correo | PII | JWT; nunca se escribe en los logs; unico (Usuario-RN-1) | `compartido/log.js` filtra `correo` |
| Usuario | fecha de nacimiento | PII | Solo para validar la edad minima (13 anos); no se muestra a terceros | `dominio/validaciones.js` |
| Usuario | contrasena | Confidencial | Solo se guarda el hash (bcrypt); nunca en logs ni respuestas | `aplicacion/cuentas.js` |
| Usuario | rol | Confidencial | Solo el servidor lo asigna; RBAC en rutas de administrador | `adaptadores/http/sesion.js` (`requerirAdmin`) |
| Usuario | consentimiento de datos | PII | Fecha de aceptacion de la politica (Ley 1581) | `usuario.consentimiento_datos` |
| Sesion | token de acceso | Confidencial | JWT de 15 minutos, revocable; nunca en logs | `aplicacion/sesiones.js` |
| Sesion | token de refresco | Confidencial | 30 dias, se guarda solo su hash, se rota y se revoca al cerrar sesion | tabla `token_refresco` |
| Recuperacion | codigo de 6 digitos | Confidencial | Hash, 15 minutos, un solo uso, limite de solicitudes; nunca en logs | `aplicacion/cuentas.js` |
| Conversacion | nombre, fechas | PII (asociado a la persona) | Solo el dueno; se borra con la cuenta | `aplicacion/conversaciones.js` |
| MensajeOriginal | contenido (texto o voz transcrita) | PII | **Cifrado en reposo** AES-256-GCM; solo el dueno; nunca en logs; se borra con la conversacion o la cuenta | `adaptadores/cifrado/aesGcm.js` |
| MensajeDestino | contenido traducido | PII | Igual que el mensaje original | `adaptadores/cifrado/aesGcm.js` |
| Mensaje hablado | audio grabado y medidas de volumen | PII | Viaja por HTTPS, se transcribe en el servidor (Whisper local) y no se guarda: solo queda el texto cifrado; tipo y tamano validados (maximo 10 MB) | `aplicacion/conversaciones.js` |
| Voz sintetizada | audio de la traduccion | PII | Solo en memoria del servidor, con id aleatorio de 128 bits que vence en 5 minutos; nunca en la base ni en logs | `aplicacion/voz.js` |
| MensajeDestino | nota cultural, motor, estado | Interno | JWT | - |
| Reporte | motivo, sugerencia | PII | Solo el autor (al crearlo) y el administrador; se borra con la cuenta | `aplicacion/reportes.js` |
| Lenguaje, Region, Pais, Canal, Entonacion | catalogo | Interno | JWT para leer; solo administrador para cambiar | `aplicacion/catalogo.js` |
| Logs | eventos | Interno | JSON, solo identificadores (nunca correo, contrasena, token, codigo ni contenido) | `compartido/log.js` |

## Envio a terceros

- **Qwen local (Ollama):** corre en el servidor de TalkLate; el contenido no sale a terceros.
- **Whisper y VoiceStudio locales:** corren en el servidor de TalkLate; el audio y la traduccion no salen a terceros.
- **Claude Sonnet (respaldo de traduccion):** si se usa, el texto del mensaje se envia a Anthropic para traducirlo.
- **Azure Speech u OpenAI (respaldo de voz):** si se usan, reciben solo el texto ya traducido para convertirlo en voz.
- Estos envios se informan en la politica de tratamiento de datos (`17_politica_tratamiento_datos.md`), que el usuario acepta al registrarse.

## Retencion

Los datos se conservan mientras la cuenta exista. La persona puede borrar conversaciones o su cuenta completa en cualquier momento (derecho al olvido). Los tokens revocados y vencidos se limpian automaticamente.

## Controles de infraestructura en produccion

- TLS (HTTPS) en todos los tramos.
- Cifrado de la base y de los respaldos por el proveedor (SurrealDB Cloud).
- Proveedor de correo conectado al puerto `Notificador` para el codigo de recuperacion.
