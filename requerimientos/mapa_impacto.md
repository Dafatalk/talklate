# Mapa de Impacto - TalkLate

**Fase 2 - Especificacion de Requerimientos**

**Fuente de verdad:** `seguimiento/mapa_impacto/Mapa de Impacto.xlsx`. Este documento es una copia legible; si cambian, manda el Excel.
**Metodologia:** Impact Mapping (Gojko Adzic), guiada por el mentor Wider Farid Sanchez Garzon: Why (objetivo) -> Who (actores, en terminos positivos) -> How (impacto SMART: el beneficio que obtiene el actor) -> What (entregable = epica, que agrupa modulos del sistema y se abre en historias de usuario).

## Why - Objetivo

Objetivo (SMART): al cierre de la liberacion 3 (06/11/2026), al menos 10 personas de prueba sostienen cada una una conversacion de 10 mensajes o mas con alguien que habla otro idioma (espanol-ingles), con menos del 20 % de traducciones reportadas como malas y un tiempo por traduccion de 3 segundos o menos (p95). Vision: ver contexto.md.

## Actores

- **Cliente Traductor:** dueno del dispositivo; usa la app para comunicarse en un idioma que no domina.
- **Interlocutor:** la otra persona de la conversacion; no instala la app ni crea cuenta, responde con el celular del Cliente Traductor.
- **Administrador:** mantiene el catalogo de idiomas y regiones y revisa la calidad de las traducciones.

> La Inteligencia Artificial ya no se modela como actor: no es una persona que obtenga un beneficio, es parte del sistema (el motor de traduccion, ver `arquitectura/decisiones.md`, ADR-004).

## Who / How / What

