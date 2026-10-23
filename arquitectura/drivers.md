# Drivers Arquitectonicos - TalkLate

**Fase 3 - Arquitectura**

Un driver es un requisito que obliga a tomar decisiones de arquitectura. Cada ADR de `decisiones.md` dice a cual driver responde, y cada driver dice como se mide.

| ID | Driver | Objetivo | Origen |
| --- | --- | --- | --- |
| DRV-01 | Tiempo de respuesta de la traduccion (tiempo real **por turno**) | Texto: 3 segundos o menos (p95). Voz: 5 segundos o menos, contando el audio | RNF-001, contexto.md |
| DRV-02 | Calidad cultural | 80 % de los modismos del glosario de prueba con su equivalente cultural, no literal | RNF-002, Vision |
| DRV-03 | Privacidad de los datos | Mensajes, correo y fecha de nacimiento solo los ve su dueno; mensajes cifrados; consentimiento y eliminacion de cuenta; logs sin datos personales | RNF-003, `convenciones/seguridad.md` |
| DRV-04 | Crecimiento de idiomas | Agregar un idioma o region sin cambiar codigo | RNF-004, impacto del Administrador |
| DRV-05 | Continuidad ante fallas del motor de IA | Si Qwen o Claude fallan, el servicio sigue con un motor de reglas | RNF-005 |
| DRV-06 | Costo y abuso | Qwen local sin costo por mensaje; limite de 30 mensajes por minuto por usuario | RNF-006 |
| DRV-07 | Un solo desarrollo para varias plataformas | Misma base de codigo para iOS, Android y web | RNF-007 |
| DRV-08 | Facilidad de prueba | Reglas probadas sin internet ni claves; cobertura de 80 % o mas | RNF-008 |

## Como se responde y como se comprueba

| Driver | Decision | Evidencia hoy |
| --- | --- | --- |
| DRV-01 | ADR-002 (REST por turno), ADR-004 (motores en cadena) | `npm run medir` en `backend/` y el evento de log `traduccion` con `duracion_ms`. Resultado con el motor de reglas en `medicion_traduccion.md`; **falta medir con Qwen** en el equipo donde corra Ollama |
| DRV-02 | ADR-004 (prompt de equivalencia cultural) | `npm run medir`: con el motor de reglas 14 de 15 (93 %), pero ese motor se construyo con estos mismos modismos, asi que no cuenta como evidencia de calidad; **la medicion valida es con Qwen** |
| DRV-03 | ADR-006, ADR-010 | `backend/test/api.test.js` y `seguridad.test.js`: aislamiento entre usuarios, cifrado en base, consentimiento, eliminar cuenta, logs sin PII |
| DRV-04 | ADR-003, ADR-008 | Prueba del administrador que activa un idioma y agrega una region |
| DRV-05 | ADR-004 (Circuit Breaker) | `backend/test/motores.test.js`: Qwen falla -> Claude -> reglas |
| DRV-06 | ADR-004, ADR-010 | Limites de uso en `src/adaptadores/http/limites.js` |
| DRV-07 | ADR-001 | Compila para web; falta probar en celular fisico con Expo Go |
| DRV-08 | ADR-002, ADR-003 | 28 pruebas del backend con cerca de 98 % de cobertura de lineas (`npm run coverage`), pruebas del frontend y CI |
