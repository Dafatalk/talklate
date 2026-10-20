# Seguimiento TalkLate - reunion con el mentor

**Fecha:** 15 de octubre de 2026 (confirmar la fecha exacta).
**Participantes:** Wider Farid Sanchez Garzon (mentor), Julian David Diaz Medina, Diego Alejandro Franco Atehortua.
**Fuente:** transcripcion de la reunion (generada por computador; puede tener errores). Este resumen la destila.

## Planificacion: duracion de los sprints
- Los jurados no van a preguntar por que una historia es compleja, sino por que se planeo tan poco tiempo. Tres semanas de construccion no son creibles para un trabajo de grado.
- Referencia para un trabajo de grado de unos 6 meses: cerca de 1 mes de analisis y diseno, 3 a 3,5 meses de construccion y 1 mes de cierre (manual de usuario y todo lo que hay que entregar).
- En vez de sprints de 30 horas, usar sprints de un mes de unas 120 horas (o dividir en mas sprints, por ejemplo cinco).
- Es facil justificar un primer sprint largo con pocas historias: es el sprint en que el equipo se conoce y define como trabajar, y en el que se hace completa la base que usan las demas historias, para no rehacer trabajo. Hay que mantener coherencia con lo que se dice.
- Las historias se siguen ordenando por valor, de mayor a menor, sin importar si una depende de otra.

## Sustentacion
- Los jurados buscan probar al estudiante como ingeniero en el mundo real: hay que mostrar que se siguio un enfoque sistematico y metodologico para construir el producto.
- Las preguntas de planificacion son metodologicas; no se responden por el lado tecnico ("llegue con un backend"). Se responde con el valor: primero traducir el mensaje y despues las conversaciones, porque asi se genera el valor.
- Si preguntan por que una historia tomo tanto tiempo: se hizo asi para no rehacer trabajo y dejar una buena base para lo demas.

## Codigo y arquitectura
- Revisar seguridad, estructura en capas, separacion de responsabilidades, trazabilidad y manejo de secretos, y justificar cada decision con un ADR.
- Primero terminar el desarrollo; despues el diseno y la documentacion definitiva, para hacer cada cosa una sola vez y no perder tiempo.

## Uso de IA
- Se puede decir que el equipo se apoyo en IA, pero que el producto tiene mucho analisis propio y que todo paso por revision humana. Hay que ser muy cuidadosos con esa revision.
- Mejor no mencionar en la sustentacion que la IA genero el arquetipo o el andamiaje (scaffolding) inicial.
- Existen herramientas que miden que tan "humano" es un texto; tenerlo en cuenta en la redaccion del documento.
- El equipo explico su framework de trabajo: un servidor MCP en Python que organiza el desarrollo por fases y no deja avanzar sin cumplir los criterios minimos de la fase anterior; las decisiones las toma el equipo. El mentor sugirio enriquecerlo con MCP especializados, por ejemplo uno de analisis y otro de diseno.
- El mentor volvio a recomendar Archify para los diagramas.

## Tareas acordadas
1. Rehacer la planificacion: sprints de un mes, historias por valor de mayor a menor sin mirar dependencias, y el cronograma de 6 meses (analisis y diseno, construccion y cierre).
2. Tener el stack tecnologico documentado, con las alternativas evaluadas.
3. Revisar el codigo en seguridad, capas, separacion de responsabilidades, trazabilidad y secretos, y documentarlo en ADR.