| # | Actor | Impacto (How) | Problema si no se logra | Beneficio | Entregable (epica) | Indicador SMART |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Cliente Traductor | Traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para interactuar facil y rapidamente con personas que hablan otro idioma conservando el contexto cultural, el tono y los modismos. | Si no se traduce un mensaje en tiempo real no se puede sostener una converacion con otra persona cuando no se conoce el idioma destino | Tener una converacion fluida con una persona que habla otro idioma | Traduccion de mensajes | Liberacion 1 (23/10/2026): el 80 % de los modismos del glosario de prueba se traducen con su equivalente cultural y en 3 segundos o menos (p95). Se mide con npm run medir. |
| 2 | Cliente Traductor | Empezar a conversar en menos de un minuto, configurando idioma y region destino una sola vez y sin tener que indicar el idioma propio. | Si el usuario tiene que configurar todo y decir su idioma antes de hablar, pierde tiempo y la conversacion no arranca de inmediato. | Empezar a hablar de una vez. | Gestion de conversaciones / Administracion de idiomas y regiones | Liberaciones 1 y 2: en la prueba con usuarios, una persona nueva crea la conversacion y envia su primer mensaje en menos de 1 minuto; el idioma de origen se reconoce bien en el 90 % de los primeros mensajes. |
| 3 | Cliente Traductor | Mantener el contexto de toda la charla, para que cada respuesta se traduzca dentro del mismo hilo sin reconfigurar nada. | Si la conversacion no guarda la configuracion ni el hilo, cada mensaje queda suelto y se pierde el contexto de lo que se ha dicho. | Conversar de corrido, con todo el hilo en un solo lugar. | Gestion de conversaciones | Liberacion 2 (30/10/2026): en la prueba con usuarios hay conversaciones de 10 mensajes o mas sin reconfigurar idiomas. |
| 4 | Cliente Traductor | Aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas. | Si las conversaciones no se guardan, al cerrar la app se pierde lo que se dijo y el usuario no puede repasar las frases ni aprender de ellas. | Volver a conversaciones pasadas para repasar y ganar confianza en el otro idioma. | Gestion de conversaciones | Liberacion 2: el 100 % de las conversaciones quedan en el historial y se pueden reabrir; en la encuesta final, 7 de cada 10 personas dicen que repasarlas les ayudo. |
| 5 | Cliente Traductor | Acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas. | Si no hay una cuenta, las conversaciones no quedan ligadas a nadie: cualquiera con el celular las podria ver y, si el usuario cambia de celular, las pierde. | Tener las conversaciones guardadas y que sean solo del usuario. | Cuenta de usuario | Liberacion 3 (06/11/2026): 0 accesos de una persona a conversaciones de otra en las pruebas de seguridad; la persona puede eliminar su cuenta con todos sus datos. |
| 6 | Cliente Traductor | Sostener una conversacion natural, hablando y escuchando como lo haria en su propio idioma. | Si la traduccion solo sale en texto o con una voz que suena robotica, la otra persona no entiende bien lo que el usuario quiso decir y todo se siente forzado. | Hablar y escuchar de forma natural, como en el propio idioma. | Traduccion de mensajes | Liberacion 1: el 100 % de los mensajes enviados por voz se escuchan traducidos; 7 de cada 10 personas de prueba califican la voz como comprensible. |
| 7 | Cliente Traductor | Contribuir a mejorar la calidad del servicio senalando las traducciones que no fueron correctas o naturales. | Si el usuario no puede avisar cuando una traduccion sale mal, el error se queda y se repite, y termina desconfiando de la app. | Ayudar a que las traducciones mejoren con el uso. | Reportes | Liberacion 3: cualquier traduccion se reporta en 2 toques o menos y el reporte llega al administrador. |
| 8 | Interlocutor | Participar en la conversacion en su propio idioma y en igualdad de condiciones, sin instalar la aplicacion ni crear una cuenta. | Si la otra persona tiene que instalar la app o crear una cuenta para contestar, la conversacion no arranca o ella queda en desventaja. | Que la otra persona hable en su idioma con el celular del usuario, sin cuenta. | Participacion del interlocutor | Liberacion 2: en la prueba con usuarios, la otra persona responde en su idioma con el celular del usuario, sin cuenta, en el 100 % de los casos. |
| 9 | Administrador | Ampliar la oferta de idiomas y regiones con calidad confiable, activando solo los que ya traducen bien. | Si no se pueden agregar ni ajustar idiomas y regiones, la app se queda con lo que trajo al inicio y no le sirve a mas gente. | Poder crecer a mas idiomas y regiones. | Administracion de idiomas y regiones | Liberacion 3: un idioma o region se agrega y activa sin cambiar codigo; solo se activan idiomas que pasan el glosario de prueba con 80 % o mas. |
| 10 | Administrador | Revisar los reportes de mala traduccion que envian los clientes, para decidir que mejoras priorizar en el servicio. | Si nadie revisa los reportes de mala traduccion, los errores no se corrigen y no se sabe que mejorar primero. | Mejorar primero lo que mas afecta a los usuarios. | Reportes | Liberacion 3: el 100 % de los reportes abiertos se revisan (revisado o descartado) en menos de una semana. |

> Un impacto puede abrirse en varios entregables y un entregable puede aparecer en varios impactos (Farid). Cada historia de usuario dice a que impacto aporta en su "Para".

## Epicas e historias de usuario

Detalle completo (prioridad, talla, sprint y criterios de aceptacion) en `historias_usuario_HU.md` y `criterios_aceptacion.md`.

### Traduccion de mensajes

- **HU0001** - Como Cliente Traductor, necesito poder ingresar mi mensaje hablando, para traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para interactuar facil y rapidamente con personas que hablan otro idioma conservando el contexto cultural, el tono y los modismos.
- **HU0002** - Como Cliente Traductor, necesito poder ingresar mi mensaje escribiendo, para traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para interactuar facil y rapidamente con personas que hablan otro idioma conservando el contexto cultural, el tono y los modismos.
- **HU0003** - Como Cliente Traductor, necesito poder traducir mi mensaje al idioma destino en tiempo real, para traducir un mensaje de un idioma origen a un idioma destino en tiempo real, para interactuar facil y rapidamente con personas que hablan otro idioma conservando el contexto cultural, el tono y los modismos.
- **HU0004** - Como Cliente Traductor, necesito poder escuchar el mensaje traducido, para sostener una conversacion natural, hablando y escuchando como lo haria en su propio idioma.
- **HU0005** - Como Cliente Traductor, necesito poder recibir la traduccion por el mismo canal que use, para sostener una conversacion natural, hablando y escuchando como lo haria en su propio idioma.

