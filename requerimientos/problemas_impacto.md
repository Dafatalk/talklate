# Problemas por Impacto - TalkLate

**Fase 2 - Especificacion de Requerimientos**

**Estado:** BORRADOR para validar con el equipo y el profesor (Farid).

## Que pidio el profesor

Para cada impacto del Mapa de Impacto se escribe **el problema que existe si ese impacto NO se
logra** (ej.: "si no se traduce en tiempo real, no puedo sostener una conversacion con alguien
cuyo idioma no conozco"). Ese problema va muy ligado al "para" de la historia de usuario: el
"para" es el beneficio, y el problema es lo que pasa cuando falta. Se aplica lo mismo a todos los
impactos.

> Aclaracion: el primer intento (columnas "Problema al implementarla" en el Excel y
> `historias_usuario.md`) hablaba de riesgos tecnicos al construir la funcion. Eso NO es lo que
> pidio el profesor, por eso se retiro del Excel. Aquel archivo queda solo como lista de riesgos
> tecnicos para F3.

## Estado de avance

| Fila del Mapa de Impacto | Entregable | Problema / Beneficio |
| --- | --- | --- |
| 4 | Traductor de mensajes | LISTO (lo escribio Julian, commit `bd4d9b7`, en `Mapa de Impacto.xlsx`) |
| 5 a 12 | Los otros 8 entregables | PENDIENTE en el Excel; abajo hay una propuesta para copiar |

Julian agrego las columnas **Problema** y **Beneficio** en la hoja "Mapa de Impacto", pero solo
lleno la fila 4. Las filas 5 a 12 estan vacias.

## Fila 4 (ya hecha por Julian, de referencia)

- **Problema:** si no se traduce un mensaje en tiempo real, no se puede sostener una conversacion con otra persona cuando no se conoce el idioma destino.
- **Beneficio:** tener una conversacion fluida con una persona que habla otro idioma.

## Propuesta para las filas 5 a 12 (para pegar en el Excel)

| Fila | Entregable | Problema (si el impacto NO se logra) | Beneficio |
| --- | --- | --- | --- |
| 5 | Configuracion de idiomas origen-destino | Si hay que repetir la configuracion de idioma en cada mensaje, la persona pierde tiempo, se frustra y la conversacion deja de sentirse inmediata. | Empezar a comunicarse de inmediato, configurando el idioma una sola vez. |
| 6 | Gestion de conversaciones | Si cada mensaje obliga a reconfigurar idiomas y parametros, la conversacion se corta y no se siente natural. | Conversar de forma fluida y continua dentro de un mismo hilo. |
| 7 | Historial y gestion de conversaciones traducidas | Si las conversaciones pasadas se pierden, la persona no puede volver a ellas, repite los mismos errores y aprende mas lento el otro idioma. | Aprender y ganar confianza en el otro idioma apoyandose en conversaciones pasadas. |
| 8 | Gestion de perfil de usuario | Si no hay un perfil seguro, cualquiera podria ver las conversaciones guardadas de otra persona, o el usuario perderia su cuenta y su historial al olvidar la contrasena. | Tener un historial propio, ordenado y protegido. (Ojo: en la columna DUDAS ya se dudo si este impacto realmente describe el perfil.) |
| 9 | Reproduccion y personalizacion de audio traducido | Si el mensaje traducido solo se lee o suena robotico, la conversacion se siente artificial y la otra persona no entiende bien la intencion. | Sostener una conversacion natural, hablando y escuchando como en el propio idioma. |
| 10 | Reporte de mala traduccion | Si el usuario no puede avisar de los errores, la traduccion mala se repite y la confianza en TalkLate baja. | Contribuir a que la calidad del servicio mejore con el tiempo. |
| 11 | Participacion en la conversacion traducida (Interlocutor) | Si el interlocutor debe instalar o aprender la app para entender y responder, la conversacion no arranca o queda en desigualdad. | Participar en su propio idioma y en igualdad de condiciones, sin operar la app. |
| 12 | Gestion del catalogo de idiomas y regiones (Administrador) | Si no se pueden agregar ni ajustar idiomas, regiones y acentos, el servicio queda limitado a lo inicial y deja de servir a mas personas. | Ampliar el alcance del servicio con calidad confiable. |

## Pendientes

1. Que Julian (o el equipo) pegue las filas 5 a 12 en las columnas Problema y Beneficio del Excel, ajustando el texto.
2. Validar con el profesor que el problema esta bien redactado (que se lea como "lo que pasa si no existe", ligado al "para").
3. Fila 8 (perfil): decidir si el impacto se redefine, porque ya estaba en DUDAS.
4. Fila 13 (Revision de reportes de calidad): el impacto del Administrador sobre reportes no aparece en el Excel de Julian; confirmar si se elimino a proposito.
5. Aun no se agregan las columnas "Yo como usuario quiero" al Excel nuevo (se perdieron al tomar la version de Julian); definir con el equipo donde van.
