# 14. Planificacion de sprints - TalkLate

**Version:** 1.0 (29/10/2026)

Metodologia: priorizar las historias por **valor** (no por dependencia), tallarlas con tallas de ropa, asignarles horas y llenar sprints de duracion fija.

## Supuestos

- El trabajo de grado dura unos 6 meses: 1 mes de analisis y diseno, 3 meses de construccion y 1 mes de cierre (ver el cronograma abajo).
- Sprint de **un mes** (4 semanas, 20 dias habiles). 2 personas por 4 horas al dia = 160 horas brutas por sprint.
- Se usa el 75 % (**120 horas**): el resto es planeacion, dailies, refinamiento, retrospectiva e imprevistos (por ejemplo, festivos).
- Talla a horas (una persona desarrolla la historia, incluyendo analisis, desarrollo, pruebas, revision y documentacion): XS = 4, S = 8, M = 16, L = 24, XL = 32, XXL = 48.
- Se llena cada sprint de mayor a menor valor hasta cerca de 120 horas y, si sobra espacio, se acomoda una historia pequena de mas abajo. **No se planifica por dependencia**: por eso Cerrar sesion (prioridad 22) entra en el sprint 2 aunque Iniciar sesion llegue en el sprint 3.

## Historias por prioridad

| Prioridad | Historia | Epica | Talla | Horas | Sprint | Por que genera valor |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | HU0003 Traducir mi mensaje al idioma destino en tiempo real | Traduccion de mensajes | XXL | 48 | 1 | Es el corazon del producto: sin esto TalkLate no entrega su valor diferencial. |
| 2 | HU0002 Ingresar mi mensaje escribiendo | Traduccion de mensajes | S | 8 | 1 | Es la entrada mas simple y la que permite usar la traduccion desde el primer dia. |
| 3 | HU0001 Ingresar mi mensaje hablando | Traduccion de mensajes | L | 24 | 1 | Es la forma natural de usar el producto: hablar y ser entendido sin escribir. |
| 4 | HU0004 Escuchar el mensaje traducido | Traduccion de mensajes | M | 16 | 1 | Permite que la otra persona reciba el mensaje de forma comoda y natural. |
| 5 | HU0005 Recibir la traduccion por el mismo canal que use | Traduccion de mensajes | S | 8 | 1 | Mantiene la experiencia coherente: si hablo, escucho; si escribo, leo. |
| 6 | HU0006 Seleccionar el idioma y la region destino | Gestion de conversaciones | M | 16 | 1 | Define a que persona y lugar se adapta el mensaje: de ahi sale el matiz cultural. |
| 7 | HU0007 Reconocer el idioma origen | Gestion de conversaciones | L | 24 | 2 | Evita configurar a mano el idioma cada vez y acelera la conversacion. |
| 8 | HU0008 Crear una conversacion | Gestion de conversaciones | S | 8 | 2 | Agrupa los mensajes de una misma charla para no perder el contexto. |
| 9 | HU0009 Configurar los parametros una sola vez | Gestion de conversaciones | S | 8 | 2 | Ahorra repetir la configuracion en cada mensaje. |
| 10 | HU0010 Mantener el hilo continuo | Gestion de conversaciones | M | 16 | 2 | Hace posible un dialogo fluido, que es lo que busca el usuario. |
| 11 | HU0019 Recibir el mensaje traducido | Participacion del interlocutor | S | 8 | 2 | Hace que la otra persona participe sin instalar ni operar la app. |
| 12 | HU0020 Responder en mi idioma | Participacion del interlocutor | M | 16 | 2 | Cierra el dialogo en ambos sentidos. |
| 13 | HU0023 Consultar los idiomas disponibles | Administracion de idiomas y regiones | XS | 4 | 2 | Muestra con que idiomas se puede hablar antes de empezar. |
| 14 | HU0011 Consultar mi historial | Gestion de conversaciones | M | 16 | 2 | Permite repasar y aprender de conversaciones pasadas. |
| 15 | HU0012 Abrir una conversacion anterior | Gestion de conversaciones | S | 8 | 2 | Permite retomar una conversacion donde se dejo. |
| 16 | HU0015 Registrarme en la aplicacion | Cuenta de usuario | L | 24 | 3 | Guarda las conversaciones del usuario y protege sus datos; el valor central no depende de esto. |
| 17 | HU0016 Iniciar sesion | Cuenta de usuario | M | 16 | 3 | Da acceso seguro a lo guardado. |
| 18 | HU0021 Reportar una mala traduccion | Reportes | M | 16 | 3 | Alimenta la mejora de calidad con casos reales. |
| 19 | HU0013 Renombrar una conversacion | Gestion de conversaciones | XS | 4 | 2 | Ayuda a ubicar conversaciones, pero no cambia el valor central. |
| 20 | HU0014 Eliminar una conversacion | Gestion de conversaciones | XS | 4 | 2 | Da control sobre los datos propios; es de apoyo. |
| 21 | HU0017 Recuperar mi contrasena | Cuenta de usuario | L | 24 | 3 | Evita perder la cuenta; es de apoyo. |
| 22 | HU0018 Cerrar sesion | Cuenta de usuario | XS | 4 | 2 | Protege la cuenta en un dispositivo compartido; es de apoyo. Por valor cabe en el sprint 2. |
| 23 | HU0022 Revisar los reportes de mala traduccion | Reportes | M | 16 | 3 | Permite priorizar que mejorar primero. |
| 24 | HU0024 Agregar un idioma o una region | Administracion de idiomas y regiones | M | 16 | 3 | Hace crecer el servicio a mas personas. |
| 25 | HU0025 Activar o desactivar un idioma o una region | Administracion de idiomas y regiones | XS | 4 | 3 | Controla que idiomas se ofrecen con calidad suficiente. |
| 26 | HU0026 Eliminar mi cuenta | Cuenta de usuario | XS | 4 | 3 | Cumple el derecho al olvido (Ley 1581 de 2012): la persona controla sus datos. |

