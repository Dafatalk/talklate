# Stack Tecnico - TalkLate

**Fase 3 - Arquitectura de Software & Base de Datos**

**Estado:** definido construyendo; la justificacion esta en los ADR (primero construimos y despues justificamos, como dijo Farid). Cada decision tiene su ADR en `decisiones.md` y responde a un driver de `drivers.md`.

| Capa | Tecnologia | ADR |
| --- | --- | --- |
| App movil | Expo SDK 54, React Native 0.81, expo-router, NativeWind (Tailwind) | ADR-001, ADR-007 |
| Interfaz | Template Luna adaptado (componentes Header, Button, Chip, Input, ThemedText; tema claro y oscuro) | ADR-007 |
| Voz | `expo-speech` para escuchar la traduccion; dictado del navegador o del teclado para hablar | ADR-005 |
| Backend | Node.js 22, Express 4 (API REST) | ADR-002 |
| Base de datos | SQLite (`node:sqlite`); migracion futura a PostgreSQL | ADR-003 |
| Traduccion e IA | Qwen local (Ollama), Claude Sonnet de respaldo y motor de reglas espanol/ingles | ADR-004 |
| Autenticacion | JWT con revocacion en servidor, bcrypt | ADR-006 |
| Pruebas | `node:test` (backend, 19 pruebas); TypeScript y compilacion web en el frontend | - |

## Estructura del codigo

- `backend/`: API (rutas en `src/routes`, reglas en `src/lib`, esquema en `src/db.js`). Ver `backend/README.md`.
- `frontend/`: app (pantallas en `app`, componentes de TalkLate en `components/talklate`). Ver `frontend/README.md`.
- `componentes/template/native-luna/`: template original, sin cambios.

## Como correrlo

Ver el `README.md` de la raiz: el backend en `http://localhost:3000` y la app con `npm run web` o Expo Go.

## Pendiente

- Medir la latencia y la calidad real de Qwen local (y de Claude Sonnet si hace falta) con jerga (DRV-01, DRV-02).
- Servicio de correo para el codigo de recuperacion de contrasena.
- Reconocimiento de voz nativo o en servidor, y validar el audio (formato y duracion).
- Migrar a PostgreSQL y desplegar (F10).
