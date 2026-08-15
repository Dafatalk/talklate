# Convenciones — Diseño de APIs REST

**Fase 0 · Línea Base Institucional (SoftVerse)**

---

## Aplica a

Todos los servicios backend del proyecto TalkLate, una vez definido el stack (F3).

---

## 1. Estructura de URLs

```
{protocolo}://{host}/api/v{version}/{recurso}
```

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Base path | `/api/v1/` | `https://api.talklate.com/api/v1/` |
| Recurso | plural, kebab-case | `/conversaciones`, `/lenguajes` |
| Sub-recurso | anidado | `/conversaciones/{id}/mensajes` |
| Máximo anidamiento | 2 niveles | `/conversaciones/{id}/mensajes/{id}` |

## 2. Métodos HTTP

| Método | Uso | Idempotente | Body |
| --- | --- | --- | --- |
| `GET` | Obtener recurso(s) | Sí | No |
| `POST` | Crear recurso | No | Sí |
| `PUT` | Reemplazar recurso completo | Sí | Sí |
| `PATCH` | Actualizar parcialmente | No | Sí |
| `DELETE` | Eliminar recurso | Sí | No |

## 3. Códigos de Respuesta

| Código | Significado | Cuándo usar |
| --- | --- | --- |
| `200` | OK | GET exitoso, PUT/PATCH exitoso |
| `201` | Created | POST exitoso (incluir header `Location`) |
| `204` | No Content | DELETE exitoso |
| `400` | Bad Request | Validación fallida |
| `401` | Unauthorized | Token faltante o inválido |
| `403` | Forbidden | Token válido pero sin permisos |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Duplicado o conflicto de estado |
| `422` | Unprocessable Entity | Regla de negocio violada (ej. par de idiomas no soportado) |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error no controlado |

## 4. Formato de Respuesta

### Respuesta exitosa (recurso)

```json
{
  "identificador": "uuid",
  "campo1": "valor",
  "fechaCreacion": "2026-08-15T10:00:00Z"
}
```

### Respuesta exitosa (lista con paginación)

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Respuesta de error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "El campo 'correo' es obligatorio",
  "timestamp": "2026-08-15T10:00:00Z",
  "path": "/api/v1/usuarios"
}
```

> Los mensajes de error orientados al usuario final deben seguir el tono ya definido en las reglas de negocio de `arquitectura/modelo_datos.md` (ej. "El correo electrónico ingresado ya está registrado en TalkLate. Por favor inicie sesión.").

## 5. Paginación

| Parámetro | Default | Ejemplo |
| --- | --- | --- |
| `page` | 1 | `?page=2` |
| `limit` | 20 | `?limit=50` (máximo 100) |
| `sort` | `fechaCreacion,desc` | `?sort=nombre,asc` |

## 6. Versionado

- En la URL: `/api/v1/`, `/api/v2/`.
- Solo crear nueva versión si hay breaking changes.

## 7. Autenticación

```
Authorization: Bearer <jwt>
```

## 8. Health Check

Todo servicio expone:

```
GET /health
```

## 9. Documentación

- Toda API documentada con OpenAPI 3.0 (Swagger) una vez exista implementación.

---

*Convención de la Fase 0 (Línea Base Institucional) de SoftVerse.*
