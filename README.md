# TalkLate

Aplicación móvil de traducción en tiempo real con conciencia de matices culturales: no solo
traduce palabras, sino que preserva contexto, emociones, modismos y jerga cultural.

Este repositorio sigue la metodología **SoftVerse** (clonada y adaptada desde el proyecto
vetCare) — ver [`AGENTS.md`](AGENTS.md) para el detalle de fases y orquestación.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `contexto.md` | Visión de producto (F1) |
| `requerimientos/` | Mapa de impacto y requerimientos funcionales (F2) |
| `arquitectura/` | Stack técnico y modelo de datos (F3) |
| `componentes/` | Especificación de vistas/UI (F4/F5) |
| `convenciones/` | Convenciones institucionales heredadas (F0) |
| `seguimiento/` | Bitácora de sesiones de mentoría/seguimiento del proyecto |
| `softverse-mcp/` | Servidor MCP que trackea el estado de las fases |

## Estado del proyecto

Consulta `.softverse/estado_fases.json` o usa la tool MCP `softverse_get_status()` una vez
conectado el servidor (ver `.mcp.json`).

## Origen

Documentación de descubrimiento (Visión, Mapa de Impacto, Modelo de Dominio Enriquecido)
producida como parte de un curso académico, mentor Wider Farid Sánchez Garzón, autores Julian
David Diaz Medina y Diego Alejandro Franco Atehortua. Migrada y adaptada a este framework el
2026-08-15.
