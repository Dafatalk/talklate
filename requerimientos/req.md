# Requerimientos - TalkLate

**Fase 2 - Especificacion de Requerimientos**

**Estado:** alineado con el Mapa de Impacto (`seguimiento/mapa_impacto/Mapa de Impacto.xlsx`) y las historias de usuario. Cada requerimiento funcional sale de una historia (trazabilidad REQ -> HU -> impacto) y cita la regla de negocio de `arquitectura/modelo_datos.md` que aplica. Los criterios de aceptacion estan en `criterios_aceptacion.md`.

## Actores

| Actor | Descripcion |
| --- | --- |
| Cliente Traductor | Dueno del dispositivo; usa la app para comunicarse en un idioma que no domina. |
| Interlocutor | La otra persona de la conversacion; no instala la app ni crea cuenta. |
| Administrador | Mantiene el catalogo de idiomas y regiones y revisa los reportes de calidad. |

## Requerimientos funcionales

### Traduccion de mensajes

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-TRAD-001 | El sistema debe permitir ingresar un mensaje por voz; el mensaje se marca con el canal Voz. | HU0001 Ingresar mi mensaje hablando | Canal |
| REQ-TRAD-002 | El sistema debe permitir ingresar un mensaje escrito de 1 a 5000 caracteres, no vacio. | HU0002 Ingresar mi mensaje escribiendo | MensajeOriginal |
| REQ-TRAD-003 | El sistema debe traducir cada mensaje al idioma y region destino conservando tono, intencion y modismos (equivalente cultural, no literal), con nota cultural cuando adapte un modismo y marca de aproximada si quedan palabras sin traducir. | HU0003 Traducir mi mensaje al idioma destino en tiempo real | Conversacion: Traducir Mensaje; Region: aplicar matices |
| REQ-TRAD-004 | El sistema debe reproducir la traduccion en audio con la voz del idioma y pais destino, ajustando tono y velocidad segun la entonacion. | HU0004 Escuchar el mensaje traducido | Entonacion |
| REQ-TRAD-005 | El sistema debe entregar la traduccion por el mismo canal del mensaje original: audio (y texto) si fue por voz, texto si fue escrito. | HU0005 Recibir la traduccion por el mismo canal que use | Canal: Entregar mensaje traducido |

### Gestion de conversaciones

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-CONV-001 | El sistema debe exigir idioma y region destino, y la region debe ser valida para ese idioma. | HU0006 Seleccionar el idioma y la region destino | Conversacion-RN-1 |
| REQ-CONV-002 | El sistema debe reconocer el idioma de origen con el primer mensaje si no se eligio, y no cambiarlo en esa conversacion. | HU0007 Reconocer el idioma origen | Conversacion-RN-2 |
| REQ-CONV-003 | El sistema debe crear conversaciones con nombre por defecto "Nueva Conversacion" y validar que el par de idiomas este soportado. | HU0008 Crear una conversacion | Conversacion-RN-3 |
| REQ-CONV-004 | El sistema debe conservar la configuracion de idiomas de la conversacion para todos sus mensajes. | HU0009 Configurar los parametros una sola vez | Conversacion: Configurar Parametros |
| REQ-CONV-005 | El sistema debe guardar cada mensaje original y su traduccion en el hilo de la conversacion, en orden. | HU0010 Mantener el hilo continuo | LenguajePorConversacion |
| REQ-CONV-006 | El sistema debe listar solo las conversaciones del usuario, paginadas y ordenadas por actividad reciente. | HU0011 Consultar mi historial | Conversacion: Consultar historial |
| REQ-CONV-007 | El sistema debe mostrar los mensajes originales y traducidos de una conversacion del usuario, y negar el acceso a las de otra persona. | HU0012 Abrir una conversacion anterior | Conversacion: Consultar |
| REQ-CONV-008 | El sistema debe permitir renombrar con 3 a 80 caracteres, sin caracteres especiales ni palabras ofensivas, sin cambiar el identificador. | HU0013 Renombrar una conversacion | Conversacion-RN-4, RN-5 |
| REQ-CONV-009 | El sistema debe eliminar la conversacion con sus mensajes y reportes, previa confirmacion. | HU0014 Eliminar una conversacion | Conversacion: Eliminar |

