# Especificación de Vistas / UI — TalkLate

**Fase 4/5 · Diagramas C4 & Especificación de Componentes UI**

**Estado:** borrador. No hay mapeo a componentes de un template de UI concreto porque el stack de
frontend aún no está decidido (ver `arquitectura/tech_stack.md`, F3 bloqueada). Lo que sí existe
es el insumo UX — el Customer Journey Map — migrado desde `Modelo de Dominio Enriquecido.xlsx`.

---

## Customer Journey Map

| Etapa | Objetivo del usuario | Acciones del usuario | Puntos de contacto / Interfaz | Funcionalidades clave | Emociones / Experiencia | Oportunidades de mejora |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Registro | Acceder a la aplicación y crear una cuenta | Ingreso a la app, opción "crear cuenta", ingreso de datos personales | Pantalla de inicio de sesión, formulario de registro | Registro de usuario, validación de datos | Expectativa, motivación | Agilizar el proceso de registro, con opciones de redes sociales |
| 2. Recuperación de contraseña | Recuperar acceso en caso de olvido | Selección de "restablecer contraseña", ingreso de correo electrónico | Pantalla de recuperación, correo de confirmación | Envío automático de correo, enlace de recuperación | Tranquilidad, confianza | Mejorar la seguridad y la rapidez del proceso |
| 3. Inicio de sesión | Ingresar a la aplicación con credenciales | Ingreso de usuario y contraseña, acceso a la app | Pantalla de login, validación de credenciales | Autenticación segura, redirección a la interfaz principal | Confianza, satisfacción | Agregar opciones de inicio con redes sociales |
| 4. Configuración de idioma y región | Seleccionar el idioma y la región de destino | Elección del idioma y región antes de traducir el mensaje | Menú de configuración, selector de idioma y región | Personalización cultural, detección automática de idioma | Confianza, claridad | Mejorar la detección automática y sugerencias de región |
| 5. Entrada de mensaje | Escribir o hablar el mensaje a traducir | Ingreso de texto o activación del micrófono para voz | Campo de texto, botón de micrófono, interfaz de voz | Entrada por texto o voz, detección automática del idioma | Comodidad, versatilidad | Optimizar la precisión del reconocimiento de voz y texto |
| 6. Traducción cultural y emocional | Obtener una traducción que mantenga el tono y la cultura | La aplicación traduce el mensaje y lo adapta culturalmente | Interfaz de traducción, motor de IA con análisis cultural y emocional | Traducción adaptativa, equivalencias culturales, mantenimiento del tono | Asombro, satisfacción | Mejorar la precisión y naturalidad de las adaptaciones culturales |
| 7. Entrega del mensaje traducido | Recibir el mensaje en el canal original de entrada | Visualizar o escuchar el mensaje traducido en el mismo formato que se utilizó para enviarlo | Pantalla de resultados, reproductor de audio, interfaz de texto | Adaptación del canal de entrega, traducción contextualizada | Satisfacción, conexión emocional | Mejorar la sincronización entre voz y texto, garantizar calidad en ambos formatos |
| 8. Conversación continua | Mantener un flujo de comunicación fluido y natural | La app identifica automáticamente el idioma de la respuesta y traduce en consecuencia | Interfaz de conversación, detección automática de idioma | Traducción en tiempo real, adaptación continua del contexto | Confianza, fluidez | Optimizar la velocidad de traducción y precisión en contextos complejos |
| 9. Retroalimentación y mejora | Evaluar la calidad de la traducción y contribuir a la mejora | Dejar comentarios, calificar la traducción, sugerir mejoras | Pantalla de retroalimentación, formulario de feedback | Aprendizaje automático, personalización de la app | Satisfacción, confianza a largo plazo | Implementar mejoras continuas basadas en feedback |

**Fuente:** hoja "Customer Journey Map" de `Modelo de Dominio Enriquecido.xlsx`.

## Pendiente

- Mapeo de cada etapa a pantallas/componentes concretos, una vez elegido el stack de frontend y
  (si aplica) un template de UI de referencia.
- Wireframes o mockups — no existen todavía en la documentación original.
