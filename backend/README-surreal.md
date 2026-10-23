# Backend TalkLate — SurrealDB como fuente de verdad

El backend usa **SurrealDB** como fuente de verdad a través de una capa de
adaptadores (repositorio). SQLite queda disponible solo como driver alterno para
tests offline. La decision esta en `arquitectura/decisiones.md` (ADR-012).

**Version requerida: SurrealDB 3.x** (probado con 3.0.4). El esquema usa funciones
de la v3 (`string::is_email`); con la 2.x no carga, y el backend lo revisa al arrancar.

## Arquitectura

```
casos de uso (src/aplicacion)  ->  puerto Repositorio (src/puertos)
                                      ^ lo cumplen:
                                      |- adaptador SurrealDB (HTTP /sql)
                                      |- adaptador SQLite (node:sqlite, pruebas)
```

El backend sigue una arquitectura hexagonal (ADR-013): los casos de uso solo conocen el
puerto `Repositorio`; la composicion (`src/composicion.js`) elige el adaptador con `DB_DRIVER`.

- `src/adaptadores/persistencia/surreal/cliente.js`: conexion HTTP a SurrealDB (`/sql`), sin dependencias nuevas
  (usa el `fetch` global de Node 22). Serializa literales de forma segura y mapea
  record ids a ids de negocio.
- `src/adaptadores/persistencia/surreal/repositorio.js`: el adaptador del puerto; cada operacion del dominio mapeada
  a SurrealQL (usuarios, auth, catalogo, conversaciones, mensajes, reportes).
- `src/adaptadores/persistencia/sqlite/`: el mismo puerto sobre SQLite (para `npm test`).
- `db/surreal/schema.surql`: esquema operativo SCHEMAFULL (se aplica idempotente
  al arrancar).
- `src/server.js` + `src/composicion.js`: eligen el adaptador con `DB_DRIVER` y conectan antes de escuchar.

## Configuración (variables de entorno)

| Variable | Default | Descripción |
|---|---|---|
| `DB_DRIVER` | `surreal` | `surreal` (fuente de verdad) o `sqlite` (tests/offline) |
| `SURREAL_URL` | instancia **remota** (SurrealDB Cloud) | Endpoint HTTP; acepta tambien `wss://host/rpc` y lo normaliza a `/sql`. Nunca apunta a local por defecto |
| `SURREAL_NS` | `talklate` | Namespace |
| `SURREAL_DB` | `app` | Base de datos |
| `SURREAL_USER` / `SURREAL_PASS` | — | Credenciales del usuario de BD (requeridas para el remoto). En produccion (`NODE_ENV=production`) no se acepta `root/root` |
| `SURREAL_TIMEOUT_MS` | `15000` | Timeout por consulta |

## Levantar (siempre contra el remoto)

El backend apunta por defecto a la instancia **remota** de SurrealDB Cloud; no se usa
ninguna instancia local. La configuración (URL, credenciales, claves) vive en
`backend/.env` (gitignoreado); `npm run dev` / `npm start` la cargan solas
(`--env-file-if-exists=.env`).

```bash
cd backend && npm install
npm run dev   # lee backend/.env y conecta al Cloud (aplica esquema + semilla al arrancar)
```

`backend/.env` debe traer al menos `SURREAL_USER` y `SURREAL_PASS` (usuario de BD con
rol suficiente), más `JWT_SECRET` y `TALKLATE_CLAVE_CIFRADO`. `GET /health` incluye el
estado de la conexión a SurrealDB (`db.ok`).

## Verificación

```bash
# Adaptadores contra la instancia (prueba de humo de los repos)
node scripts/verificar-surreal.js

# Flujo HTTP completo contra un backend corriendo (DB_DRIVER=surreal)
BASE=http://127.0.0.1:3100 node scripts/smoke-http.js

# La suite de la API completa contra SurrealDB (namespace nuevo en cada corrida).
# Usa un SurrealDB local (http://127.0.0.1:8000) salvo que se pase SURREAL_URL:
# las pruebas crean y borran datos, asi que no deben correr contra el remoto.
surreal start --user root --pass root memory &
npm run test:surreal

# Suite offline (usa el driver SQLite)
npm test
```

CI corre las dos: `backend` (SQLite) y `backend-surreal` (levanta SurrealDB 3.0.4).

## Notas

- **Idioma:** las tablas y campos del esquema están en **inglés** (`user`, `country`,
  `original_message`, …); el API/dominio siguen en español y el adaptador
  (`src/adaptadores/persistencia/surreal/repositorio.js`) traduce EN↔ES en cada operación. Los **valores de enum** se
  mantienen en español (origen/destino, usuario/interlocutor, Pendiente…, abierto…)
  porque la lógica de negocio y el API los usan tal cual.
- `ns/db` se crean solos al conectar (`DEFINE NAMESPACE/DATABASE IF NOT EXISTS`).
- **No se usa SurrealDB local**: el default de `SURREAL_URL` es la instancia remota.
- Conexion: se entra una vez con `/signin` y se reutiliza el token (Bearer). Mandar
  usuario y clave en cada consulta hacia que SurrealDB verificara la clave cada vez
  (unos 35 ms por consulta). Si el token vence, se entra de nuevo solo.
- `/health` solo dice si la base responde (`db.ok`); el detalle del error va al log,
  porque el endpoint es publico.
- El token de refresco se revoca y se lee en un solo paso (`tokens.consumir`), para que
  dos pedidos al mismo tiempo no obtengan dos sesiones con el mismo token.
