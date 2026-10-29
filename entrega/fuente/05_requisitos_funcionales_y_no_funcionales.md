# 5. Requisitos funcionales y no funcionales - TalkLate

**Fase 2 - Especificacion de requerimientos**

**Version:** 1.0 (29/10/2026). Cada requisito funcional sale de una historia de usuario (`03_historias_de_usuario.md`) y cita la regla de negocio del modelo de datos (`12_modelo_de_datos.md`) que aplica. Los criterios de aceptacion estan en `04_criterios_de_aceptacion.md`.

Resumen: 26 requisitos funcionales, 10 requisitos no funcionales y 8 drivers de arquitectura (`06_drivers_de_arquitectura.md`).

## 1. Actores

| Actor | Descripcion | Necesita cuenta |
| --- | --- | --- |
| Cliente Traductor | Dueno del celular; usa la app para hablar con alguien en un idioma que no domina. | Si |
| Interlocutor | La otra persona de la conversacion; responde en su idioma con el celular del usuario. | No |
| Administrador | Mantiene el catalogo de idiomas y regiones y revisa los reportes de mala traduccion. | Si (rol administrador) |

## 2. Requisitos funcionales

Ordenados por prioridad (1 = mas valor), el mismo orden de los sprints.

| Prio | ID | Requisito | Historia | Epica | Sprint | Regla o fuente |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-TRAD-003 | El sistema debe traducir cada mensaje al idioma y region destino conservando tono, intencion y modismos (equivalente cultural, no literal), con nota cultural cuando adapte un modismo y marca de aproximada si quedan palabras sin traducir. | HU0003 | Traduccion de mensajes | 1 | Conversacion: Traducir Mensaje; Region: aplicar matices |
| 2 | REQ-TRAD-002 | El sistema debe permitir ingresar un mensaje escrito de 1 a 5000 caracteres, no vacio. | HU0002 | Traduccion de mensajes | 1 | MensajeOriginal |
| 3 | REQ-TRAD-001 | El sistema debe permitir ingresar un mensaje hablando: grabarlo en el celular, transcribirlo en el servidor (Whisper) y detectar la entonacion por las palabras y por la voz (volumen, variacion y velocidad). El mensaje se marca con el canal Voz. | HU0001 | Traduccion de mensajes | 1 | Canal |
| 4 | REQ-TRAD-004 | El sistema debe reproducir la traduccion con una voz natural del idioma y pais destino que replique la emocion detectada (enojo, alegria, preocupacion, amabilidad, formalidad) y la velocidad del hablante. | HU0004 | Traduccion de mensajes | 1 | Entonacion |
| 5 | REQ-TRAD-005 | El sistema debe entregar la traduccion por el mismo canal del mensaje original: audio (y texto) si fue por voz, texto si fue escrito. | HU0005 | Traduccion de mensajes | 1 | Canal: Entregar mensaje traducido |
| 6 | REQ-CONV-001 | El sistema debe exigir idioma y region destino, y la region debe ser valida para ese idioma. | HU0006 | Gestion de conversaciones | 1 | Conversacion-RN-1 |
| 7 | REQ-CONV-002 | El sistema debe reconocer el idioma de origen con el primer mensaje si no se eligio, y no cambiarlo en esa conversacion. | HU0007 | Gestion de conversaciones | 2 | Conversacion-RN-2 |
| 8 | REQ-CONV-003 | El sistema debe crear conversaciones con nombre por defecto "Nueva Conversacion" y validar que el par de idiomas este soportado. | HU0008 | Gestion de conversaciones | 2 | Conversacion-RN-3 |
| 9 | REQ-CONV-004 | El sistema debe conservar la configuracion de idiomas de la conversacion para todos sus mensajes. | HU0009 | Gestion de conversaciones | 2 | Conversacion: Configurar Parametros |
| 10 | REQ-CONV-005 | El sistema debe guardar cada mensaje original y su traduccion en el hilo de la conversacion, en orden. | HU0010 | Gestion de conversaciones | 2 | LenguajePorConversacion |
| 11 | REQ-INT-001 | El sistema debe mostrar y reproducir la traduccion para la otra persona sin pedirle cuenta ni instalar la app. | HU0019 | Participacion del interlocutor | 2 | Impacto del Interlocutor |
| 12 | REQ-INT-002 | El sistema debe traducir la respuesta de la otra persona al idioma del usuario dentro de la misma conversacion. | HU0020 | Participacion del interlocutor | 2 | Conversacion-RN-2 |
| 13 | REQ-IDIOMA-001 | El sistema debe mostrar solo los idiomas activos con sus regiones. | HU0023 | Administracion de idiomas y regiones | 2 | Lenguaje: Listar; Region: Listar |
| 14 | REQ-CONV-006 | El sistema debe listar solo las conversaciones del usuario, paginadas y ordenadas por actividad reciente. | HU0011 | Gestion de conversaciones | 2 | Conversacion: Consultar historial |
| 15 | REQ-CONV-007 | El sistema debe mostrar los mensajes originales y traducidos de una conversacion del usuario, y negar el acceso a las de otra persona. | HU0012 | Gestion de conversaciones | 2 | Conversacion: Consultar |
| 16 | REQ-USR-001 | El sistema debe registrar usuarios con nombre, apellido, correo unico, contrasena segura, fecha de nacimiento (13 anos o mas) y aceptacion de la politica de tratamiento de datos. | HU0015 | Cuenta de usuario | 3 | Usuario-RN-1 a RN-4; Ley 1581 |
| 17 | REQ-USR-002 | El sistema debe iniciar sesion con correo y contrasena, bloquear temporalmente tras intentos fallidos y mantener la sesion con un token de refresco. | HU0016 | Cuenta de usuario | 3 | Usuario-RN-5 |
| 18 | REQ-REP-001 | El sistema debe permitir reportar una traduccion propia una sola vez, con un motivo de 3 a 500 caracteres. | HU0021 | Reportes | 3 | Lenguaje: Generar reporte |
| 19 | REQ-CONV-008 | El sistema debe permitir renombrar con 3 a 80 caracteres, sin caracteres especiales ni palabras ofensivas, sin cambiar el identificador. | HU0013 | Gestion de conversaciones | 2 | Conversacion-RN-4, RN-5 |
| 20 | REQ-CONV-009 | El sistema debe eliminar la conversacion con sus mensajes y reportes, previa confirmacion. | HU0014 | Gestion de conversaciones | 2 | Conversacion: Eliminar |
| 21 | REQ-USR-003 | El sistema debe enviar un codigo de 6 digitos valido por 15 minutos y de un solo uso para definir una nueva contrasena segura. | HU0017 | Cuenta de usuario | 3 | Usuario-RN-6 a RN-9 |
| 22 | REQ-USR-004 | El sistema debe invalidar el token de acceso y el de refresco al cerrar sesion. | HU0018 | Cuenta de usuario | 2 | Usuario-RN-10 |
| 23 | REQ-REP-002 | El sistema debe permitir al administrador listar, filtrar y marcar reportes como revisados o descartados. | HU0022 | Reportes | 3 | Rol administrador |
| 24 | REQ-IDIOMA-002 | El sistema debe permitir al administrador agregar idiomas (nombre y codigo unicos) y regiones (unicas dentro del pais). | HU0024 | Administracion de idiomas y regiones | 3 | Combinaciones unicas |
| 25 | REQ-IDIOMA-003 | El sistema debe permitir al administrador activar o desactivar idiomas sin afectar las conversaciones existentes. | HU0025 | Administracion de idiomas y regiones | 3 | Lenguaje.activo |
| 26 | REQ-USR-005 | El sistema debe eliminar la cuenta y todos sus datos cuando el usuario lo pida y confirme con su contrasena. | HU0026 | Cuenta de usuario | 3 | Ley 1581 (derecho al olvido) |

