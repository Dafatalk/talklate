# TalkLate - API (Node.js + Express + SQLite)

Backend de TalkLate. Implementa las historias de usuario del Mapa de Impacto y las reglas de negocio de
`arquitectura/modelo_datos.md` (Usuario-RN-*, Conversacion-RN-*).

## Correrlo

Requiere **Node 22.5 o superior** (usa `node:sqlite`, incluido en Node).

```bash
cd backend
npm install
npm start          # http://localhost:3000  (crea data/talklate.db y los datos iniciales)
npm test           # 19 pruebas: API completa y motores de traduccion
```

Variables de entorno (ver `.env.example`): `PORT`, `JWT_SECRET`, `TALKLATE_DB`, `ADMIN_CORREO`, `ADMIN_PASSWORD`,
`TRADUCTOR`, `OLLAMA_URL`, `QWEN_MODEL`, `ANTHROPIC_API_KEY`, `TALKLATE_MODEL`, `CORREO_MODO`.

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

## Endpoints (`/api`)

| Metodo y ruta | HU |
| --- | --- |
| `POST /auth/registro`, `POST /auth/login`, `GET /auth/yo`, `POST /auth/logout` | Registrarme, iniciar y cerrar sesion |
| `POST /auth/recuperar`, `POST /auth/restablecer` | Recuperar mi contrasena (codigo de 6 digitos, 15 min) |
| `GET /catalogo` | Consultar los idiomas disponibles (con regiones, entonaciones y canales) |
| `POST /conversaciones`, `GET /conversaciones` | Crear y configurar una conversacion, consultar el historial |
| `GET/PATCH/DELETE /conversaciones/:id` | Abrir, renombrar y eliminar |
| `POST /conversaciones/:id/mensajes` | Ingresar (texto o voz), reconocer el idioma, traducir, entregar por el mismo canal; `remitente: "interlocutor"` para la respuesta de la otra persona |
| `POST /mensajes/:destinoId/reportar` | Reportar una mala traduccion |
| `GET/PATCH /admin/reportes` | Revisar reportes (administrador) |
| `POST /admin/idiomas`, `PATCH /admin/idiomas/:id`, `POST /admin/regiones` | Administrar idiomas y regiones |
| `GET /salud` | Estado del servicio |

Los errores salen como `{ "error": "mensaje en espanol" }` con el codigo HTTP que corresponde.

## Decisiones a tener en cuenta

- Un idioma puede tener varias regiones y una region varios idiomas (tabla `lenguaje_region`), porque
  Conversacion-RN-1 pide validar que la region sea valida para el idioma. El modelo de dominio actual tiene una
  sola region por lenguaje; hay que validarlo con Farid.
- `reporte` es una tabla nueva: el modelo de dominio solo la menciona como responsabilidad de Lenguaje.
- Recuperacion de contrasena: sin servicio de correo configurado, en desarrollo el codigo se imprime en el log y
  se devuelve en la respuesta (`codigo_dev`). En produccion hay que conectar un servicio de correo (pendiente).
- Voz: el reconocimiento de voz lo hace el cliente (navegador o teclado del celular) y llega como texto con
  `canal: "voz"`. Subir audio para transcribirlo en el servidor queda pendiente.
