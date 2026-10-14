# Que validar en la proxima reunion con Farid

**Fecha de preparacion:** 2026-10-14. Ordenado de lo que mas bloquea a lo que menos.

## 1. Mapa de impacto y epicas
- [ ] Los 6 entregables como epicas, sin la palabra "modulo": Traduccion de mensajes, Gestion de conversaciones (incluye el historial), Cuenta de usuario, Participacion del interlocutor, Reportes, Administracion de idiomas y regiones.
- [ ] "Consultar los idiomas disponibles" quedo en Administracion de idiomas y regiones (pertenece mas al catalogo), aunque se usa desde la conversacion. Confirmar.
- [ ] Un impacto en varias epicas y una epica con varios impactos (filas 5, 6 y 7 van a Gestion de conversaciones; filas 4 y 9 a Traduccion). Confirmar que asi se lee bien.
- [ ] Impacto del perfil (fila 8) reescrito, y fila 13 nueva para el Administrador que revisa reportes.
- [ ] Problema y beneficio de cada impacto, en tercera persona.

## 2. Historias de usuario
- [ ] **"Traducir mi mensaje"** como historia (HU0003). Antes se hablo de que "procesar" era un detalle interno; en el audio dijo "ingresar, traducir y escuchar el mensaje". Confirmar.
- [ ] La redaccion Como / Necesito poder / Para y que el "Para" apunte al impacto correcto.
- [ ] Criterios de aceptacion (Dado / Cuando / Entonces) de las 25 historias, en la hoja Entregables y en `criterios_aceptacion.md`.

## 3. Priorizacion y sprints
- [ ] Prioridad por valor (traducir primero; registro y cerrar sesion al final) y la frase para defenderla: "se priorizo por valor para el negocio, no por dependencia".
- [ ] Tabla de tallas a horas: XS 1, S 2, M 4, L 6, XL 8, XXL 12.
- [ ] Capacidad: 2 personas por 4 horas al dia por 5 dias = 40 horas, usable 75 % = 30. Confirmar que el sprint dura una semana.
- [ ] Resultado: 90 horas en 3 sprints. Plan de liberaciones: el sprint 1 empieza el lunes 19/10/2026 y cada sprint termina con una liberacion (`plan_liberaciones.md`).

## 4. Modelo de dominio (ADR-008)
- [ ] Un idioma con varias regiones y una region con varios idiomas (el modelo tenia una sola region por lenguaje).
- [ ] Tabla `reporte` como apoyo, fuera del modelo de dominio.
- [ ] Combinaciones unicas propuestas en `arquitectura/modelo_datos.md`, en especial la duda de Lenguaje (nombre solo o nombre mas region).
- [ ] El MER lo hace Julian: confirmar que coincide con el esquema de `backend/src/db.js`.

## 5. Alcance y roles
- [ ] El Interlocutor no usa la app: en la app es "otra persona" que responde desde el mismo dispositivo.
- [ ] El Administrador: hoy se crea por configuracion (`dafa123.daf@gmail.com`), no hay registro de administradores.
- [ ] Fuera del MVP (siguen como preguntas abiertas): compartir o exportar conversaciones, editar perfil, personalizar la voz, ampliar idiomas y reentrenar el modelo.

## 6. Arquitectura
- [ ] Drivers y sus umbrales (por ejemplo traducir en 3 segundos o menos) en `arquitectura/drivers.md`.
- [ ] Los 8 ADR: primero construimos y despues justificamos. Completar con las alternativas que de verdad se evaluaron.
- [ ] Motor de traduccion: Qwen local (Ollama) primero, Claude Sonnet de respaldo y motor de reglas al final. Confirmar que le parece bien y que modelo Qwen usar; falta medir latencia y calidad con jerga.
- [ ] Voz: hoy el dictado es del navegador o del teclado del celular; no hay reconocimiento nativo ni transcripcion en servidor. Confirmar que sirve para el alcance.

## 7. Para la sustentacion
- [ ] Coherencia entre artefactos y Marco metodologico (lo que se diga debe estar escrito en los entregables).
- [ ] Evidencia de los sprints (grabaciones de reuniones, historias comprometidas y cumplidas).
- [ ] Pendientes de artefactos: matriz de sensibilidad de datos, cronograma, diagramas (Archify), plan de despliegue.

## Antes de la reunion (tarea del equipo)
- [ ] Probar la app en Expo Go con el celular y anotar lo que falle (voz, conexion con el backend, pantallas).
- [ ] Revisar el Excel `Mapa de Impacto.xlsx` abierto en Excel: formulas de Entregables y de Planificacion.
