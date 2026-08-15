# Diagramas de arquitectura como código

**Fase 0 — Convención transversal · SoftVerse**

---

## Aplica a

Proyectos que documentan F3 (modelo de datos), F4 (servicios) y F5 (infraestructura / despliegue) y desean diagramas reproducibles y versionables en Git.

## Ubicación en el repositorio

| Ruta | Contenido |
| --- | --- |
| `arquitectura/diagramas/` | Diagramas editables (`.drawio`) y, si se generan, scripts de renderizado |
| `arquitectura/diagramas/out/` | Salidas regenerables (PNG), si se opta por versionarlas |

## Diagramas .drawio editables

TalkLate mantiene su diagrama de modelo de dominio como archivo **`.drawio`** (mxGraph XML), editable con [draw.io](https://app.diagrams.net/), la extensión **Draw.io Integration** de VS Code, o draw.io Desktop.

| Archivo | Fase | Contenido |
| --- | --- | --- |
| `modelo_dominio.drawio` | F3 | Entidades del dominio (Usuario, Conversación, Lenguaje, MensajeOriginal, MensajeDestino, Canal, Entonación, Región, País) y sus relaciones |

**Regla:** el `.drawio` es la fuente de verdad editable. No se versiona un PNG exportado como duplicado permanente del mismo diagrama — se regenera desde el `.drawio` cuando se necesite una imagen estática.

## Diagramas C4 (a futuro)

Cuando se decida el stack técnico (F3) y se avance a F4/F5, se recomienda adoptar notación C4 (Contexto, Contenedores, Componentes) para documentar la arquitectura de software, ya sea a mano en `.drawio` o con una herramienta como [Diagrams](https://diagrams.mingrammer.com/) (Python) si el equipo prefiere diagramas generados por código.

## Versionado

- Versionar siempre los `.drawio` (son la fuente editable).
- Los PNG exportados son opcionales y regenerables; no son la fuente de verdad.

---

*Convención de la Fase 0 (Línea Base Institucional) de SoftVerse.*
