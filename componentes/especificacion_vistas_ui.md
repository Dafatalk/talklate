# Especificación de Vistas / UI — TalkLate

**Fase 4/5 · Diagramas C4 & Especificación de Componentes UI**

**Estado:** template de UI definido (**Luna**, `componentes/template/native-luna`) y cada etapa del Customer Journey Map mapeada a pantallas y componentes de `frontend/`. Diagramas C4 en `arquitectura/c4.md`.

---

## Customer Journey Map

| Etapa | Objetivo del usuario | Acciones del usuario | Puntos de contacto / Interfaz | Funcionalidades clave | Emociones / Experiencia | Oportunidades de mejora |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Registro | Acceder a la aplicación y crear una cuenta | Ingreso a la app, opción "crear cuenta", ingreso de datos personales | Pantalla de inicio de sesión, formulario de registro | Registro de usuario, validación de datos | Expectativa, motivación | Agilizar el proceso de registro, con opciones de redes sociales |
| 2. Recuperación de contraseña | Recuperar acceso en caso de olvido | Selección de "restablecer contraseña", ingreso de correo electrónico | Pantalla de recuperación, correo de confirmación | Envío automático de correo con un código de 6 dígitos (vence en 15 minutos) | Tranquilidad, confianza | Mejorar la seguridad y la rapidez del proceso |
| 3. Inicio de sesión | Ingresar a la aplicación con credenciales | Ingreso de usuario y contraseña, acceso a la app | Pantalla de login, validación de credenciales | Autenticación segura, redirección a la interfaz principal | Confianza, satisfacción | Agregar opciones de inicio con redes sociales |
| 4. Configuración de idioma y región | Seleccionar el idioma y la región de destino | Elección del idioma y región antes de traducir el mensaje | Menú de configuración, selector de idioma y región | Personalización cultural, detección automática de idioma | Confianza, claridad | Mejorar la detección automática y sugerencias de región |
| 5. Entrada de mensaje | Escribir o hablar el mensaje a traducir | Ingreso de texto o activación del micrófono para voz | Campo de texto, botón de micrófono, interfaz de voz | Entrada por texto o voz, detección automática del idioma | Comodidad, versatilidad | Optimizar la precisión del reconocimiento de voz y texto |
| 6. Traducción cultural y emocional | Obtener una traducción que mantenga el tono y la cultura | La aplicación traduce el mensaje y lo adapta culturalmente | Interfaz de traducción, motor de IA con análisis cultural y emocional | Traducción adaptativa, equivalencias culturales, mantenimiento del tono | Asombro, satisfacción | Mejorar la precisión y naturalidad de las adaptaciones culturales |
| 7. Entrega del mensaje traducido | Recibir el mensaje en el canal original de entrada | Visualizar o escuchar el mensaje traducido en el mismo formato que se utilizó para enviarlo | Pantalla de resultados, reproductor de audio, interfaz de texto | Adaptación del canal de entrega, traducción contextualizada | Satisfacción, conexión emocional | Mejorar la sincronización entre voz y texto, garantizar calidad en ambos formatos |
| 8. Conversación continua | Mantener un flujo de comunicación fluido y natural | El usuario toca "Otra persona" y le pasa el celular; la respuesta se traduce a su idioma (si el texto no parece del idioma esperado, la app avisa) | Interfaz de conversación, detección automática de idioma | Traducción en tiempo real, adaptación continua del contexto | Confianza, fluidez | Optimizar la velocidad de traducción y precisión en contextos complejos |
| 9. Retroalimentación y mejora | Evaluar la calidad de la traducción y contribuir a la mejora | Reportar una traducción con un motivo y una sugerencia (el administrador los revisa) | Pantalla de retroalimentación, formulario de feedback | Aprendizaje automático, personalización de la app | Satisfacción, confianza a largo plazo | Implementar mejoras continuas basadas en feedback |

**Fuente:** hoja "Customer Journey Map" de `Modelo de Dominio Enriquecido.xlsx`.

## Etapas del Customer Journey Map en la app

| Etapa | Pantalla (`frontend/app/...`) | Componentes | HU |
| --- | --- | --- | --- |
| 1. Registro | `screens/welcome`, `screens/signup`, `screens/politica-datos` | Button, Input, casilla de consentimiento | HU0015 |
| 2. Recuperación de contraseña | `screens/forgot-password` | Input, Button | HU0017 |
| 3. Inicio de sesión | `screens/login` | Input, Button | HU0016 |
| 4. Configuración de idioma y región | `(drawer)/index` sin `id` (`components/talklate/NuevaConversacion`) | Selector (Chip), Input | HU0006, HU0008, HU0009, HU0023 |
| 5. Entrada de mensaje | `(drawer)/index` con `id` (`ChatView`) | TranslatorInput (modo texto o voz) | HU0001, HU0002 |
| 6. Traducción cultural y emocional | `ChatView` | MessageBubble (traducción, tono, nota cultural) | HU0003, HU0007 |
| 7. Entrega del mensaje traducido | `ChatView` | Botón Escuchar (expo-speech), reproducción automática por voz | HU0004, HU0005 |
| 8. Conversación continua | `ChatView`, `screens/historial`, menú lateral | TranslatorInput ("Yo" / "Otra persona"), CustomDrawerContent | HU0010 a HU0014, HU0019, HU0020 |
| 9. Retroalimentación y mejora | `ChatView` (Reportar), `screens/admin-reportes` | PromptModal, Selector | HU0021, HU0022 |
| Cuenta | `screens/profile` | Cerrar sesión, Eliminar mi cuenta | HU0018, HU0026 |
| Administración | `screens/admin-idiomas` | Switch, Input, Selector | HU0024, HU0025 |

## Diferencias con el diseño original (decididas al construir)

- Etapa 2: código de 6 dígitos en vez de enlace (no requiere abrir el correo en el mismo celular).
- Etapa 8: la respuesta de la otra persona se marca con "Otra persona" en vez de detectarse sola, para no confundir quién habla.
- Etapa 9: reportar con motivo en vez de calificar con estrellas, porque el reporte dice qué mejorar.
- Las opciones de inicio con redes sociales quedan como mejora futura.
