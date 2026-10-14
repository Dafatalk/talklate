# TalkLate - App movil (Expo / React Native)

Frontend de TalkLate, adaptado del template **Luna** (`componentes/template/native-luna`). Mantiene su sistema de
componentes (Header, Button, Chip, Input, ThemedText, tema claro/oscuro con NativeWind) y reemplaza las vistas
del chatbot por las de TalkLate.

## Pantallas

| Ruta | Para que sirve | HU |
| --- | --- | --- |
| `screens/welcome` | Bienvenida | - |
| `screens/signup` | Registro (nombre, apellido, correo, fecha de nacimiento, contrasena) | Registrarme |
| `screens/login` | Iniciar sesion | Iniciar sesion |
| `screens/forgot-password` | Codigo de recuperacion y nueva contrasena | Recuperar mi contrasena |
| `(drawer)/index` | Sin `id`: nueva conversacion (idioma y region destino). Con `id`: traductor | Crear / configurar conversacion, ingresar, traducir, escuchar, recibir por el mismo canal, interlocutor, reportar |
| `screens/historial` | Buscar, abrir, renombrar y eliminar conversaciones | Historial |
| `screens/profile` | Datos del usuario, tema y cerrar sesion | Cerrar sesion |
| `screens/admin-idiomas` | Activar idiomas y agregar idiomas y regiones (solo administrador) | Administrar idiomas y regiones |
| `screens/admin-reportes` | Revisar reportes de mala traduccion (solo administrador) | Revisar reportes |

## Como correrla

```bash
# 1. Backend (en otra terminal): ver ../backend/README.md
cd ../backend && npm install && npm start

# 2. App
cd frontend
npm install --legacy-peer-deps
npm run web        # navegador (la forma mas rapida de probar, incluye dictado por voz en Chrome)
npm start          # Expo: escanea el QR con Expo Go (celular y computador en la misma red wifi)
```

La app encuentra el backend sola: en web usa `http://<host>:3000/api`; en Expo Go usa la IP del computador
que corre Expo. Si necesitas otra direccion: `EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api npm start`.

Usuario administrador de prueba: `admin@talklate.app` / `Admin123!` (se crea al arrancar el backend).

## Voz

- **Escuchar la traduccion:** `expo-speech` (funciona en celular y navegador). El tono detectado cambia el tono y
  la velocidad de la voz.
- **Hablar:** en el navegador (Chrome) el boton del microfono dicta con la API de reconocimiento de voz. En celular
  (Expo Go) se usa el microfono del teclado para dictar y el mensaje se envia por el canal de voz.
  Reconocimiento de voz nativo dentro de la app queda pendiente (ver `arquitectura/decisiones.md`).

## Verificacion

```bash
npm run typecheck     # TypeScript
npm run export:web    # compila la app para web (sirve para comprobar que todo empaqueta)
```