### Cuenta de usuario

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-USR-001 | El sistema debe registrar usuarios con nombre, apellido, correo unico, contrasena segura, fecha de nacimiento (13 anos o mas) y aceptacion de la politica de tratamiento de datos. | HU0015 Registrarme en la aplicacion | Usuario-RN-1 a RN-4; Ley 1581 |
| REQ-USR-002 | El sistema debe iniciar sesion con correo y contrasena, bloquear temporalmente tras intentos fallidos y mantener la sesion con un token de refresco. | HU0016 Iniciar sesion | Usuario-RN-5 |
| REQ-USR-003 | El sistema debe enviar un codigo de 6 digitos valido por 15 minutos y de un solo uso para definir una nueva contrasena segura. | HU0017 Recuperar mi contrasena | Usuario-RN-6 a RN-9 |
| REQ-USR-004 | El sistema debe invalidar el token de acceso y el de refresco al cerrar sesion. | HU0018 Cerrar sesion | Usuario-RN-10 |
| REQ-USR-005 | El sistema debe eliminar la cuenta y todos sus datos cuando el usuario lo pida y confirme con su contrasena. | HU0026 Eliminar mi cuenta | Ley 1581 (derecho al olvido) |

### Participacion del interlocutor

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-INT-001 | El sistema debe mostrar y reproducir la traduccion para la otra persona sin pedirle cuenta ni instalar la app. | HU0019 Recibir el mensaje traducido | Impacto del Interlocutor |
| REQ-INT-002 | El sistema debe traducir la respuesta de la otra persona al idioma del usuario dentro de la misma conversacion. | HU0020 Responder en mi idioma | Conversacion-RN-2 |

### Reportes

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-REP-001 | El sistema debe permitir reportar una traduccion propia una sola vez, con un motivo de 3 a 500 caracteres. | HU0021 Reportar una mala traduccion | Lenguaje: Generar reporte |
| REQ-REP-002 | El sistema debe permitir al administrador listar, filtrar y marcar reportes como revisados o descartados. | HU0022 Revisar los reportes de mala traduccion | Rol administrador |

### Administracion de idiomas y regiones

| ID | Requerimiento | HU | Regla o fuente |
| --- | --- | --- | --- |
| REQ-IDIOMA-001 | El sistema debe mostrar solo los idiomas activos con sus regiones. | HU0023 Consultar los idiomas disponibles | Lenguaje: Listar; Region: Listar |
| REQ-IDIOMA-002 | El sistema debe permitir al administrador agregar idiomas (nombre y codigo unicos) y regiones (unicas dentro del pais). | HU0024 Agregar un idioma o una region | Combinaciones unicas |
| REQ-IDIOMA-003 | El sistema debe permitir al administrador activar o desactivar idiomas sin afectar las conversaciones existentes. | HU0025 Activar o desactivar un idioma o una region | Lenguaje.activo |

## Requerimientos no funcionales

| ID | Requerimiento | Driver | Como se verifica |
| --- | --- | --- | --- |
| RNF-001 | "Tiempo real" significa traduccion **por turno**: cada mensaje de texto se traduce en 3 segundos o menos (p95); uno de voz en 5 segundos o menos. | DRV-01 | `npm run medir` en `backend/` y el evento `traduccion` (duracion_ms) del log |
| RNF-002 | El 80 % de los modismos del glosario de prueba se traducen con su equivalente cultural. | DRV-02 | `npm run medir` |
| RNF-003 | Los datos personales (correo, fecha de nacimiento, mensajes) se tratan segun `matriz_sensibilidad_datos.md`: mensajes cifrados en reposo, acceso solo del dueno, logs sin datos personales, consentimiento y eliminacion de cuenta. | DRV-03 | Pruebas de `backend/test/api.test.js` y `seguridad.test.js` |
| RNF-004 | Se agregan idiomas y regiones sin cambiar codigo. | DRV-04 | Prueba del administrador |
| RNF-005 | Si el motor de IA falla, el servicio sigue con un motor de reglas reducido. | DRV-05 | `backend/test/motores.test.js` |
| RNF-006 | Limites de uso: 30 mensajes por minuto por usuario, 8 intentos de login fallidos, 5 solicitudes de recuperacion cada 15 minutos. | DRV-06 | Pruebas de seguridad |
| RNF-007 | Una sola base de codigo para iOS, Android y web. | DRV-07 | Compilacion web y Expo Go |
| RNF-008 | Cobertura de pruebas de 80 % o mas en la logica de negocio. | DRV-08 | `npm run coverage` en `backend/` |
| RNF-009 | La API sigue `convenciones/api-rest.md` y esta documentada en OpenAPI. | - | `backend/openapi.yaml` y `/api/v1/docs` |

## Fuera del alcance del MVP (decision registrada)

- Compartir o exportar conversaciones, editar los datos del perfil y personalizar la voz: no tienen regla en el modelo de dominio; quedan para una version futura.
- Detectar el acento por el audio: hoy la region de origen se reconoce por el vocabulario (ver `contexto.md`).
- Reentrenar el modelo de IA con los reportes: los reportes se guardan y se revisan; el reentrenamiento es evolucion futura.
