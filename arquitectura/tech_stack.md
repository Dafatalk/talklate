# Stack Tecnologico - TalkLate

**Fase 3 - Arquitectura de Software & Base de Datos**

**Estado:** definido construyendo y justificado despues en los ADR, como lo autorizo el mentor ("primero construimos y despues justificamos"). Cada decision tiene su ADR en `decisiones.md` con las alternativas que se compararon, y responde a un driver de `drivers.md`.

## Vista general

| Capa | Tecnologia | ADR |
| --- | --- | --- |
| App movil | Expo SDK 57, React Native 0.86, expo-router, NativeWind (Tailwind) | ADR-001, ADR-007 |
| Interfaz | Template Luna adaptado (tema claro y oscuro) | ADR-007 |
| Voz | Dictado del navegador o del teclado para hablar; `expo-speech` para escuchar | ADR-005 |
| Backend | Node.js 22 y Express 4: monolito modular en arquitectura hexagonal, API REST `/api/v1` con OpenAPI | ADR-002, ADR-011, ADR-013 |
| Base de datos | SurrealDB 3.x en la nube (SurrealDB Cloud), detras de un repositorio; SQLite solo en pruebas | ADR-012 |
| Traduccion e IA | Qwen local (Ollama), Claude Sonnet de respaldo y motor de reglas espanol/ingles | ADR-004 |
| Autenticacion | JWT de acceso (15 min) y token de refresco rotativo; contrasenas con bcrypt | ADR-006 |
| Proteccion de datos | Mensajes cifrados con AES-256-GCM, consentimiento, eliminar cuenta, logs sin datos personales | ADR-010 |
| Pruebas y CI | `node:test` (cobertura minima 80 %, hoy 96 %), pruebas contra SurrealDB, TypeScript; GitHub Actions | - |

## Por que cada tecnologia y que alternativas se evaluaron

| Capa | Elegida | Por que | Alternativas evaluadas |
| --- | --- | --- | --- |
| App movil | Expo (React Native) | Una sola base de codigo para iOS, Android y web; aprovecha el template Luna; se prueba en el celular con Expo Go. | Flutter (otro lenguaje, Dart, y no usa el template); nativo Swift y Kotlin (dos desarrollos para dos personas); web responsiva (microfono y voz limitados). |
| Backend | Node.js con Express, en arquitectura hexagonal | Mismo lenguaje que la app; monolito modular suficiente para el alcance; la traduccion es por turno, asi que REST basta. Los puertos y adaptadores dan limites claros sin el costo de los microservicios. | Microservicios (complejidad sin necesidad); capas clasicas sin puertos; WebSocket o streaming (solo para traduccion simultanea); Python FastAPI (otro lenguaje); Java Spring Boot (mas pesado). |
| Base de datos | SurrealDB en la nube | Los enlaces entre registros siguen el modelo de dominio; el esquema con ASSERT y UNIQUE deja reglas del dominio en la base; no hay que instalar un servidor propio. | SQLite (archivo local, no sirve para varios usuarios ni produccion); PostgreSQL (muy maduro, relaciones con JOIN); SDK oficial de SurrealDB (dependencia extra). |
| Traduccion | Qwen local, Claude de respaldo y reglas | Adapta modismos y tono por region y explica la adaptacion; Qwen corre en el servidor (sin costo por mensaje y sin sacar datos); si falla, sigue funcionando. | DeepL o Google Translate (literal, no explican modismos); solo Claude (costo y datos a un tercero); solo reglas (no escala); NLLB o Argos (no siguen instrucciones de tono). |
| Voz | Dictado en el cliente y `expo-speech` | Funciona sin subir audio al servidor y sin infraestructura extra. | Whisper en el servidor (mas preciso, pero sube audio y requiere mas infraestructura); reconocimiento nativo (requiere un build propio de Expo). |
| Autenticacion | JWT corto y refresco rotativo | Recomendado para apps moviles; permite cerrar sesion de verdad (revocacion). | Sesiones en servidor (guardan estado); Firebase Auth o Auth0 (dependen de un tercero y sacan datos personales). |
| Datos personales | Cifrado de mensajes y logs sin PII | Cumple la Ley 1581 de 2012 sin dependencias nativas. | Cifrar toda la base (dependencia nativa; se deja al proveedor en produccion). |
| Nombres del dominio | Espanol en el codigo (la base en ingles) | Trazabilidad con el modelo de dominio y las reglas de negocio. | Todo en ingles (rompe la trazabilidad). |

## Estructura del codigo (capas)

El backend sigue una arquitectura hexagonal (puertos y adaptadores, ADR-013):
- `backend/src/dominio`: reglas puras (validaciones, errores de negocio, analisis de idioma, tono y region).
- `backend/src/aplicacion`: un caso de uso por epica (cuentas, sesiones, conversaciones, traduccion, catalogo, reportes).
- `backend/src/puertos`: contratos `Repositorio`, `MotorTraduccion`, `Notificador` y `Cifrador`.
- `backend/src/adaptadores`: HTTP (Express) de entrada; de salida SurrealDB y SQLite, Qwen, Claude y reglas, correo y cifrado.
- `backend/src/composicion.js`: elige los adaptadores segun el entorno y arma los casos de uso.
- `backend/db/surreal/schema.surql`: esquema de la base. `backend/openapi.yaml`: contrato de la API.
- `frontend/app`: pantallas (expo-router); `frontend/components/talklate`: componentes de TalkLate; `frontend/lib`: cliente de la API, reglas y voz.
- `componentes/template/native-luna/`: template original, sin cambios.

## Como correrlo

Ver el `README.md` de la raiz y `backend/README-surreal.md`: el backend en `http://localhost:3000` (con las credenciales de SurrealDB en `backend/.env`) y la app con `npm run web` o Expo Go (SDK 57).

## Pendiente

- Medir tiempo y calidad con Qwen local: `npm run medir` (DRV-01, DRV-02).
- Servicio de correo para el codigo de recuperacion de contrasena.
- Reconocimiento de voz nativo o en servidor, y validar el audio (formato y duracion).
- Desplegar el backend y el motor Qwen (F10).
