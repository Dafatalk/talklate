# Qué exponer hoy al profesor — TalkLate

**Fecha:** 2026-10-22. **Objetivo de la sesión:** mostrar el avance, defender las decisiones de arquitectura y cerrar con el profesor las validaciones abiertas. **Duración sugerida:** ~20 min de exposición + preguntas.

> Guión de apoyo. Las fuentes de verdad son `seguimiento/revision_para_sustentacion.md` (riesgos), `seguimiento/validar_en_reunion.md` (checklist de validación) y `arquitectura/arquitectura.md` (justificación driver → ADR → mecanismo → evidencia). Este documento solo ordena qué decir y en qué orden.

---

## 1. Apertura — qué es TalkLate (1 min)

- Una persona sostiene una conversación con alguien que habla otro idioma: escribe o dicta, el mensaje se traduce **respetando la variante regional y los modismos** (no una traducción literal).
- Foco inicial del MVP: **español ↔ inglés**, por turnos.
- Qué mostramos hoy: la app funcionando, la arquitectura ya implementada y las decisiones justificadas contra requisitos.

## 2. Lo que mostramos (demo + artefactos) (6–8 min)

1. **La app en el celular** (Expo Go): una conversación de ida y vuelta con un modismo (ej. "parce", "wey", "che") para evidenciar la **variante regional**.
2. **Arquitectura hexagonal** (lo nuevo y fuerte de hoy):
   - Diagrama interactivo generado del código real con Archify: `.archify/architecture-talklate-hexagonal-20261022-203500/talklate-hexagonal.html`.
   - Enseñar la estructura en código: `backend/src/` → `dominio/`, `aplicacion/`, `puertos/`, `adaptadores/`, `composicion.js`.
   - **Mensaje clave:** el núcleo (dominio + casos de uso) no conoce la tecnología; depende de **contratos (puertos)**, y los adaptadores se enchufan desde afuera. Cambiar la base de datos o el motor de traducción cuesta **un adaptador**, sin tocar un caso de uso.
3. **Documentación de arquitectura:** documento maestro (`arquitectura/arquitectura.md`) con la matriz **driver → ADR → mecanismo → evidencia**, C4 Nivel 3 (`arquitectura/componentes.md`, C01–C27) y vistas de secuencia y despliegue.
4. **Calidad / pruebas** (según `seguimiento/bitacora.md`, 2026-10-23): 34 pruebas con SQLite (~97 % de cobertura), 16 de API contra SurrealDB 3.0.4, `verificar-surreal.js` 12/12 y smoke HTTP OK. El Circuit Breaker se prueba con motores falsos.

## 3. Decisiones que vamos a defender (ADRs) (4–5 min)

Para cada una, tener lista **la alternativa evaluada y por qué se descartó** (Farid lo pidió explícito: "muéstrenme cuáles evaluaron").

| Decisión | Qué decidimos | Por qué / alternativa descartada |
| --- | --- | --- |
| **ADR-013** Hexagonal dentro de monolito modular | Puertos y adaptadores, no microservicios | Límites claros sin costo distribuido; microservicios pierde contra RNF-001 (latencia), RNF-007 (una base de código) y RNF-008 (testing) |
| **ADR-004 / ADR-006** Motor de traducción | Cadena **Qwen local → Claude Sonnet → reglas** | Patrón Circuit Breaker + Retry con degradación aceptable (traducción literal); salta de motor cuando uno falla |
| **ADR-009** Idioma del código | Identificadores del dominio **en español** | El dominio del negocio está en español; se ajustó la convención en vez de forzar inglés |
| **ADR-008** Lenguaje–Región | Relación **muchos a muchos** + tablas de soporte (reporte, sesiones, recuperación) | El modelo de dominio y la base ahora dicen lo mismo |

## 4. Lo que necesitamos validar / decidir con el profesor hoy (3–4 min)

Del checklist `seguimiento/validar_en_reunion.md`, lo que bloquea:

- **ADR-012 — SurrealDB vs PostgreSQL:** con la arquitectura hexagonal el cambio es barato (un adaptador, talla L). **Pedir la decisión** o el visto bueno para seguir con SurrealDB como fuente de verdad. Análisis en `arquitectura/revision_recomendaciones.md` (punto 5).
- **Mapa de impacto:** confirmar los impactos **SMART** (Why medible) y que la **IA ya no es actor** (es parte del sistema).
- **Historias:** "Traducir mi mensaje" como HU0003 y **HU0026 "Eliminar mi cuenta"** (Ley 1581, derecho al olvido).
- **Metodología:** aceptar la prueba de concepto del 14/10 como **spike autorizado** y el flujo issue → rama → PR desde el sprint 1; confirmar el acta de la reunión presencial.
- **Alcance:** "tiempo real" = **por turno**; acento reconocido **por vocabulario**, no por sonido, en el MVP.

## 5. Pendientes honestos y riesgos — NO venderlos como cumplidos (2 min)

Mejor decirlo nosotros que esperar a que lo pregunten:

- **Drivers sin medir:** DRV-01 (latencia ≤ 3 s) y DRV-02 (calidad con glosario held-out) **todavía no se midieron con Qwen**. La medición actual usa el motor de reglas y **no cuenta como evidencia**. Es el pendiente #1.
- **Qwen corre en el servidor**, no en el celular; en producción necesitaría un servidor con GPU o el respaldo con Claude (y entonces los mensajes salen a un tercero → consentimiento de datos).
- **Uso de IA:** declarado en el marco metodológico; podemos explicar cada parte del código y cada decisión.
- **Seguridad/datos:** matriz de sensibilidad y consentimiento ya encaminados; cifrado en reposo sin política de rotación de claves (pendiente).

## 6. Cierre — próximos pasos (1 min)

- 3 sprints del 19/10/2026 al 08/01/2027: terminar, **medir con Qwen**, cumplir convenciones de seguridad/API y documentar.
- Orden inmediato: (1) medición real con Qwen (glosario de ~40 modismos ES-CO / EN-US), (2) decisión SurrealDB vs PostgreSQL con el profesor, (3) despliegue (Docker) y métricas.

---

### Guía rápida para preguntas filosas

- **"¿Quién escribió el código?"** → Usamos un asistente de IA (declarado); podemos explicar cada decisión y cada parte. Mostrar el código en vivo.
- **"¿El modelo corre en el celular?"** → No, en el servidor (hoy, equipo de desarrollo con Ollama). En producción: GPU o respaldo con Claude.
- **"Muéstrenme que detectan el acento."** → Hoy detectamos la **variante regional por el vocabulario**; la detección por audio es trabajo futuro.
- **"¿Cumplen los 3 segundos?"** → Aún no medido con Qwen; es nuestro pendiente #1, no lo afirmamos.
- **"¿Por qué hexagonal y no microservicios?"** → Mismos límites y testeo, sin el costo operativo de lo distribuido; gana contra RNF-001/007/008.
