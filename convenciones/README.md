# Convenciones — Línea Base Institucional

**Fase 0 · Estándares y Buenas Prácticas**

---

> Estos documentos definen las convenciones para el proyecto TalkLate. Se heredan del catálogo
> institucional SoftVerse (clonado y adaptado desde el proyecto vetCare) y se irán completando
> con manuales por tecnología en cuanto se decida el stack técnico (fase F3, hoy bloqueada).

---

## Manuales de Convenciones

| # | Documento | Tecnología | Tipo |
| --- | --- | --- | --- |
| 1 | [`git-versionamiento.md`](git-versionamiento.md) | Git / GitHub | Transversal |
| 2 | [`seguridad.md`](seguridad.md) | Seguridad y protección de datos | Transversal |
| 3 | [`producto-ux-ia.md`](producto-ux-ia.md) | Alineación de producto/UX, trazabilidad F1/F2 | Transversal |
| 4 | [`diagramas-como-codigo.md`](diagramas-como-codigo.md) | Diagramas de arquitectura versionables | Transversal |
| 5 | [`patrones-arquitectonicos.md`](patrones-arquitectonicos.md) | Catálogo de patrones arquitectónicos | Transversal |
| 6 | [`api-rest.md`](api-rest.md) | Diseño de APIs REST | Transversal |

**Pendiente de stack técnico** (fase F3 aún no decidida): manuales por tecnología para frontend móvil, backend y base de datos se agregarán a esta tabla una vez se elija el stack de TalkLate.

---

## Reglas Transversales Obligatorias

1. **Idioma del código**: inglés para identificadores (variables, funciones, clases, tablas). Español para comentarios de negocio, documentación y mensajes de UI.
2. **Encoding**: UTF-8 sin BOM en todos los archivos.
3. **Fin de línea**: LF (Unix). Configurar `.editorconfig` y `.gitattributes`.
4. **Indentación**: Definida por tecnología (se agregará al elegir el stack).
5. **Longitud de línea**: 120 caracteres máximo.
6. **Secretos**: Nunca en código, variables de entorno ni archivos del repo.
7. **Logs**: Estructurados en JSON. Nunca loguear datos personales, contraseñas ni tokens.
8. **Tests**: Cobertura mínima 80% en lógica de negocio. Todo PR debe incluir tests.

---

## Cómo extender este catálogo

1. Crear `{tecnologia}.md` siguiendo la estructura estándar (ver cualquier archivo existente).
2. Documentar: estructura de proyecto, nomenclatura, dependencias, testing.
3. Agregar a la tabla de este README.

---

*Documentos de la Fase 0 (Línea Base Institucional) de SoftVerse.*