## Sprints

| Sprint | Fechas | Horas | Historias |
| --- | --- | --- | --- |
| 1 | 19 de octubre al 13 de noviembre de 2026 | 120 | HU0003, HU0002, HU0001, HU0004, HU0005, HU0006 |
| 2 | 16 de noviembre al 11 de diciembre de 2026 | 120 | HU0007, HU0008, HU0009, HU0010, HU0019, HU0020, HU0023, HU0011, HU0012, HU0013, HU0014, HU0018 |
| 3 | 14 de diciembre de 2026 al 8 de enero de 2027 | 120 | HU0015, HU0016, HU0021, HU0017, HU0022, HU0024, HU0025, HU0026 |

Total: 360 horas en 3 sprints (3 meses de construccion).

Como se llena el sprint 2: con las prioridades 7 a 15 llega a 108 horas. Las siguientes (HU0015 de 24 h, HU0016 y HU0021 de 16 h) no caben en las 12 horas que quedan, asi que entran las siguientes que si caben: HU0013, HU0014 y HU0018 (4 h cada una).

## Por que el sprint 1 tiene pocas historias

El sprint 1 lleva la historia de mayor valor y mas grande: traducir el mensaje (XXL, 48 h). Ademas de la historia, en ese sprint se deja lista la base que usan todas las demas (arquitectura en capas, seguridad, conexion a la base de datos, integracion continua). Hacerlo completo desde el inicio evita rehacer trabajo en los sprints siguientes. Tambien es el sprint en el que el equipo ajusta su forma de trabajar (issues, ramas, revisiones).

## Cronograma del trabajo de grado

| Etapa | Fechas | Entregable | Estado |
| --- | --- | --- | --- |
| Analisis y diseno | agosto a octubre de 2026 | Vision, modelo de dominio, mapa de impacto, historias, requerimientos y arquitectura (fases F0 a F5) | Terminado |
| Construccion: sprint 1 | 19/10/2026 al 13/11/2026 | Liberacion 1: traduccion funcional | En curso |
| Construccion: sprint 2 | 16/11/2026 al 11/12/2026 | Liberacion 2: conversaciones completas | Planeado |
| Construccion: sprint 3 | 14/12/2026 al 08/01/2027 | Liberacion 3: cuentas, calidad y administracion | Planeado |
| Cierre | 11/01/2027 al 05/02/2027 | Pruebas con usuarios, manual de usuario, documento final y preparacion de la sustentacion | Planeado |

## Relacion con la prueba de concepto del 14/10/2026

Antes del sprint 1 se hizo una **prueba de concepto (spike)**: una version funcional de la app para validar el stack y el motor de traduccion antes de comprometer la arquitectura. Los sprints toman cada historia desde ese punto: revisar y completar el codigo, probarlo en celular, cumplir sus criterios de aceptacion, sus pruebas y la documentacion. Cada historia se trabaja con su issue de GitHub, su rama y su pull request.

## Criterios de la planificacion

- Por que traducir va primero: porque es el valor del producto, no porque lo demas dependa de eso. Registro y cierre de sesion son de apoyo.
- Por que cerrar sesion va antes que iniciar sesion: el orden es por valor y no por dependencia; en la practica la base de autenticacion ya existe desde el sprint 1.
- Por que el sprint 1 tiene pocas historias: lleva la base completa que usan las demas, para no rehacer trabajo.
- La estimacion es metodologica (valor, tallas, capacidad y sprints): el plan de liberaciones sale de estos sprints; las horas reales de cada mes pueden variar.