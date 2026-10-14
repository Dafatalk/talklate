# Convenciones - App movil Expo (React Native) + NativeWind

**Fase 0 - manual por tecnologia (agregado al decidir el stack en F3).**

## Estructura
```
frontend/
  app/                      rutas de expo-router (pantallas); app/(drawer) es el traductor
  app/contexts/             sesion (AuthContext), historial (ConversacionesContext), tema
  components/               componentes del template Luna (Header, Button, Chip, Input, ThemedText...)
  components/talklate/      componentes propios de TalkLate (ChatView, MessageBubble, TranslatorInput...)
  lib/api.ts                cliente del API /api/v1 (renueva la sesion con el token de refresco)
  lib/reglas.ts             reglas sin dependencias de React Native (se prueban con node)
  lib/voz.ts                voz: escuchar (expo-speech) y dictado
  test/                     pruebas de lib/reglas.ts
```

## Reglas (heredadas del template Luna)
- Usar los componentes existentes antes de crear nuevos: `ThemedText` para texto, `Button`, `Chip`, `Input`, `Header`, `ThemeScroller`.
- Estilos con `className` (Tailwind) y siempre con variante clara y oscura (`bg-light-primary dark:bg-dark-primary`).
- TypeScript estricto; `npm run typecheck` sin errores.
- La logica que no depende de la interfaz va en `lib/` para poder probarla.
- Mensajes de UI en espanol y cortos; los errores del servidor se muestran tal cual (ya vienen en espanol).
- La URL del API se resuelve sola (`apiBase()`); para otra direccion usar `EXPO_PUBLIC_API_URL`.

## Pruebas
- `npm test` (reglas), `npm run typecheck` y `npm run export:web` (comprueba que la app compila).
