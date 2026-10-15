# Backend TalkLate — SurrealDB como fuente de verdad

El backend usa **SurrealDB** como fuente de verdad a través de una capa de
adaptadores (repositorio). SQLite queda disponible solo como driver alterno para
tests offline.

## Arquitectura

```
rutas / lib/auth  ->  repositorio (interfaz async)  ->  SurrealDB (HTTP /sql)
                                                    \->  SQLite (node:sqlite, tests)
```

- `src/surreal.js` — conexión HTTP a SurrealDB (`/sql`), sin dependencias nuevas
  (usa el `fetch` global de Node 22). Serializa literales de forma segura y mapea
  record ids ⇄ ids de negocio.
- `src/repos/surreal.js` — **los adaptadores**: cada operación del dominio mapeada
  a SurrealQL (usuarios, auth, catálogo, conversaciones, mensajes, reportes).
- `src/repos/sqlite.js` — misma interfaz sobre SQLite (para `npm test`).
- `db/surreal/schema.surql` — esquema operativo SCHEMAFULL (se aplica idempotente
  al arrancar).
- `src/server.js` — elige driver con `DB_DRIVER` y conecta antes de escuchar.

El idioma origen/destino, cifrado de mensajes, JWT, rate limiting y reglas de
negocio no cambiaron: solo se movió el acceso a datos detrás del repositorio.

## Configuración (variables de entorno)

| Variable | Default | Descripción |
|---|---|---|
| `DB_DRIVER` | `surreal` | `surreal` (fuente de verdad) o `sqlite` (tests/offline) |
| `SURREAL_URL` | `http://127.0.0.1:8000` | Endpoint HTTP de SurrealDB |
| `SURREAL_NS` | `talklate` | Namespace |
| `SURREAL_DB` | `app` | Base de datos |
| `SURREAL_USER` / `SURREAL_PASS` | `root` / `root` | Credenciales |
| `SURREAL_TIMEOUT_MS` | `15000` | Timeout por consulta |

## Levantar en local

```bash
# 1. Instancia SurrealDB persistente (desde la raíz del repo)
surreal start --user root --pass root surrealkv://.surrealdb/talklate.db

# 2. Dependencias del backend
cd backend && npm install

# 3. Backend apuntando a SurrealDB (aplica esquema + semilla al arrancar)
DB_DRIVER=surreal JWT_SECRET=dev TALKLATE_CLAVE_CIFRADO=dev npm run dev
```

`GET /health` incluye el estado de la conexión a SurrealDB (`db.ok`).

## Verificación

```bash
# Adaptadores contra la instancia (prueba de humo de los repos)
node scripts/verificar-surreal.js

# Flujo HTTP completo contra un backend corriendo (DB_DRIVER=surreal)
BASE=http://127.0.0.1:3100 node scripts/smoke-http.js

# Suite offline (usa el driver SQLite)
npm test
```

## Notas

- El esquema operativo refleja el dominio del backend (nombres en español,
  record links). El esquema en inglés de `seguimiento/follow-up/modelo_dominio/`
  queda como modelo de dominio de referencia.
- `ns/db` se crean solos al conectar (`DEFINE NAMESPACE/DATABASE IF NOT EXISTS`).
- El store `.surrealdb/` está en `.gitignore` (datos locales, no se versiona).
