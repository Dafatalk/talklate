# Historias de Usuario con Problemas por Funcionalidad - TalkLate

**Fase 2 - Especificacion de Requerimientos**

**Estado:** borrador para revision del profesor/mentor.
**Fuente:** `mapa_impacto.md` (entregables, caracteristicas, historias Como/Necesito/Para),
`req.md` (REQ-*) y `arquitectura/modelo_datos.md` (reglas de negocio RN-*).

Pedido del profesor: (1) redactar las historias en el formato **"Yo como usuario quiero ... para
..."** y (2) por cada funcionalidad escribir **el problema (reto o riesgo) que traera
implementarla**. Las historias son las mismas del mapa de impacto, solo reescritas en este
formato. No se inventan funcionalidades nuevas: lo que sigue como pregunta abierta queda marcado
con la palabra PENDIENTE.

Convencion: **HU** = historia de usuario. Cuando el actor es la IA, se escribe "Yo como
Inteligencia Artificial quiero ...", igual que en el Mapa de Impacto.

---

## 1. Traductor de mensajes

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-TRAD-01 | Yo como usuario quiero hablar mi mensaje por el microfono, para que se traduzca al idioma destino en tiempo real y comunicarme rapido con otra persona. | Ruido ambiente, acentos fuertes y permisos de microfono del telefono pueden hacer que la transcripcion falle. Ademas, "tiempo real" exige baja latencia (RNF-002 sin umbral definido). | Definir umbral de latencia en F3; mostrar estado "escuchando/procesando"; permitir reintentar. |
| HU-TRAD-02 | Yo como usuario quiero escribir mi mensaje, para que se traduzca al idioma destino cuando no pueda o no quiera hablar. | Texto con errores de ortografia, abreviaturas o mezcla de idiomas (spanglish) puede traducirse mal. | Normalizar el texto antes de traducir; avisar si se detectan idiomas mezclados. |
| HU-TRAD-03 | Yo como usuario quiero recibir la traduccion por el mismo canal que use (audio si hable, texto si escribi), para mantener una experiencia consistente. | Generar audio es mas lento y costoso que devolver texto; si falla la voz, hay que decidir si se cae a texto. | Entregar siempre texto como respaldo y audio cuando este listo. |

> Nota: "procesar mensaje" (transcribir audio) sigue siendo detalle interno, no historia (analogia
> del cajero automatico del mentor). PENDIENTE confirmar con el mentor.

## 2. Historial y gestion de conversaciones traducidas

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-HIST-01 | Yo como usuario quiero ver la lista de mis conversaciones anteriores, para consultar traducciones pasadas y usarlas como referencia o aprendizaje. | Con muchas conversaciones la lista se vuelve lenta y confusa; ademas guarda datos personales (PII), lo que obliga a cumplir `convenciones/seguridad.md`. | Paginacion, orden por fecha, cifrado de mensajes guardados. |
| HU-HIST-02 | Yo como usuario quiero abrir una conversacion anterior y ver sus mensajes originales y traducidos, para reutilizar su contenido. | Hay que guardar original y traducido de cada mensaje (mas almacenamiento) y decidir cuanto tiempo se conservan. | Definir politica de retencion de datos. |
| HU-HIST-03 | Yo como usuario quiero renombrar una conversacion, para identificarla facil en mi historial. | Validar el nombre (3-80 caracteres, sin caracteres especiales ni palabras ofensivas, Conversacion-RN-4) exige una lista de palabras ofensivas por idioma, dificil de mantener. | Lista configurable y mensajes de error claros. |
| HU-HIST-04 | Yo como usuario quiero eliminar una conversacion que ya no necesito, para mantener mi historial ordenado. | Borrar por error no tiene vuelta atras; ademas hay que borrar tambien los mensajes asociados sin dejar datos huerfanos. | Confirmacion antes de borrar; decidir entre borrado fisico o logico. |
| HU-HIST-05 | PENDIENTE: Yo como usuario quiero compartir o exportar una conversacion, para mostrarsela a otra persona. | El dominio no define mecanismo ni formato; compartir implica riesgos de privacidad. | Definir con el mentor si entra al MVP. |

