# Plan de liberaciones - TalkLate

Cada sprint dura un mes (4 semanas, 120 horas) y termina con una liberacion. El primer sprint empieza el **lunes 19 de octubre de 2026** y la construccion termina el **8 de enero de 2027**. Historias, tallas y horas en `planificacion_sprints.md`.

| Liberacion | Sprint | Fechas | Nombre | Historias | Horas | Indicadores que se revisan |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 19 de octubre al 13 de noviembre de 2026 | Traduccion funcional | HU0003, HU0002, HU0001, HU0004, HU0005, HU0006 | 120 | Impactos 1 y 6 (traduccion cultural, voz) |
| 2 | 2 | 16 de noviembre al 11 de diciembre de 2026 | Conversaciones completas | HU0007, HU0008, HU0009, HU0010, HU0019, HU0020, HU0023, HU0011, HU0012, HU0013, HU0014, HU0018 | 120 | Impactos 2, 3, 4 y 8 (conversaciones, historial, interlocutor) |
| 3 | 3 | 14 de diciembre de 2026 al 8 de enero de 2027 | Cuentas, calidad y administracion | HU0015, HU0016, HU0021, HU0017, HU0022, HU0024, HU0025, HU0026 | 120 | Impactos 5, 7, 9 y 10 y el objetivo general |

## Que recibe el usuario en cada liberacion

- **Liberacion 1 - Traduccion funcional:** El usuario puede escribir o hablar un mensaje, recibirlo traducido con el tono y los modismos adaptados, escucharlo y obtenerlo por el mismo canal. Es el valor central del producto.
- **Liberacion 2 - Conversaciones completas:** El usuario organiza sus conversaciones (reconocer idioma, crear, hilo continuo, historial, renombrar y eliminar), la otra persona participa y se puede cerrar sesion.
- **Liberacion 3 - Cuentas, calidad y administracion:** Registro con consentimiento de datos, inicio de sesion, recuperacion de contrasena, eliminar la cuenta, reportar y revisar malas traducciones, y agregar, activar o desactivar idiomas y regiones.

Al cierre de cada liberacion se publica una version con etiqueta (`v0.1.0`, `v0.2.0`, `v1.0.0`, segun `convenciones/git-versionamiento.md`) y se miden sus indicadores SMART (ver `mapa_impacto.md`).

## Nota

El orden sale de la prioridad por valor, no de las dependencias. El plan es metodologico: las horas reales de cada mes pueden variar. Despues de la construccion viene un mes de cierre (11/01 al 05/02/2027): pruebas con usuarios, manual de usuario y documento final.