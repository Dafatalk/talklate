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

No hay todavía un stack técnico ni un template de UI obligatorio definidos — eso se decide en la
fase F3 (actualmente bloqueada, ver estado de fases). Cuando se decida, este documento y
`convenciones/README.md` deben actualizarse con las reglas de stack correspondientes.

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
