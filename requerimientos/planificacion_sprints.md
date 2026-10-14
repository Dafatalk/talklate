# Planificacion por sprints - TalkLate

Metodologia pedida por el mentor (2026-10): priorizar las historias por **valor** (no por dependencia), tallarlas con tallas de ropa, asignarles horas y llenar sprints de duracion fija.

## Supuestos

- Sprint de 5 dias. 2 personas por 4 horas al dia = 40 horas brutas por sprint.
- Se usa el 75 % (30 horas): el resto es planeacion, dailies, refinamiento y retrospectiva.
- Talla a horas: XS = 1, S = 2, M = 4, L = 6, XL = 8, XXL = 12.
- Se llena cada sprint de mayor a menor valor hasta cerca de 30 horas y se acomoda una historia pequena de mas abajo si sobra espacio.

## Historias por prioridad

| Prioridad | Historia | Epica | Talla | Horas | Sprint | Por que genera valor |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | HU0003 Traducir mi mensaje al idioma destino en tiempo real | Traduccion de mensajes | XXL | 12 | 1 | Es el corazon del producto: sin esto TalkLate no entrega su valor diferencial. |
| 2 | HU0002 Ingresar mi mensaje escribiendo | Traduccion de mensajes | S | 2 | 1 | Es la entrada mas simple y la que permite usar la traduccion desde el primer dia. |
| 3 | HU0001 Ingresar mi mensaje hablando | Traduccion de mensajes | L | 6 | 1 | Es la forma natural de usar el producto: hablar y ser entendido sin escribir. |
| 4 | HU0004 Escuchar el mensaje traducido | Traduccion de mensajes | M | 4 | 1 | Permite que la otra persona reciba el mensaje de forma comoda y natural. |
| 5 | HU0005 Recibir la traduccion por el mismo canal que use | Traduccion de mensajes | S | 2 | 1 | Mantiene la experiencia coherente: si hablo, escucho; si escribo, leo. |
| 6 | HU0006 Seleccionar el idioma y la region destino | Gestion de conversaciones | M | 4 | 1 | Define a que persona y lugar se adapta el mensaje: de ahi sale el matiz cultural. |
| 7 | HU0007 Reconocer el idioma origen | Gestion de conversaciones | L | 6 | 2 | Evita configurar a mano el idioma cada vez y acelera la conversacion. |
| 8 | HU0008 Crear una conversacion | Gestion de conversaciones | S | 2 | 2 | Agrupa los mensajes de una misma charla para no perder el contexto. |
| 9 | HU0009 Configurar los parametros una sola vez | Gestion de conversaciones | S | 2 | 2 | Ahorra repetir la configuracion en cada mensaje. |
| 10 | HU0010 Mantener el hilo continuo | Gestion de conversaciones | M | 4 | 2 | Hace posible un dialogo fluido, que es lo que busca el usuario. |
| 11 | HU0019 Recibir el mensaje traducido | Participacion del interlocutor | S | 2 | 2 | Hace que la otra persona participe sin instalar ni operar la app. |
| 12 | HU0020 Responder en mi idioma | Participacion del interlocutor | M | 4 | 2 | Cierra el dialogo en ambos sentidos. |
| 13 | HU0023 Consultar los idiomas disponibles | Administracion de idiomas y regiones | XS | 1 | 2 | Muestra con que idiomas se puede hablar antes de empezar. |
| 14 | HU0011 Consultar mi historial | Gestion de conversaciones | M | 4 | 2 | Permite repasar y aprender de conversaciones pasadas. |
| 15 | HU0012 Abrir una conversacion anterior | Gestion de conversaciones | S | 2 | 2 | Permite retomar una conversacion donde se dejo. |
| 16 | HU0015 Registrarme en la aplicacion | Cuenta de usuario | L | 6 | 3 | Guarda las conversaciones del usuario y protege sus datos; el valor central no depende de esto. |
| 17 | HU0016 Iniciar sesion | Cuenta de usuario | M | 4 | 3 | Da acceso seguro a lo guardado. |
| 18 | HU0021 Reportar una mala traduccion | Reportes | M | 4 | 3 | Alimenta la mejora de calidad con casos reales. |
| 19 | HU0013 Renombrar una conversacion | Gestion de conversaciones | XS | 1 | 2 | Ayuda a ubicar conversaciones, pero no cambia el valor central. |
| 20 | HU0014 Eliminar una conversacion | Gestion de conversaciones | S | 2 | 3 | Da control sobre los datos propios; es de apoyo. |
| 21 | HU0017 Recuperar mi contrasena | Cuenta de usuario | L | 6 | 3 | Evita perder la cuenta; es de apoyo. |
| 22 | HU0018 Cerrar sesion | Cuenta de usuario | XS | 1 | 2 | Protege la cuenta en un dispositivo compartido; es de apoyo. |
| 23 | HU0022 Revisar los reportes de mala traduccion | Reportes | M | 4 | 3 | Permite priorizar que mejorar primero. |
| 24 | HU0024 Agregar un idioma o una region | Administracion de idiomas y regiones | M | 4 | 3 | Hace crecer el servicio a mas personas. |
| 25 | HU0025 Activar o desactivar un idioma o una region | Administracion de idiomas y regiones | XS | 1 | 2 | Controla que idiomas se ofrecen con calidad suficiente. |

## Sprints

| Sprint | Horas | Historias |
| --- | --- | --- |
| 1 | 30 | HU0001, HU0002, HU0003, HU0004, HU0005, HU0006 |
| 2 | 30 | HU0007, HU0008, HU0009, HU0010, HU0011, HU0012, HU0013, HU0018, HU0019, HU0020, HU0023, HU0025 |
| 3 | 30 | HU0014, HU0015, HU0016, HU0017, HU0021, HU0022, HU0024 |

Total: 90 horas en 3 sprints (3 semanas).

## Para la sustentacion

- Por que se priorizo traducir primero: porque es el valor del producto, no porque lo demas dependa de eso. Registro de usuario y cierre de sesion son de apoyo y van al final.
- Esta estimacion es metodologica: el plan de liberaciones se arma con estos sprints. Las horas reales de cada semana pueden variar.
- El codigo ya existe en `backend/` y `frontend/`; el plan sirve para ordenar lo que falta pulir y probar.