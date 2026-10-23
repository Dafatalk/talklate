# Que validar en la proxima reunion con Farid

**Actualizado:** 2026-10-14, despues de corregir la revision (`revision_para_sustentacion.md`, issue #1). Ordenado de lo que mas bloquea a lo que menos.

## 1. Mapa de impacto
- [ ] Objetivo (Why) SMART: 10 personas de prueba, conversaciones de 10 mensajes o mas, menos del 20 % de traducciones reportadas, 3 segundos o menos por traduccion, al 08/01/2027.
- [ ] Indicador SMART de cada impacto (columna H del Excel).
- [ ] Impactos 2 y 3 diferenciados (empezar rapido / mantener el contexto), impacto del Administrador redactado como beneficio, impacto del Interlocutor "sin instalar la app ni crear cuenta".
- [ ] Las 6 epicas, y que el impacto 2 se abra en dos epicas (Gestion de conversaciones y Administracion de idiomas y regiones) por la historia "Consultar los idiomas disponibles".
- [ ] La IA ya no es actor (es parte del sistema).

## 2. Historias y planificacion
- [ ] "Traducir mi mensaje" como historia (HU0003).
- [ ] HU0026 nueva: "Eliminar mi cuenta" (Ley 1581, derecho al olvido).
- [x] Prioridad por valor sin excepciones por dependencia (indicacion del mentor): "Cerrar sesion" queda en el sprint 2.
- [ ] Tallas (XS 4 h a XXL 48 h), sprints de un mes de 120 horas, 3 sprints del 19/10/2026 al 08/01/2027 y plan de liberaciones.
- [ ] Criterios de aceptacion y definicion de hecho (en cada issue de GitHub).

## 3. Metodologia
- [ ] La prueba de concepto del 14/10 (antes del sprint 1) como spike autorizado por el, y el flujo issue -> rama -> PR desde ahora (`marco_metodologico.md`).
- [ ] La declaracion del uso de IA en el Marco metodologico.
- [ ] Acta de la reunion presencial (`records/2026-10-14-reunion-presencial.md`): confirmar fecha y contenido.

## 4. Modelo de dominio y arquitectura
- [ ] ADR-008: Lenguaje - Region muchos a muchos y tablas de soporte (reporte, sesiones, recuperacion).
- [ ] Combinaciones unicas propuestas en `arquitectura/modelo_datos.md`.
- [ ] ADR-009: identificadores del dominio en espanol (cambia la regla 1 de las convenciones).
- [ ] Motor: Qwen local primero, Claude Sonnet de respaldo y reglas al final (Circuit Breaker). Que modelo Qwen usar.
- [ ] Drivers: medir con Qwen antes de la sustentacion (`npm run medir`).
- [ ] Diagramas C4 de contexto y contenedores.
- [ ] ADR-013: arquitectura hexagonal (puertos y adaptadores) dentro del monolito modular.
- [x] SurrealDB o PostgreSQL: se mantiene **SurrealDB** (decision del 23/10/2026; justificacion tecnica en ADR-012).
- [ ] ADR-012: SurrealDB como fuente de verdad (reemplaza a SQLite), con esquema en ingles e instancia remota en SurrealDB Cloud; SQLite queda solo para pruebas.

## 5. Alcance
- [ ] "Tiempo real" = por turno, y acento reconocido por vocabulario (no por sonido) en el MVP.
- [ ] Fuera del MVP: compartir o exportar, editar perfil, personalizar la voz, reentrenar el modelo.

## Antes de la reunion (tarea del equipo)
- [ ] Probar la app en Expo Go con el celular.
- [ ] Correr `npm run medir` con Qwen y guardar el resultado en `arquitectura/medicion_traduccion.md`.
- [ ] Revisar el PR del issue #1 y hacer merge a `develop` (revision cruzada).
- [ ] Julian: actualizar el MER y el Excel del modelo enriquecido con ADR-008.
