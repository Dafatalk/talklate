# TalkLate - Entrega de documentacion

**Proyecto:** TalkLate, aplicacion movil de traduccion en tiempo real con conciencia de matices culturales y emocionales.
**Equipo:** Julian David Diaz Medina y Diego Alejandro Franco Atehortua.
**Director del trabajo de grado:** Wider Farid Sanchez Garzon.
**Version de la entrega:** 1.0 (29/10/2026).

Esta carpeta reune los documentos de analisis, requisitos y arquitectura de TalkLate en Word y PDF, numerados en orden de lectura. Todos estan alineados con el codigo de la rama `develop`.

## Para entregar

- **Documento completo (un solo archivo, con indice):** [TalkLate_Documento_Completo.pdf](TalkLate_Documento_Completo.pdf) · [Word](TalkLate_Documento_Completo.docx)
- **Cada documento por separado** (carpeta `documentos/`, en Word y PDF):

| # | Documento | Archivos | Contenido |
| --- | --- | --- | --- |
| 1 | Vision y contexto | [Word](documentos/01_Vision_y_contexto.docx) · [PDF](documentos/01_Vision_y_contexto.pdf) | Declaracion de vision, posicionamiento, alcance del MVP y riesgos de producto |
| 2 | Mapa de impacto | [Word](documentos/02_Mapa_de_impacto.docx) · [PDF](documentos/02_Mapa_de_impacto.pdf) | Objetivo SMART, actores, impactos ordenados por valor y entregables |
| 3 | Historias de usuario | [Word](documentos/03_Historias_de_usuario.docx) · [PDF](documentos/03_Historias_de_usuario.pdf) | 26 historias con prioridad, talla, horas y sprint |
| 4 | Criterios de aceptacion | [Word](documentos/04_Criterios_de_aceptacion.docx) · [PDF](documentos/04_Criterios_de_aceptacion.pdf) | Criterios verificables por historia |
| 5 | Requisitos funcionales y no funcionales | [Word](documentos/05_Requisitos_funcionales_y_no_funcionales.docx) · [PDF](documentos/05_Requisitos_funcionales_y_no_funcionales.pdf) | 26 requisitos funcionales por prioridad, 10 no funcionales y trazabilidad impacto -> requisito -> driver |
| 6 | Drivers de arquitectura | [Word](documentos/06_Drivers_de_arquitectura.docx) · [PDF](documentos/06_Drivers_de_arquitectura.pdf) | 8 drivers con meta medible, decision y como se comprueba |
| 7 | Arquitectura | [Word](documentos/07_Arquitectura.docx) · [PDF](documentos/07_Arquitectura.pdf) | Documento maestro: estilo, vistas C4, flujo de voz, despliegue, patrones y riesgos |
| 8 | Stack tecnologico | [Word](documentos/08_Stack_tecnologico.docx) · [PDF](documentos/08_Stack_tecnologico.pdf) | Tecnologia por capa y alternativas evaluadas |
| 9 | Diagramas C4 | [Word](documentos/09_Diagramas_C4.docx) · [PDF](documentos/09_Diagramas_C4.pdf) | Contexto (nivel 1) y contenedores (nivel 2) |
| 10 | Componentes | [Word](documentos/10_Componentes_de_la_API.docx) · [PDF](documentos/10_Componentes_de_la_API.pdf) | Componentes de la API (nivel 3), bounded contexts y trazabilidad requisito -> componente |
| 11 | Decisiones de arquitectura (ADR) | [Word](documentos/11_Decisiones_de_arquitectura_ADR.docx) · [PDF](documentos/11_Decisiones_de_arquitectura_ADR.pdf) | ADR-001 a ADR-016 con contexto, alternativas y consecuencias |
| 12 | Modelo de datos | [Word](documentos/12_Modelo_de_datos.docx) · [PDF](documentos/12_Modelo_de_datos.pdf) | Entidades, reglas de negocio, combinaciones unicas y correspondencia con la base |
| 13 | Especificacion de vistas y UI | [Word](documentos/13_Especificacion_de_vistas_y_UI.docx) · [PDF](documentos/13_Especificacion_de_vistas_y_UI.pdf) | Customer Journey Map y pantallas de la app |
| 14 | Planificacion de sprints | [Word](documentos/14_Planificacion_de_sprints.docx) · [PDF](documentos/14_Planificacion_de_sprints.pdf) | Prioridad por valor, tallas, capacidad y cronograma |
| 15 | Plan de liberaciones | [Word](documentos/15_Plan_de_liberaciones.docx) · [PDF](documentos/15_Plan_de_liberaciones.pdf) | Tres liberaciones y lo que recibe el usuario en cada una |
| 16 | Matriz de sensibilidad de datos | [Word](documentos/16_Matriz_de_sensibilidad_de_datos.docx) · [PDF](documentos/16_Matriz_de_sensibilidad_de_datos.pdf) | Clasificacion de cada dato y su control |
| 17 | Politica de tratamiento de datos | [Word](documentos/17_Politica_de_tratamiento_de_datos_personales.docx) · [PDF](documentos/17_Politica_de_tratamiento_de_datos_personales.pdf) | Politica segun la Ley 1581 de 2012 |

Los textos fuente estan en `fuente/` y los documentos se regeneran con `fuente/herramientas/` (ver su README).

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