## 3. Requisitos no funcionales

| ID | Atributo de calidad | Requisito y criterio medible | Driver | Como se verifica |
| --- | --- | --- | --- | --- |
| RNF-001 | Desempeno | "Tiempo real" es traduccion por turno: texto en 3 s o menos (p95); voz en 5 s o menos, contando transcripcion y audio de salida. | DRV-01 | `npm run medir`, `npm run medir:voz` y evento de log `traduccion` (`duracion_ms`) |
| RNF-002 | Exactitud cultural | El 80 % de los modismos del glosario de prueba se traducen con su equivalente cultural, no literal. | DRV-02 | `npm run medir` con Qwen |
| RNF-003 | Seguridad y privacidad | Datos personales segun `16_matriz_sensibilidad_datos.md`: mensajes cifrados en reposo (AES-GCM), acceso solo del dueno, logs sin datos personales, consentimiento y eliminacion de cuenta (Ley 1581 de 2012). | DRV-03 | Pruebas `api.test.js` y `seguridad.test.js` |
| RNF-004 | Extensibilidad | Se agregan idiomas y regiones sin cambiar codigo. | DRV-04 | Prueba del administrador |
| RNF-005 | Disponibilidad | Si un motor de IA falla, el servicio sigue: traduccion Qwen -> Claude -> reglas; voz VoiceStudio -> Azure -> OpenAI -> voz del celular. | DRV-05 | `motores.test.js` |
| RNF-006 | Seguridad (abuso) | 30 mensajes por minuto por usuario, 8 intentos de inicio de sesion fallidos, 5 solicitudes de recuperacion cada 15 minutos. | DRV-06 | Pruebas de seguridad |
| RNF-007 | Portabilidad | Una sola base de codigo para iOS, Android y web. | DRV-07 | Compilacion web y Expo Go |
| RNF-008 | Mantenibilidad | Cobertura de pruebas de 80 % o mas en la logica de negocio; arquitectura hexagonal con puertos verificados al arrancar y reglas de dependencia validadas con dependency-cruiser. | DRV-08 | `npm run coverage`, `npm run arch:check` y CI |
| RNF-009 | Interoperabilidad | La API sigue la convencion REST del proyecto y esta documentada en OpenAPI 3.0. | DRV-08 | `backend/openapi.yaml` y `/api/v1/docs` |
| RNF-010 | Naturalidad de la voz | La voz de salida replica la emocion detectada (enojo, alegria, preocupacion, amabilidad, formalidad); 7 de cada 10 personas de prueba la califican como comprensible y natural. | DRV-02 | Prueba de escucha con usuarios y audios de `npm run medir:voz` |

