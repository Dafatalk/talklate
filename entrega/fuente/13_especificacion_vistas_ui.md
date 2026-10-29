# 13. Especificacion de vistas y UI - TalkLate

**Fase 4/5 - Diagramas C4 y especificacion de componentes UI**

**Version:** 1.0 (29/10/2026). Template de UI: **Luna** (`componentes/template/native-luna`). Cada etapa del Customer Journey Map esta mapeada a pantallas y componentes de `frontend/`. Diagramas C4 en `09_diagramas_c4.md`.

---

## Customer Journey Map

| Etapa | Objetivo del usuario | Acciones del usuario | Puntos de contacto / Interfaz | Funcionalidades clave | Emociones / Experiencia | Oportunidades de mejora |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Registro | Acceder a la aplicacion y crear una cuenta | Ingreso a la app, opcion "crear cuenta", ingreso de datos personales | Pantalla de inicio de sesion, formulario de registro | Registro de usuario, validacion de datos | Expectativa, motivacion | Agilizar el proceso de registro, con opciones de redes sociales |
| 2. Recuperacion de contrasena | Recuperar acceso en caso de olvido | Seleccion de "restablecer contrasena", ingreso de correo electronico | Pantalla de recuperacion, correo de confirmacion | Envio automatico de correo con un codigo de 6 digitos (vence en 15 minutos) | Tranquilidad, confianza | Mejorar la seguridad y la rapidez del proceso |
| 3. Inicio de sesion | Ingresar a la aplicacion con credenciales | Ingreso de usuario y contrasena, acceso a la app | Pantalla de login, validacion de credenciales | Autenticacion segura, redireccion a la interfaz principal | Confianza, satisfaccion | Agregar opciones de inicio con redes sociales |
| 4. Configuracion de idioma y region | Seleccionar el idioma y la region de destino | Eleccion del idioma y region antes de traducir el mensaje | Menu de configuracion, selector de idioma y region | Personalizacion cultural, deteccion automatica de idioma | Confianza, claridad | Mejorar la deteccion automatica y sugerencias de region |
| 5. Entrada de mensaje | Escribir o hablar el mensaje a traducir | Ingreso de texto o activacion del microfono para voz | Campo de texto, boton de microfono, interfaz de voz | Entrada por texto o voz, deteccion automatica del idioma | Comodidad, versatilidad | Optimizar la precision del reconocimiento de voz y texto |
| 6. Traduccion cultural y emocional | Obtener una traduccion que mantenga el tono y la cultura | La aplicacion traduce el mensaje y lo adapta culturalmente | Interfaz de traduccion, motor de IA con analisis cultural y emocional | Traduccion adaptativa, equivalencias culturales, mantenimiento del tono | Asombro, satisfaccion | Mejorar la precision y naturalidad de las adaptaciones culturales |
| 7. Entrega del mensaje traducido | Recibir el mensaje en el canal original de entrada | Visualizar o escuchar el mensaje traducido en el mismo formato que se utilizo para enviarlo | Pantalla de resultados, reproductor de audio, interfaz de texto | Adaptacion del canal de entrega, traduccion contextualizada | Satisfaccion, conexion emocional | Mejorar la sincronizacion entre voz y texto, garantizar calidad en ambos formatos |
| 8. Conversacion continua | Mantener un flujo de comunicacion fluido y natural | El usuario toca "Otra persona" y le pasa el celular; la respuesta se traduce a su idioma (si el texto no parece del idioma esperado, la app avisa) | Interfaz de conversacion, deteccion automatica de idioma | Traduccion en tiempo real, adaptacion continua del contexto | Confianza, fluidez | Optimizar la velocidad de traduccion y precision en contextos complejos |
| 9. Retroalimentacion y mejora | Evaluar la calidad de la traduccion y contribuir a la mejora | Reportar una traduccion con un motivo y una sugerencia (el administrador los revisa) | Pantalla de retroalimentacion, formulario de feedback | Aprendizaje automatico, personalizacion de la app | Satisfaccion, confianza a largo plazo | Implementar mejoras continuas basadas en feedback |

**Fuente:** hoja "Customer Journey Map" del modelo de dominio enriquecido.

## Etapas del Customer Journey Map en la app

| Etapa | Pantalla (`frontend/app/...`) | Componentes | HU |
| --- | --- | --- | --- |
| 1. Registro | `screens/welcome`, `screens/signup`, `screens/politica-datos` | Button, Input, casilla de consentimiento | HU0015 |
| 2. Recuperacion de contrasena | `screens/forgot-password` | Input, Button | HU0017 |
| 3. Inicio de sesion | `screens/login` | Input, Button | HU0016 |
| 4. Configuracion de idioma y region | `(drawer)/index` sin `id` (`components/talklate/NuevaConversacion`) | Selector (Chip), Input | HU0006, HU0008, HU0009, HU0023 |
| 5. Entrada de mensaje | `(drawer)/index` con `id` (`ChatView`) | BurbujaVoz (modo voz por defecto: tocar, hablar y soltar con 1.5 s de silencio), TranslatorInput (modo chat: escribir o grabar) | HU0001, HU0002 |
| 6. Traduccion cultural y emocional | `ChatView` | BurbujaVoz girando mientras traduce; MessageBubble (traduccion, tono, nota cultural) | HU0003, HU0007 |
| 7. Entrega del mensaje traducido | `ChatView` | Voz natural con la emocion del mensaje (reproduccion automatica en la burbuja), boton Escuchar en el chat; voz del celular de respaldo | HU0004, HU0005 |
| 8. Conversacion continua | `ChatView`, `screens/historial`, menu lateral | TranslatorInput ("Yo" / "Otra persona"), CustomDrawerContent | HU0010 a HU0014, HU0019, HU0020 |
| 9. Retroalimentacion y mejora | `ChatView` (Reportar), `screens/admin-reportes` | PromptModal, Selector | HU0021, HU0022 |
| Cuenta | `screens/profile` | Cerrar sesion, Eliminar mi cuenta | HU0018, HU0026 |
| Administracion | `screens/admin-idiomas` | Switch, Input, Selector | HU0024, HU0025 |

## Diferencias con el diseno original (decididas al construir)

- Etapa 2: codigo de 6 digitos en vez de enlace (no requiere abrir el correo en el mismo celular).
- Etapa 8: la respuesta de la otra persona se marca con "Otra persona" en vez de detectarse sola, para no confundir quien habla.
- Etapa 9: reportar con motivo en vez de calificar con estrellas, porque el reporte dice que mejorar.
- Etapa 5: la pantalla del traductor abre en la burbuja animada que representa la IA (escucha, gira mientras traduce y habla); el chat queda a un toque en la cabecera, como en los asistentes de voz.
- Las opciones de inicio con redes sociales quedan como mejora futura.
