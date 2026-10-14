# Seguimiento TalkLate - reunion presencial con el mentor

**Fecha:** semana del 14 de octubre de 2026 (confirmar la fecha exacta).
**Participantes:** Wider Farid Sanchez Garzon (mentor), Julian David Diaz Medina, Diego Alejandro Franco Atehortua.
**Fuente:** transcripcion de la reunion (generada por computador; puede tener errores). Este resumen la destila.

## Epicas del Mapa de Impacto
- Las epicas agrupan funcionalmente o por modulos como esta estructurado el sistema; no se escribe "Modulo de" en el nombre.
- Configuracion de idiomas origen-destino queda absorbida por la conversacion; la gestion de conversaciones incluye el historial.
- Administracion (catalogo) de idiomas y regiones se separa, a nivel de administrador.
- "Consultar idiomas disponibles" pertenece mas a idiomas, aunque se use desde la conversacion. Hay que asociar cada historia a la epica donde tiene mas peso.
- Un impacto se puede abrir en varios entregables y un entregable puede aparecer en varios impactos; la historia dice a que impacto aporta en su "Para".
- El Interlocutor si es actor: no opera la app, recibe el mensaje por el canal y responde.
- Los reportes son dinamicos: no hacen parte del modelo de dominio inicial (no tienen estructura fija).

## Priorizacion, tallas y sprints
- Priorizar las historias por **valor**, no por dependencia. Trampa de la sustentacion: "por que primero registrar usuario?". La respuesta esperada: el valor del producto esta en el traductor.
- Tallar con tallas de ropa (XS a XXL) y asignar horas por talla, para una persona.
- Sprint de duracion fija: una semana. 4 horas al dia por persona, 2 personas, 5 dias = 40 horas; se usa el 75 % = 30 horas.
- Llenar sprints de mayor a menor valor hasta cerca de 30 horas, acomodando una historia pequena de mas abajo si sobra espacio. Con eso sale el numero de sprints y luego el plan de liberaciones.

## Marco metodologico y sustentacion
- Debe haber coherencia entre los artefactos entregados y lo descrito en el Marco metodologico; si no, los jurados preguntan por ahi.
- Cuidado con el uso de IA en el documento de grado: se puede usar como apoyo, pero se revisa con herramientas de deteccion.
- La sustentacion dura maximo media hora (normalmente 15 minutos); los jurados revisan los artefactos antes.

## Arquitectura
- Se puede **empezar a construir** (definir el stack y desarrollar) y despues justificar con ADR y drivers. Las alternativas deben ser reales: "muestreme cuales evaluaron".
- Un driver ejemplo: traducir un mensaje en un tiempo maximo; el ADR explica como se garantiza.
- El mentor recomendo una herramienta de apoyo para documentacion (skill Archify, para diagramas).

## Tareas acordadas
1. Priorizar por valor, tallar, asignar horas y sprints, y armar el plan de liberaciones.
2. Definir el stack y empezar a desarrollar; documentar ADR y drivers.
3. Cargar datos de prueba.