## 4. Trazabilidad impacto -> requisito -> driver

| Impacto (mapa de impacto) | Requisitos funcionales | Drivers y RNF |
| --- | --- | --- |
| 1. Interactuar facil y rapido con quien habla otro idioma, conservando cultura, tono y modismos | REQ-TRAD-001, 002, 003 | DRV-01 / RNF-001, DRV-02 / RNF-002, DRV-05 / RNF-005 |
| 2. Sostener una conversacion natural, hablando y escuchando | REQ-TRAD-004, 005 | DRV-01 / RNF-001, DRV-02 / RNF-010 |
| 3. Empezar a conversar en menos de un minuto | REQ-CONV-001, 002, REQ-IDIOMA-001 | DRV-04 / RNF-004 |
| 4. Mantener el contexto de toda la charla | REQ-CONV-003, 004, 005 | DRV-08 / RNF-008 |
| 5. Que el interlocutor participe sin instalar la app | REQ-INT-001, 002 | DRV-07 / RNF-007 |
| 6. Aprender con conversaciones pasadas | REQ-CONV-006, 007, 008, 009 | DRV-03 / RNF-003 |
| 7. Cuenta segura que solo el usuario ve | REQ-USR-001 a 005 | DRV-03 / RNF-003, DRV-06 / RNF-006 |
| 8. Senalar traducciones incorrectas | REQ-REP-001 | DRV-02 / RNF-002 |
| 9. Priorizar mejoras con los reportes | REQ-REP-002 | DRV-03 / RNF-003 |
| 10. Ampliar idiomas y regiones con calidad | REQ-IDIOMA-002, 003 | DRV-04 / RNF-004 |

## 5. Fuera del alcance del MVP

- Compartir o exportar conversaciones y editar los datos del perfil: no tienen regla en el modelo de dominio; quedan para una version futura.
- Detectar el acento por el sonido de la voz: en el MVP la region de origen se reconoce por el vocabulario.
- Reentrenar el modelo de IA con los reportes: los reportes se guardan y se revisan; el reentrenamiento es evolucion futura.
