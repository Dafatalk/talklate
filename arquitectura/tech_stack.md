# Stack Técnico — TalkLate

**Fase 3 · Arquitectura de Software & Base de Datos**

**Estado:** TBD (por decidir). Esta fase está bloqueada en `.softverse/estado_fases.json` hasta
que F2 (Requerimientos) esté completa y se tome esta decisión explícitamente.

---

## Pendiente de decidir

- **Frontend móvil**: framework (nativo iOS/Android, React Native, Flutter, etc.).
- **Backend**: lenguaje/framework, y si es monolito modular o microservicios.
- **Base de datos**: motor y estrategia de persistencia para conversaciones y mensajes.
- **Motor de traducción / IA**: si se construye modelo propio, se integra un proveedor externo
  (ej. modelos de traducción con conciencia de contexto), o un enfoque híbrido — dado que la
  visión de TalkLate (ver `contexto.md`) exige más que traducción literal (contexto, emociones,
  matices culturales), esta decisión es probablemente la más crítica del stack.
- **Procesamiento de voz**: transcripción de audio a texto y síntesis de audio traducido (voz
  natural), necesarios para las responsabilidades de Canal/MensajeOriginal/MensajeDestino en
  `arquitectura/modelo_datos.md`.
- **Template de UI obligatorio**: no se ha definido ninguno todavía (a diferencia de otros
  proyectos que fijan un template desde el día 1).

## Restricción de dominio ya conocida (no depende del stack)

El modelo de datos (`arquitectura/modelo_datos.md`) ya establece que el sistema debe soportar
mensajes por **voz y texto**, con traducción **en tiempo real**, preservando **canal**,
**entonación** y **contexto regional** — cualquier stack elegido debe poder cumplir estas
restricciones funcionales.

Una vez decidido, actualizar este documento y `convenciones/README.md` (agregar manuales por
tecnología) y avanzar la fase F3 con `softverse_advance_phase("F3")`.