## 3. Gestion de perfil de usuario

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-PERF-01 | Yo como usuario quiero registrarme con nombre, apellido, correo y fecha de nacimiento, para crear mi cuenta y tener mi identidad definida en la app. | Evitar cuentas duplicadas (Usuario-RN-1) y correos falsos; sin verificacion de correo cualquiera puede registrar un correo ajeno. | Verificacion de correo; indice unico sobre correo. |
| HU-PERF-02 | Yo como usuario quiero que el sistema valide que tengo al menos 13 anos, para cumplir la normativa de proteccion de menores. | La fecha de nacimiento la declara el propio usuario y puede mentir; ademas es un dato sensible. | Aviso legal claro; guardar solo lo necesario. |
| HU-PERF-03 | Yo como usuario quiero iniciar sesion con mi correo y contrasena, para acceder a mis conversaciones y configuraciones. | Ataques de fuerza bruta y robo de credenciales; manejo seguro de tokens y de contrasenas (hash). | Limite de intentos, hash con sal, tokens con expiracion. |
| HU-PERF-04 | Yo como usuario quiero pedir un codigo de recuperacion a mi correo, para no perder acceso si olvide mi contrasena. | Depende de un servicio de correo externo que puede fallar (Usuario-RN-7); el codigo puede ser interceptado. | Codigo de un solo uso con expiracion corta (15 min). |
| HU-PERF-05 | Yo como usuario quiero definir una nueva contrasena con el codigo recibido, para recuperar mi cuenta de forma segura. | Mismas reglas de contrasena fuerte (Usuario-RN-9) y manejar codigos expirados o repetidos. | Invalidar el codigo tras usarlo. |
| HU-PERF-06 | Yo como usuario quiero cerrar mi sesion, para proteger mi cuenta en un dispositivo compartido. | Si el token no se invalida en el servidor, la sesion sigue abierta aunque la app diga lo contrario. | Lista de tokens revocados o tokens de vida corta. |
| HU-PERF-07 | PENDIENTE: Yo como usuario quiero editar mis datos de perfil, para mantenerlos actualizados. | El dominio no tiene regla "Actualizar Usuario"; cambiar el correo exigiria re-verificarlo. | Definir regla de negocio antes de implementarla. |

## 4. Configuracion de idiomas origen-destino

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-IDIO-01 | Yo como usuario quiero elegir el idioma y la region destino, para que mi mensaje se adapte al lugar y la persona correctos. | La region debe ser valida para el idioma (Conversacion-RN-1); hay que mantener un catalogo consistente de idiomas y regiones. | Catalogo cerrado en el MVP (foco en ingles y espanol). |
| HU-IDIO-02 | Yo como usuario quiero que la app detecte sola mi idioma de origen desde mi primer mensaje de voz, para no configurarlo manualmente cada vez. | La deteccion puede equivocarse con mensajes cortos o con acentos; y una vez detectado no puede cambiar en la conversacion (Conversacion-RN-2). | Permitir corregir antes de confirmar el primer mensaje. |
| HU-IDIO-03 | Yo como usuario quiero ver la lista de idiomas y regiones soportados, para saber que combinaciones puedo usar antes de empezar. | Hay pares no soportados (Conversacion-RN-3) y la lista cambia cuando se agreguen idiomas. | Que la lista venga del servidor y no quede fija en la app. |

## 5. Reproduccion y personalizacion de audio traducido

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-AUDIO-01 | Yo como usuario quiero escuchar la traduccion en un audio claro y natural, para que la otra persona entienda mi mensaje comodamente. | Las voces sinteticas suenan roboticas y pocas soportan bien todos los acentos regionales; genera costo por cada audio. | Evaluar motores de voz en F3; cache de audios ya generados. |
| HU-AUDIO-02 | Yo como usuario quiero que el audio conserve el tono del mensaje original, para no sonar plano. | Reproducir emocion en voz sintetica es dificil y depende de HU-IA-01. | Empezar con pocos tonos (formal, informal, enojo, alegria). |
| HU-AUDIO-03 | PENDIENTE: Yo como usuario quiero personalizar la voz (tono, velocidad, tipo), para sentirla mas propia. | No hay atributo ni regla en el dominio; es mas bien aspiracion futura. | Dejar fuera del MVP hasta decidir. |