### Gestion de conversaciones

- **HU0006** - Como Cliente Traductor, necesito poder seleccionar el idioma y la region destino, para empezar a conversar en menos de un minuto, configurando idioma y region destino una sola vez y sin tener que indicar el idioma propio.
- **HU0007** - Como Cliente Traductor, necesito poder reconocer el idioma origen, para empezar a conversar en menos de un minuto, configurando idioma y region destino una sola vez y sin tener que indicar el idioma propio.
- **HU0008** - Como Cliente Traductor, necesito poder crear una conversacion, para mantener el contexto de toda la charla, para que cada respuesta se traduzca dentro del mismo hilo sin reconfigurar nada.
- **HU0009** - Como Cliente Traductor, necesito poder configurar los parametros una sola vez, para mantener el contexto de toda la charla, para que cada respuesta se traduzca dentro del mismo hilo sin reconfigurar nada.
- **HU0010** - Como Cliente Traductor, necesito poder mantener el hilo continuo, para mantener el contexto de toda la charla, para que cada respuesta se traduzca dentro del mismo hilo sin reconfigurar nada.
- **HU0011** - Como Cliente Traductor, necesito poder consultar mi historial, para aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas.
- **HU0012** - Como Cliente Traductor, necesito poder abrir una conversacion anterior, para aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas.
- **HU0013** - Como Cliente Traductor, necesito poder renombrar una conversacion, para aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas.
- **HU0014** - Como Cliente Traductor, necesito poder eliminar una conversacion, para aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas.

### Cuenta de usuario

- **HU0015** - Como Cliente Traductor, necesito poder registrarme en la aplicacion, para acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas.
- **HU0016** - Como Cliente Traductor, necesito poder iniciar sesion, para acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas.
- **HU0017** - Como Cliente Traductor, necesito poder recuperar mi contrasena, para acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas.
- **HU0018** - Como Cliente Traductor, necesito poder cerrar sesion, para acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas.
- **HU0026** - Como Cliente Traductor, necesito poder eliminar mi cuenta, para acceder a la cuenta de forma segura, para que las conversaciones y la configuracion queden guardadas y solo el usuario pueda verlas.

### Participacion del interlocutor

- **HU0019** - Como Interlocutor, necesito poder recibir el mensaje traducido, para participar en la conversacion en su propio idioma y en igualdad de condiciones, sin instalar la aplicacion ni crear una cuenta.
- **HU0020** - Como Interlocutor, necesito poder responder en mi idioma, para participar en la conversacion en su propio idioma y en igualdad de condiciones, sin instalar la aplicacion ni crear una cuenta.

### Reportes

- **HU0021** - Como Cliente Traductor, necesito poder reportar una mala traduccion, para contribuir a mejorar la calidad del servicio senalando las traducciones que no fueron correctas o naturales.
- **HU0022** - Como Administrador, necesito poder revisar los reportes de mala traduccion, para revisar los reportes de mala traduccion que envian los clientes, para decidir que mejoras priorizar en el servicio.

### Administracion de idiomas y regiones

- **HU0023** - Como Cliente Traductor, necesito poder consultar los idiomas disponibles, para empezar a conversar en menos de un minuto, configurando idioma y region destino una sola vez y sin tener que indicar el idioma propio.
- **HU0024** - Como Administrador, necesito poder agregar un idioma o una region, para ampliar la oferta de idiomas y regiones con calidad confiable, activando solo los que ya traducen bien.
- **HU0025** - Como Administrador, necesito poder activar o desactivar un idioma o una region, para ampliar la oferta de idiomas y regiones con calidad confiable, activando solo los que ya traducen bien.
