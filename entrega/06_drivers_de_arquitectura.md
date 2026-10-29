# 6. Drivers de arquitectura - TalkLate

**Fase 3 - Arquitectura**

**Version:** 1.0 (29/10/2026)

Un driver es un requisito que obliga a tomar decisiones de arquitectura. Cada driver tiene una meta medible, la forma de medirla y las decisiones (ADR, `11_decisiones_de_arquitectura_ADR.md`) que lo responden. Los dos que definen el producto son DRV-01 (tiempo por turno) y DRV-02 (calidad cultural y emocional).

## 1. Drivers

| ID | Driver | Meta medible | Origen |
| --- | --- | --- | --- |
| DRV-01 | Tiempo de respuesta por turno | Texto: 3 s o menos (p95). Voz: 5 s o menos, contando transcripcion y audio de salida | RNF-001, vision |
| DRV-02 | Calidad cultural y emocional | 80 % de los modismos del glosario con su equivalente cultural; la emocion detectada se escucha en la voz de salida | RNF-002, RNF-010, vision |
| DRV-03 | Privacidad de los datos | 0 accesos a datos de otro usuario; mensajes cifrados en reposo; logs sin datos personales; consentimiento y borrado de cuenta (Ley 1581 de 2012) | RNF-003 |
| DRV-04 | Crecimiento de idiomas | Agregar un idioma o una region sin cambiar codigo | RNF-004, impacto del Administrador |
| DRV-05 | Continuidad ante fallas de IA | Si falla un motor de traduccion o de voz, el servicio sigue con el siguiente | RNF-005 |
| DRV-06 | Costo y abuso | Motores locales (Qwen, Whisper, VoiceStudio) sin costo por mensaje; 30 mensajes por minuto por usuario | RNF-006 |
| DRV-07 | Una base de codigo para varias plataformas | Mismo codigo para iOS, Android y web | RNF-007 |
| DRV-08 | Facilidad de prueba y mantenimiento | Reglas probadas sin internet ni claves; cobertura de 80 % o mas; capas validadas automaticamente | RNF-008, RNF-009 |

## 2. Como se responde y como se comprueba

| Driver | Decisiones | Como se mide | Resultado actual |
| --- | --- | --- | --- |
| DRV-01 | ADR-002 (REST por turno), ADR-004 (motores en cadena), ADR-014 (voz con Whisper), ADR-016 (voz local) | `npm run medir` (texto) y `npm run medir:voz` (voz) en `backend/`; evento de log `traduccion` con `duracion_ms` | La medicion con los motores de produccion (Qwen, Whisper y VoiceStudio) se ejecuta en el equipo de despliegue (Mac M5, 32 GB) con la guia `backend/VOICESTUDIO_MAC.md` |
| DRV-02 | ADR-004 (prompt de equivalencia cultural), ADR-014 (entonacion por texto y voz), ADR-015 y ADR-016 (voz con emocion) | `npm run medir` con un glosario de prueba separado del usado para construir las reglas; prueba de escucha con usuarios | El motor de reglas logra 14 de 15 modismos; el resultado que cuenta para el driver es el de Qwen con el glosario separado |
| DRV-03 | ADR-006 (autenticacion), ADR-010 (seguridad y datos personales) | `backend/test/api.test.js` y `seguridad.test.js` | Cumple: aislamiento entre usuarios, cifrado en reposo, consentimiento, borrado de cuenta y logs sin datos personales |
| DRV-04 | ADR-003 (capas), ADR-008 (modelo de dominio) | Prueba del administrador que activa un idioma y agrega una region | Cumple |
| DRV-05 | ADR-004 (Circuit Breaker), ADR-015 (cadena de voz) | `backend/test/motores.test.js` | Cumple: Qwen -> Claude -> reglas; VoiceStudio -> Azure -> OpenAI -> voz del celular |
| DRV-06 | ADR-004, ADR-010, ADR-016 | Limites en `src/adaptadores/http/limites.js` y pruebas de seguridad | Cumple |
| DRV-07 | ADR-001 (Expo) | Compilacion web y ejecucion en Expo Go | Cumple en web y en Expo Go |
| DRV-08 | ADR-002, ADR-003, ADR-013 (hexagonal) | `npm run coverage`, `npm run arch:check` (dependency-cruiser) y CI en cada pull request | Cumple: 40 pruebas del backend, cobertura de lineas cercana al 96 % |