## 6. Gestion de conversaciones

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-CONV-01 | Yo como usuario quiero crear una nueva conversacion, para agrupar los mensajes que intercambio con la misma persona. | Decidir cuando se considera "nueva" y manejar conversaciones vacias o abandonadas. | Crear la conversacion al enviar el primer mensaje, con nombre por defecto "Nueva Conversacion". |
| HU-CONV-02 | Yo como usuario quiero definir idioma y region destino una sola vez por conversacion, para no repetirlo en cada mensaje. | Si el usuario se equivoca debe poder cambiarlo sin perder el hilo; el origen queda fijo por Conversacion-RN-2. | Permitir cambiar destino y avisar el efecto. |
| HU-CONV-03 | Yo como usuario quiero que la app siga traduciendo cada respuesta dentro de la misma conversacion, para tener un dialogo fluido. | Mantener el contexto de mensajes anteriores sube el costo y el tamano de cada peticion al motor de IA; conexiones inestables cortan el flujo. | Enviar solo los ultimos N mensajes como contexto; reconectar automaticamente. |

## 7. Analisis de acento, tono y voz (actor: IA)

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-IA-01 | Yo como Inteligencia Artificial quiero identificar el tono y los matices del mensaje original, para aplicarlos al mensaje traducido y no entregar una traduccion plana. | Detectar emociones o ironia es subjetivo y propenso a error, sobre todo en texto sin voz. | Usar una escala simple de tonos y medir aciertos con ejemplos reales. |
| HU-IA-02 | Yo como Inteligencia Artificial quiero identificar la region o acento de origen, para configurar el contexto regional sin pedirselo al usuario. | Faltan datos de entrenamiento para muchos acentos; confundir regiones cambia el significado de la jerga. | Limitar el MVP a pocas regiones y permitir correccion manual. |

## 8. Evolucion del modelo de IA

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-EVOL-01 | Yo como usuario quiero reportar una traduccion incorrecta o poco natural, para ayudar a que el modelo mejore. | Los reportes pueden ser subjetivos, repetidos o malintencionados; y el mensaje reportado contiene datos personales. | Pedir motivo corto, anonimizar el contenido y revisar por lotes. |
| HU-EVOL-02 | PENDIENTE: ampliar idiomas y acentos y reentrenar el modelo con el feedback. | Es objetivo de roadmap, no funcionalidad de una pantalla; requiere datos, costo y tiempo. | Tratarlo como roadmap, no como historia del MVP. |

## 9. Traduccion contextual con jergas y matices culturales (actor: IA)

| ID | Historia | Problema al implementarla | Mitigacion posible |
| --- | --- | --- | --- |
| HU-CTX-01 | Yo como Inteligencia Artificial quiero identificar modismos y jerga de la region de origen, para no traducirlos de forma literal. | La jerga cambia rapido, es muy local y a veces ambigua; no existe un diccionario completo. | Glosario curado por region y mejora con reportes (HU-EVOL-01). |
| HU-CTX-02 | Yo como Inteligencia Artificial quiero reemplazar esas expresiones por su equivalente cultural en la region destino, para conservar intencion, estilo y tono del hablante. | A veces no existe equivalente exacto; reemplazar de mas puede cambiar el mensaje y generar traducciones inventadas. | Mostrar la expresion original junto a la adaptada y avisar cuando la adaptacion sea aproximada. |

---

## Resumen de los problemas mas importantes (para decirle al profesor)

1. **Latencia vs. calidad:** traducir con contexto cultural en "tiempo real" compite con la velocidad (HU-TRAD-01, HU-CONV-03).
2. **Privacidad de los datos:** se guardan mensajes y datos personales; hay que cifrarlos y definir retencion (HU-HIST-01/02, HU-EVOL-01).
3. **Calidad de la IA:** acentos, jerga y tono son subjetivos y faltan datos (HU-IA-01/02, HU-CTX-01/02).
4. **Dependencias externas y costos:** motor de voz, servicio de correo y motor de traduccion pueden fallar o costar por uso (HU-AUDIO-01, HU-PERF-04).
5. **Seguridad de cuentas:** sesiones, contrasenas y menores de edad (HU-PERF-01 a 06).
6. **Alcance:** varias funciones siguen PENDIENTES por no tener respaldo en el modelo de dominio (compartir, editar perfil, personalizar voz, ampliar idiomas).

## Pendientes

- Validar con el mentor el formato "Yo como usuario quiero ..." y las columnas de problema/mitigacion.
- Resolver los puntos PENDIENTE antes de convertirlos en REQ en `req.md`.
- Los problemas aqui listados son hipotesis de trabajo; se deben confirmar en F3 (stack tecnico).
