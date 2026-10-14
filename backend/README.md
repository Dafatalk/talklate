# TalkLate - API (Node.js + Express + SQLite)

Backend de TalkLate. Implementa las historias de usuario del Mapa de Impacto y las reglas de negocio de
`arquitectura/modelo_datos.md` (Usuario-RN-*, Conversacion-RN-*).

## Correrlo

Requiere **Node 22.5 o superior** (usa `node:sqlite`, incluido en Node).

```bash
cd backend
npm install
npm start          # http://localhost:3000/api/v1  (crea data/talklate.db y los datos iniciales)
npm test           # 28 pruebas: API, seguridad y motores de traduccion
npm run coverage   # cobertura (minimo 80 %, convencion F0)
npm run medir      # mide tiempo de traduccion y modismos adaptados (DRV-01 y DRV-02)
```

Variables de entorno: ver `.env.example`. Documentacion interactiva de la API (OpenAPI 3): `http://localhost:3000/api/v1/docs`.

Al arrancar se crea un administrador (`dafa123.daf@gmail.com` / `Admin123!`, cambialo con las variables) y un catalogo
inicial: Espanol e Ingles activos; Frances y Portugues inactivos; paises, regiones, canales (Texto, Voz) y
entonaciones (Neutral, Amigable, Alegre, Preocupado, Enojado, Formal).

## Motor de traduccion

`TRADUCTOR=auto` (por defecto) prueba los motores en este orden y usa el primero que responde:

1. **Qwen local con Ollama.** Instala [Ollama](https://ollama.com), baja el modelo y dejalo corriendo:
   ```bash
   ollama pull qwen2.5:7b      # o el modelo que quieras: QWEN_MODEL=qwen3:8b
   ollama serve                # normalmente ya queda corriendo solo
   ```
   Variables: `OLLAMA_URL` (por defecto `http://localhost:11434`), `QWEN_MODEL`, `QWEN_TIMEOUT_MS`.
2. **Claude Sonnet**, si hay `ANTHROPIC_API_KEY` (`TALKLATE_MODEL`, por defecto `claude-sonnet-5-5`).
3. **Motor de reglas** (`src/lib/motorLocal.js`), espanol <-> ingles: cambia modismos y frases hechas por su
   equivalente cultural (con variantes por pais) y el resto lo traduce palabra por palabra; si quedan palabras sin
   traducir marca la traduccion como `aproximada`. Sirve para probar sin nada instalado, no para produccion.

Los dos modelos reciben el mismo prompt (`src/lib/prompt.js`): conservar intencion, tono y modismos, usar el
equivalente cultural de la region destino y devolver `traduccion`, `tono`, `nota_cultural` y `region_origen`.
Si un motor falla se pasa al siguiente y no se vuelve a intentar durante un minuto (para no esperar en cada
mensaje). Cada traduccion guarda que motor la hizo (`qwen:qwen2.5:7b`, `claude:...` o `local`) y `/api/salud` muestra
la cadena activa. `TRADUCTOR=qwen|claude|local` fuerza otra opcion.

Con Qwen o Claude se aceptan idiomas distintos de espanol e ingles; con solo el motor de reglas no.

> La conexion real con Ollama y con Claude esta cubierta por pruebas con respuestas simuladas; falta probarla con
> el modelo corriendo en tu computador (calidad y tiempo de respuesta).

## API

Sigue `convenciones/api-rest.md`: base **`/api/v1`**, errores `{ statusCode, error, message, timestamp, path }`,
`201` con `Location`, `204` al eliminar, `422` para reglas de negocio, listas paginadas `{ data, pagination }`
(`?page=1&limit=20`) y `GET /health`. La especificacion completa esta en `openapi.yaml` y en `/api/v1/docs`.

| Metodo y ruta | HU |
| --- | --- |
| `POST /auth/registro`, `POST /auth/login`, `POST /auth/refrescar`, `POST /auth/logout` | Registrarme (con consentimiento de datos), iniciar y cerrar sesion |
| `POST /auth/recuperar`, `POST /auth/restablecer` | Recuperar mi contrasena (codigo de 6 digitos, 15 min) |
| `GET /usuarios/yo`, `DELETE /usuarios/yo` | Mis datos; eliminar mi cuenta (derecho al olvido) |
| `GET /catalogo` | Consultar los idiomas disponibles |
| `POST /conversaciones`, `GET /conversaciones` | Crear y configurar una conversacion; historial paginado |
| `GET/PATCH/DELETE /conversaciones/{id}` | Abrir, renombrar y eliminar |
| `POST /conversaciones/{id}/mensajes`, `GET /conversaciones/{id}/mensajes/{mensajeId}` | Ingresar (texto o voz), reconocer idioma, traducir, entregar por el mismo canal; `remitente: "interlocutor"` |
| `POST /reportes` | Reportar una mala traduccion |
| `GET /admin/reportes`, `GET/PATCH /admin/reportes/{id}` | Revisar reportes (administrador) |
| `POST /admin/idiomas`, `GET/PATCH /admin/idiomas/{id}`, `POST /admin/regiones`, `GET /admin/regiones/{id}` | Administrar idiomas y regiones |

## Seguridad (convenciones/seguridad.md)

- **Sesion:** token de acceso JWT de 15 minutos y token de refresco de 30 dias que se rota en cada uso; cerrar sesion
  revoca ambos; cambiar la contrasena cierra las demas sesiones.
- **Datos personales:** consentimiento obligatorio al registrarse (Ley 1581 de 2012), eliminar cuenta con todos sus
  datos, y el contenido de los mensajes se guarda **cifrado** (AES-256-GCM, clave `TALKLATE_CLAVE_CIFRADO`).
- **Logs** en JSON, sin correos, contrasenas, tokens, codigos ni contenido de mensajes; registran login, accesos a
  conversaciones, cambios del catalogo y cuanto tarda cada traduccion.
- **Limites de uso:** login (8 intentos fallidos), registro, recuperacion y 30 mensajes por minuto por usuario.
- **CORS** solo para los origenes de `CORS_ORIGENES`.
- **SQL:** solo consultas parametrizadas (nunca SQL concatenado).

## Decisiones a tener en cuenta

- Un idioma puede tener varias regiones y una region varios idiomas (tabla `lenguaje_region`), porque
  Conversacion-RN-1 pide validar que la region sea valida para el idioma. El modelo de dominio actual tiene una
  sola region por lenguaje; hay que validarlo con Farid.
- `reporte` es una tabla nueva: el modelo de dominio solo la menciona como responsabilidad de Lenguaje.
- Recuperacion de contrasena: sin servicio de correo configurado, en desarrollo el codigo se devuelve en la
  respuesta (`codigo_dev`) y no se escribe en el log. En produccion hay que conectar un servicio de correo (pendiente).
- Usuario-RN-6 responde "no encontramos una cuenta asociada": asi lo pide la regla de negocio, aunque permite saber
  que correos estan registrados. Se mitiga con el limite de 5 solicitudes cada 15 minutos.
- Voz: el reconocimiento de voz lo hace el cliente (navegador o teclado del celular) y llega como texto con
  `canal: "voz"`. Subir audio para transcribirlo en el servidor queda pendiente.
