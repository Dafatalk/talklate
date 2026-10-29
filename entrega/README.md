# TalkLate - Entrega de documentacion

**Proyecto:** TalkLate, aplicacion movil de traduccion en tiempo real con conciencia de matices culturales y emocionales.
**Equipo:** Julian David Diaz Medina y Diego Alejandro Franco Atehortua.
**Director del trabajo de grado:** Wider Farid Sanchez Garzon.
**Version de la entrega:** 1.0 (29/10/2026).

Esta carpeta reune los documentos de analisis, requisitos y arquitectura de TalkLate, numerados en orden de lectura. Todos estan alineados con el codigo de la rama `develop`.

## Documentos

| # | Documento | Contenido |
| --- | --- | --- |
| 1 | [Vision y contexto](01_vision_y_contexto.md) | Declaracion de vision, posicionamiento, alcance del MVP y riesgos de producto |
| 2 | [Mapa de impacto](02_mapa_de_impacto.md) | Objetivo SMART, actores, impactos ordenados por valor y entregables |
| 3 | [Historias de usuario](03_historias_de_usuario.md) | 26 historias con prioridad, talla, horas y sprint |
| 4 | [Criterios de aceptacion](04_criterios_de_aceptacion.md) | Criterios verificables por historia |
| 5 | [Requisitos funcionales y no funcionales](05_requisitos_funcionales_y_no_funcionales.md) | 26 requisitos funcionales por prioridad, 10 no funcionales y trazabilidad impacto -> requisito -> driver |
| 6 | [Drivers de arquitectura](06_drivers_de_arquitectura.md) | 8 drivers con meta medible, decision y como se comprueba |
| 7 | [Arquitectura](07_arquitectura.md) | Documento maestro: estilo, vistas C4, flujo de voz, despliegue, patrones y riesgos |
| 8 | [Stack tecnologico](08_stack_tecnologico.md) | Tecnologia por capa y alternativas evaluadas |
| 9 | [Diagramas C4](09_diagramas_c4.md) | Contexto (nivel 1) y contenedores (nivel 2) |
| 10 | [Componentes](10_componentes.md) | Componentes de la API (nivel 3), bounded contexts y trazabilidad requisito -> componente |
| 11 | [Decisiones de arquitectura (ADR)](11_decisiones_de_arquitectura_ADR.md) | ADR-001 a ADR-016 con contexto, alternativas y consecuencias |
| 12 | [Modelo de datos](12_modelo_de_datos.md) | Entidades, reglas de negocio, combinaciones unicas y correspondencia con la base |
| 13 | [Especificacion de vistas y UI](13_especificacion_vistas_ui.md) | Customer Journey Map y pantallas de la app |
| 14 | [Planificacion de sprints](14_planificacion_de_sprints.md) | Prioridad por valor, tallas, capacidad y cronograma |
| 15 | [Plan de liberaciones](15_plan_de_liberaciones.md) | Tres liberaciones y lo que recibe el usuario en cada una |
| 16 | [Matriz de sensibilidad de datos](16_matriz_sensibilidad_datos.md) | Clasificacion de cada dato y su control |
| 17 | [Politica de tratamiento de datos](17_politica_tratamiento_datos.md) | Politica segun la Ley 1581 de 2012 |

## Diagramas (`diagramas/`)

| Archivo | Contenido |
| --- | --- |
| `arquitectura_talklate.html` | Vista general interactiva (Archify): app, API, Whisper, Qwen, VoiceStudio y SurrealDB, con el flujo de voz (abrir en el navegador) |
| `arquitectura_hexagonal.html` | Vista interactiva (Archify) del backend hexagonal: nucleo, 6 puertos, adaptadores y sistemas externos, con enlaces al codigo |
| `arquitectura_talklate.architecture.json` | Fuente Archify de la vista general (la del hexagonal esta en `.archify/` en la raiz del repo) |
| `c4_contexto.drawio` | C4 nivel 1 (editable en draw.io) |
| `c4_contenedores.drawio` | C4 nivel 2 (editable en draw.io) |
| `despliegue.drawio` | Vista de despliegue (editable en draw.io) |
| `secuencia_traduccion.drawio` | Secuencia de traduccion de un mensaje escrito |
| `modelo_dominio.drawio` | Modelo de dominio |

## Anexos (`anexos/`)

Hojas de calculo de trabajo: vision (`Vision.xlsx`), mapa de impacto (`Mapa_de_Impacto.xlsx`) y matrices de colaboraciones, comandos por impacto y roles por operaciones.

## Resumen en cifras

| Elemento | Cantidad |
| --- | --- |
| Historias de usuario | 26 (6 epicas) |
| Requisitos funcionales | 26 |
| Requisitos no funcionales | 10 |
| Drivers de arquitectura | 8 |
| Decisiones de arquitectura (ADR) | 16 |
| Sprints | 3 de un mes (120 horas cada uno) |
| Pruebas automaticas del backend | 40 (cobertura de lineas cercana al 96 %) |
