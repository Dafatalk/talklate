# TalkLate

Aplicación móvil de traducción en tiempo real con conciencia de matices culturales: no solo
traduce palabras, sino que preserva contexto, emociones, modismos y jerga cultural.

Este repositorio sigue la metodología **SoftVerse** (clonada y adaptada desde el proyecto
vetCare) — ver [`AGENTS.md`](AGENTS.md) para el detalle de fases y orquestación.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `entrega/` | **Documentacion para entregar**, numerada en orden de lectura (vision, requisitos, drivers, arquitectura, ADR, datos, sprints) — ver `entrega/README.md` |
| `contexto.md` | Visión de producto (F1) |
| `requerimientos/` | Mapa de impacto y requerimientos funcionales (F2) |
| `arquitectura/` | Stack técnico y modelo de datos (F3) |
| `componentes/` | Especificación de vistas/UI (F4/F5) |
| `convenciones/` | Convenciones institucionales heredadas (F0) |
| `seguimiento/` | Actas con el mentor, marco metodológico, Excel fuente (Mapa de Impacto), matrices y estado de artefactos |
| `backend/` | API de TalkLate (Node + Express + SurrealDB) — ver `backend/README.md` |
| `frontend/` | App móvil (Expo / React Native) adaptada del template Luna — ver `frontend/README.md` |
| `softverse-mcp/` | Servidor MCP que trackea el estado de las fases |

## Probar la aplicación

```bash
# Terminal 1: API (Node 22.5 o superior)
cd backend && npm install && npm start

# Terminal 2: app (navegador, o escanea el QR con Expo Go)
cd frontend && npm install --legacy-peer-deps && npm run web
```

Usuario administrador de prueba: `dafa123.daf@gmail.com` / `Admin123!`. La traducción usa **Qwen local (Ollama)**, luego Claude Sonnet si hay `ANTHROPIC_API_KEY`, y si ninguno
responde un motor de reglas (español ⇄ inglés). Para Qwen: `ollama pull qwen2.5:7b` (ver `backend/README.md`).

## Cómo se trabaja

Issue primero → rama `feature/{issue}-...` desde `develop` → commits convencionales con `(#N)` → PR a `develop` con `Closes #N` y revisión del otro integrante → CI en verde. Ver `convenciones/git-versionamiento.md` y `seguimiento/marco_metodologico.md`.

## Estado del proyecto

Consulta `.softverse/estado_fases.json` o usa la tool MCP `softverse_get_status()` una vez
conectado el servidor (ver `.mcp.json`).

## Origen

Documentación de descubrimiento (Visión, Mapa de Impacto, Modelo de Dominio Enriquecido)
producida como parte de un curso académico, mentor Wider Farid Sánchez Garzón, autores Julian
David Diaz Medina y Diego Alejandro Franco Atehortua. Migrada y adaptada a este framework el
2026-08-15.
