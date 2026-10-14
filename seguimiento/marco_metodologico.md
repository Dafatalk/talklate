# Marco metodologico - TalkLate (borrador para el documento de grado)

Este documento resume **como** se desarrolla TalkLate, para que lo que se diga en la sustentacion coincida con los artefactos del repositorio.

## 1. Framework y fases
El proyecto sigue el framework **SoftVerse**: fases F0 a F10 con dependencias (`.softverse/estado_fases.json`). Cada fase tiene artefactos en el repositorio:

| Fase | Artefactos |
| --- | --- |
| F0 Linea base | `convenciones/` (git, seguridad, API REST, patrones, diagramas, producto) |
| F1 Contexto | `contexto.md` (Vision, estilo Geoffrey Moore) |
| F2 Requerimientos | Mapa de Impacto (Excel y `requerimientos/mapa_impacto.md`), historias de usuario, criterios de aceptacion, `req.md`, matriz de sensibilidad de datos, planificacion y plan de liberaciones |
| F3 Arquitectura | `arquitectura/modelo_datos.md` (modelo de dominio enriquecido), `drivers.md`, `decisiones.md` (ADR), `tech_stack.md` |
| F4 y F5 | Diagramas C4 (`arquitectura/diagramas/`), `componentes/especificacion_vistas_ui.md` (Customer Journey Map y vistas) |
| F6 a F8 | `backend/` y `frontend/` |

## 2. Descubrimiento
1. **Vision** (Geoffrey Moore) validada con el mentor el 15/08/2026.
2. **Modelo de dominio** anemico y enriquecido (atributos, reglas de negocio, responsabilidades, datos simulados y combinaciones unicas).
3. **Mapa de Impacto** (Gojko Adzic): objetivo SMART, actores en terminos positivos, impactos SMART con problema y beneficio, y entregables como epicas.
4. **Historias de usuario** (Como / Necesito poder / Para), cada una ligada a un impacto, con criterios de aceptacion Dado / Cuando / Entonces.

## 3. Planificacion agil (Scrum)
- Prioridad por **valor para el negocio**, no por dependencia.
- Estimacion con **tallas de ropa** (XS a XXL) convertidas a horas.
- Sprints de **una semana**: 2 personas x 4 horas x 5 dias = 40 horas; se usa el 75 % (30 horas) y el resto es planeacion, dailies, refinamiento y retrospectiva.
- Resultado: 26 historias, 90 horas, 3 sprints (19/10 al 06/11/2026) y 3 liberaciones (`requerimientos/plan_liberaciones.md`).

## 4. Prueba de concepto antes del sprint 1
Con autorizacion del mentor ("primero construir y luego justificar", reunion presencial de octubre), el 14/10/2026 se construyo una **prueba de concepto (spike)**: una version funcional de la app para validar el stack (Expo, Node, SQLite) y el motor de traduccion. Las decisiones se justificaron despues en ADR (`arquitectura/decisiones.md`). En los sprints cada historia se completa desde ese punto: revision del codigo, pruebas en celular, criterios de aceptacion, pruebas automaticas y documentacion.

## 5. Gestion del codigo
Desde la correccion del issue #1 y en todos los sprints, el trabajo sigue `convenciones/git-versionamiento.md`:
- **Issue primero:** cada historia de usuario es un issue de GitHub (HU0001 a HU0026), con su sprint.
- **Ramas** `feature/{issue}-{descripcion}` o `fix/{issue}-{descripcion}` desde `develop`.
- **Commits convencionales** (`feat(...)`, `fix(...)`, `docs(...)`) con la referencia `(#N)`.
- **Pull request** a `develop` con `Closes #N`, revisado por el otro integrante; integracion continua (pruebas) en cada PR.
- **Liberacion** al cierre de cada sprint: merge a `main` y etiqueta SemVer.
Lo anterior al issue #1 (descubrimiento y prueba de concepto) se subio directamente a `develop`; se reconoce asi.

## 6. Calidad
- Pruebas automaticas: backend con `node:test` (cobertura minima 80 %, hoy cerca de 98 % de lineas) y reglas del frontend.
- Integracion continua en GitHub Actions (`.github/workflows/ci.yml`).
- Medicion de los drivers DRV-01 (tiempo) y DRV-02 (modismos) con `npm run medir`.
- Pruebas de punta a punta en navegador y pruebas con usuarios por liberacion (indicadores SMART del Mapa de Impacto).

## 7. Uso de inteligencia artificial (declaracion)
- **En el producto:** la traduccion la hace un modelo de lenguaje (Qwen local en Ollama, con Claude Sonnet de respaldo).
- **En el desarrollo:** el equipo uso un asistente de programacion con IA (Claude Code) como apoyo para: migrar los artefactos a Markdown y Excel, redactar borradores de documentos, construir la prueba de concepto y revisar la coherencia del proyecto. En el historial de git esos aportes aparecen con el autor o coautor "Claude".
- **Control del equipo:** cada artefacto lo revisa y valida el equipo y, cuando aplica, el mentor (actas en `seguimiento/records/`). Las decisiones de producto, alcance y priorizacion son del equipo. Los integrantes deben poder explicar cada parte del codigo y de los documentos.
- En el documento de grado la IA se usa solo como apoyo de redaccion, siguiendo la recomendacion del mentor.
