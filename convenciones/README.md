# Convenciones — Línea Base Institucional

**Fase 0 · Estándares y Buenas Prácticas**

---

> Estos documentos definen las convenciones para el proyecto TalkLate. Se heredan del catálogo
> institucional SoftVerse (clonado y adaptado desde el proyecto vetCare) y se completan con los
> manuales por tecnología del stack decidido en F3.

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
| 7 | [`backend-node.md`](backend-node.md) | Node.js + Express + SQLite | Por tecnología |
| 8 | [`frontend-expo.md`](frontend-expo.md) | Expo / React Native + NativeWind | Por tecnología |

Los manuales por tecnología (7 y 8) se agregaron al decidir el stack en F3.

---

## Reglas Transversales Obligatorias

1. **Idioma del código**: los identificadores del **dominio** (entidades, tablas, reglas, funciones de negocio) van en **español**, con los mismos nombres del modelo de dominio (lenguaje ubicuo, ver ADR-009); los términos técnicos y de librerías conservan su nombre en inglés. Español para comentarios, documentación y mensajes de UI.
2. **Encoding**: UTF-8 sin BOM en todos los archivos (los `.xlsx` de seguimiento son binarios y no aplican).
3. **Fin de línea**: LF (Unix). Configurar `.editorconfig` y `.gitattributes`.
4. **Indentación**: 2 espacios (JavaScript, TypeScript, JSON, YAML), definida en `.editorconfig`.
5. **Longitud de línea**: 120 caracteres máximo.
6. **Secretos**: Nunca en código, variables de entorno ni archivos del repo.
7. **Logs**: Estructurados en JSON (`backend/src/lib/log.js`). Nunca loguear datos personales, contraseñas ni tokens.
8. **Tests**: Cobertura mínima 80% en lógica de negocio. Todo PR debe incluir tests.

---

## Cómo extender este catálogo

1. Crear `{tecnologia}.md` siguiendo la estructura estándar (ver cualquier archivo existente).
2. Documentar: estructura de proyecto, nomenclatura, dependencias, testing.
3. Agregar a la tabla de este README.

---

*Documentos de la Fase 0 (Línea Base Institucional) de SoftVerse.*
