# SoftVerse Framework — Reglas y Orquestación

## Orquestador del Proyecto (SoftVerse v1.0.0)

Este proyecto está orquestado mediante el framework independiente **SoftVerse**. El estado del
desarrollo se gestiona en [`.softverse/estado_fases.json`](.softverse/estado_fases.json).

---

## 🛠️ Servidor SoftVerse MCP

El servidor está registrado en [`.mcp.json`](.mcp.json) y se conecta automáticamente al abrir
este proyecto con un asistente de IA compatible con MCP (Claude Code, Cursor, etc.), exponiendo
dos tools:

- `softverse_get_status()` — devuelve el estado actual de todas las fases F0–F10.
- `softverse_advance_phase(phase_id)` — marca una fase como completada y desbloquea las fases
  dependientes.

Para ejecutarlo manualmente (debug):

```bash
cd softverse-mcp
python3 -m src.mcp_server
```

El servidor utiliza protocolo **stdio (JSON-RPC 2.0)**.

---

## 🎯 Sobre TalkLate

TalkLate es una aplicación móvil de **traducción en tiempo real con conciencia de matices
culturales**: va más allá de la conversión literal palabra por palabra, considerando contexto,
emociones, jerga e intención. Ver [`contexto.md`](contexto.md) para la visión completa.

### Stack y estructura (decidido en F3, ver `arquitectura/tech_stack.md` y `arquitectura/decisiones.md`)

| Carpeta | Contenido |
| --- | --- |
| `backend/` | API REST `/api/v1` en Node.js 22 + Express + SurrealDB (SQLite solo en pruebas); traduccion con Qwen local (Ollama), Claude Sonnet de respaldo y motor de reglas |
| `frontend/` | App movil Expo (React Native) adaptada del template de UI **Luna** (`componentes/template/native-luna`) |
| `requerimientos/` | Mapa de impacto, historias, criterios de aceptacion, requerimientos, matriz de sensibilidad, sprints y liberaciones |
| `arquitectura/` | Modelo de datos, drivers, ADR, stack y diagramas C4 |
| `seguimiento/` | Actas con el mentor, marco metodologico, Excel fuente y estado de artefactos |

Reglas de stack: `convenciones/backend-node.md` y `convenciones/frontend-expo.md`. Flujo de trabajo: issue primero, rama `feature/{issue}-...`, commits convencionales y PR a `develop` (`convenciones/git-versionamiento.md`).

---

## 📋 Fases de la Metodología SoftVerse

- **F0:** Línea Base & Convenciones (`convenciones/`)
- **F1:** Definición del Contexto (`contexto.md`)
- **F2:** Requerimientos Funcionales y No Funcionales (`requerimientos/mapa_impacto.md`, `requerimientos/req.md`)
- **F3:** Arquitectura de Software & Base de Datos (`arquitectura/tech_stack.md` y `arquitectura/modelo_datos.md`)
- **F4/F5:** Diagramación y Especificación de Componentes UI (`componentes/especificacion_vistas_ui.md`)
- **F6-F10:** Desarrollo, Scaffolding, Integración y Despliegue

Consulta el estado real de cada fase con `softverse_get_status()` en vez de asumirlo por la
estructura de carpetas — el archivo `.softverse/estado_fases.json` es la fuente de verdad.
