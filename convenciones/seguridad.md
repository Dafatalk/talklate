# Convenciones — Seguridad y Protección de Datos

**Fase 0 · Línea Base Institucional (SoftVerse)**

---

## Aplica a

Todo el proyecto TalkLate, todos los componentes, todos los ambientes. Relevante especialmente porque TalkLate procesa **conversaciones y mensajes personales** (texto y voz) de los usuarios — contenido inherentemente sensible.

---

## 1. Clasificación de Datos

Toda entidad de datos del sistema debe clasificarse según la Matriz de Sensibilidad (F2, ver `requerimientos/matriz_sensibilidad_datos.md`):

| Clasificación | Descripción | Controles requeridos |
| --- | --- | --- |
| **Público** | Accesible sin autenticación | TLS en tránsito |
| **Interno** | Solo usuarios autenticados | TLS + autenticación JWT |
| **Confidencial** | Roles específicos con permisos | TLS + JWT + RBAC + logs de acceso |
| **PII** | Identifica personas naturales (correo, nombre, fecha de nacimiento, contenido de mensajes/conversaciones) | TLS + JWT + RBAC + cifrado en reposo + retención limitada |

> Según el Modelo de Dominio Enriquecido (`arquitectura/modelo_datos.md`), los atributos `correo` (Usuario) y `contenido` (MensajeOriginal) ya están marcados como **sensibles** — deben tratarse como PII desde el diseño.

## 2. Manejo de Secretos

| Regla | Detalle |
| --- | --- |
| Almacenamiento | Solo en Secret Manager / gestor de secretos, o variables de entorno fuera del repo |
| En código | PROHIBIDO — nunca hardcodeado en archivos fuente |
| En `.env` | Solo para desarrollo local, listado en `.gitignore` |
| Rotación | Credenciales de BD y API keys (incluyendo las del motor de traducción/IA) rotan periódicamente |

## 3. Autenticación

| Aspecto | Estándar |
| --- | --- |
| Protocolo | JWT (JSON Web Token) firmado por proveedor de identidad |
| Sesiones | Tokens con expiración (access corto, refresh más largo) |
| Recuperación de contraseña | Código con tiempo de validez limitado (ver Usuario-RN-8 en `arquitectura/modelo_datos.md`) |

## 4. Autorización

| Principio | Detalle |
| --- | --- |
| Granularidad | Por recurso/acción a medida que existan roles más allá de "Cliente Traductor" |
| Principio de mínimo privilegio | Cada rol solo tiene los permisos estrictamente necesarios |

## 5. Seguridad en Tránsito

| Capa | Medida |
| --- | --- |
| Cliente → Backend | TLS 1.2+ obligatorio |
| Backend → Motor de traducción/IA | TLS obligatorio, especialmente si es un servicio de terceros |
| Backend → BD | Conexión cifrada |

## 6. Seguridad en Reposo

| Dato | Medida |
| --- | --- |
| BD transaccional | Cifrado por defecto del proveedor |
| Contenido de mensajes (MensajeOriginal, MensajeDestino) | Cifrado adicional recomendado dado que almacenan comunicación personal |
| Backups | Cifrado automático |

## 7. Seguridad de Aplicación

| Medida | Implementación |
| --- | --- |
| Validación de inputs | Según reglas de negocio definidas por entidad en `arquitectura/modelo_datos.md` |
| SQL Injection | ORM — nunca SQL concatenado |
| Rate limiting | En la capa de API, especialmente sobre los endpoints de traducción (costo de cómputo/IA) |
| CORS | Configuración centralizada, orígenes explícitos |
| Dependency scanning | Automatizado en pipeline CI cuando exista |

## 8. Logging de Seguridad

| Evento | Se loguea |
| --- | --- |
| Login exitoso/fallido | Sí (sin contraseña) |
| Cambio de permisos | Sí |
| Acceso a contenido de conversaciones | Sí |
| Errores de autenticación/autorización | Sí |

**NUNCA loguear**: contraseñas, tokens JWT completos, contenido textual/de audio de los mensajes de los usuarios.

## 9. Cumplimiento Regulatorio

| Regulación | Aplica si | Medidas clave |
| --- | --- | --- |
| Ley 1581/2012 (Colombia) | Datos personales de ciudadanos colombianos | Consentimiento, finalidad, minimización, derecho al olvido |
| Protección de menores | Registro de usuarios | Edad mínima 13 años (ver Usuario-RN-2 en `arquitectura/modelo_datos.md`) |
| GDPR | Si hay usuarios en la UE | Consentimiento explícito, portabilidad, derecho al olvido |

## 10. Respuesta a Incidentes

| Paso | Acción |
| --- | --- |
| 1 | Detección |
| 2 | Contención (revocar accesos, aislar componentes) |
| 3 | Investigación |
| 4 | Remediación |
| 5 | Post-mortem |

---

*Convención de la Fase 0 (Línea Base Institucional) de SoftVerse.*
