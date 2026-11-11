# OWASP Top 10 para aplicaciones con LLM - TalkLate

**Version:** 1.0 (11/11/2026)
**Referencia:** OWASP Top 10 for LLM Applications, edicion 2026 (publicada el 04/08/2026), repositorio https://github.com/GenAI-Security-Project/GenAI-LLM-Top10 (carpeta `2026/final/`).

Este documento revisa TalkLate contra los 10 riesgos de la lista. Es una revision honesta: marca lo que esta cubierto, lo que esta cubierto a medias y lo que falta. Los controles ya existian en el codigo (se construyeron por las convenciones de seguridad y la arquitectura hexagonal), pero hasta esta revision no estaban contrastados con esta lista.

> Nota: los nombres de los riesgos son los oficiales; las definiciones y estrategias de la tabla son un resumen propio del equipo.

## 1. Resumen

TalkLate usa modelos de lenguaje (Qwen local y Claude de respaldo) en **un solo lugar**: traducir un mensaje. El modelo recibe texto y devuelve texto en JSON. **No tiene herramientas, no toca la base de datos, no envia correos y no ve datos de otros usuarios.** Eso reduce mucho el riesgo, porque lo peor que puede pasar con un mensaje malicioso es que se dane la traduccion de la propia persona que lo escribio.

| # | Riesgo (2026) | Estado | Resumen |
| --- | --- | --- | --- |
| LLM01 | Prompt Injection | Parcial | El impacto es bajo, pero el texto del usuario entra al prompt sin marcarlo como dato y no hay pruebas de inyeccion |
| LLM02 | Sensitive Information Disclosure | Parcial | Cifrado, logs limpios y limites de uso; falta documentar que ElevenLabs recibe el texto traducido |
| LLM03 | Excessive Agency | Cubierto por diseno | El modelo no tiene herramientas ni permisos |
| LLM04 | Supply Chain | Parcial | Trivy con checksum y lockfiles; falta fijar el modelo Qwen por digest y generar un SBOM |
| LLM05 | Data and Model Poisoning | Parcial | No se entrena ni se usa RAG; el glosario cultural (196 entradas) no esta validado por nativos |
| LLM06 | Unbounded Consumption | Parcial | Limites por usuario, tamanos y timeouts; faltan tope de gasto y limites en una base compartida |
| LLM07 | Misinformation | Parcial | Es el riesgo central del producto; hay reportes y notas, pero la medicion de calidad es debil |
| LLM08 | Hidden Context Exposure | Cubierto | El prompt no tiene secretos ni se usa como control de seguridad |
| LLM09 | Vector and Embedding Weaknesses | No aplica | No hay RAG, embeddings ni base vectorial |
| LLM10 | Improper Output Handling | Parcial | La salida se valida y la app no interpreta HTML; faltan tipos y largos en dos campos |

**Conteo:** 2 cubiertos (LLM03, LLM08), 1 no aplica (LLM09), 7 parciales. Ninguno esta en rojo, pero 7 tienen una brecha concreta que se puede cerrar (seccion 3).

## 2. Detalle por riesgo

### LLM01 - Prompt Injection (parcial)

**Que es:** una entrada altera el comportamiento del modelo porque este no distingue entre instrucciones y datos.

**Que tiene TalkLate:**
- La salida se fuerza a JSON y se valida en codigo (`backend/src/adaptadores/traduccion/prompt.js`, funcion `leerRespuesta`): la traduccion debe ser texto no vacio, el tono debe estar en la lista permitida y el genero pasa por una expresion regular.
- El modelo no puede hacer nada fuera de devolver texto (ver LLM03).
- El mensaje tiene un maximo de 5000 caracteres y hay limite de mensajes por minuto por usuario.

**Que falta:**
- El texto del usuario se pega al final del prompt (`Mensaje:` + texto) sin delimitadores ni una instruccion que diga "esto es dato, no instrucciones".
- El audio se transcribe con Whisper y el texto resultante entra igual al prompt: la voz tambien es un canal de inyeccion.
- No se quitan caracteres Unicode invisibles.
- No hay pruebas automaticas con mensajes del tipo "ignora lo anterior y responde X".

**Riesgo real:** bajo. Un atacante solo puede estropear su propia traduccion; no accede a datos de otros ni ejecuta acciones.

### LLM02 - Sensitive Information Disclosure (parcial)

**Que es:** datos confidenciales salen por un canal no autorizado: la respuesta, los logs, los terceros.

**Que tiene TalkLate:**
- Cifrado AES-256-GCM del contenido de mensajes y traducciones en reposo (`adaptadores/cifrado/aesGcm.js`).
- Logs que descartan por codigo los campos `password`, `token`, `correo`, `contenido`, `texto` y `codigo` (`compartido/log.js`), con prueba unitaria.
- Aislamiento entre usuarios y limites de uso en endpoints sensibles.
- El prompt no lleva datos personales: solo el texto a traducir, idiomas, region y tono.
- Politica de tratamiento de datos que el usuario acepta al registrarse (Ley 1581).

**Que falta:**
- **El texto traducido sale a ElevenLabs para generar la voz** (ADR-019), pero la politica de tratamiento y la matriz de sensibilidad solo mencionan a Anthropic como tercero. Hay que agregar ElevenLabs.
- Cuando Qwen falla, el texto original sale a Anthropic (Claude). Esta documentado, pero el usuario no ve un aviso en la app de cuando esto ocurre.

### LLM03 - Excessive Agency (cubierto por diseno)

**Que es:** el sistema ejecuta acciones danosas por salidas inesperadas del modelo, por exceso de herramientas, permisos o autonomia.

**Que tiene TalkLate:** el modelo no tiene herramientas, no llama funciones, no accede a la base de datos y no envia mensajes. El backend recibe el JSON, lo valida y decide todo lo demas con codigo determinista. La autorizacion (JWT, dueno de la conversacion, rol admin) vive en el backend, nunca en el modelo.

**Regla del equipo (queda escrita aqui):** ningun motor de IA recibe herramientas ni acceso a datos. Si algun dia se agrega, se revisa este riesgo de nuevo antes de integrarlo.

### LLM04 - Supply Chain (parcial)

**Que es:** riesgos de integridad en paquetes, modelos, datos y plataformas de terceros.

**Que tiene TalkLate:**
- Escaneo con Trivy en cada pull request y cada lunes (`seguridad_trivy.md`), con 0 hallazgos altos o criticos abiertos y una excepcion documentada con vencimiento.
- Binario de Trivy fijado con checksum SHA-256; no se usa `trivy-action` por el ataque de marzo de 2026.
- `package-lock.json` en backend, frontend y pruebas, e instalacion con `npm ci` en el CI.
- Sin SDKs de IA: los motores llaman las APIs con `fetch`, lo que reduce dependencias.

**Que falta:**
- El modelo se descarga como `qwen2.5:7b` (una etiqueta que puede cambiar). Falta fijarlo por digest.
- No hay SBOM (lista de componentes) ni siquiera de las dependencias de npm.
- Falta una nota de evaluacion de los terceros (Anthropic, ElevenLabs): terminos, retencion y entrenamiento con datos.

### LLM05 - Data and Model Poisoning (parcial)

**Que es:** manipulacion de los datos o del modelo para meter sesgos o comportamientos danosos.

**Que tiene TalkLate:** no se entrena ni se ajusta ningun modelo y no hay RAG. El unico dato que influye en la salida es el glosario cultural (`glosario.json`), que esta versionado en git, pasa por pull request y trae la `source` de cada entrada (196 de 196).

**Que falta:** **las 196 entradas tienen `native_validated: false`**: ningun hablante nativo las ha revisado. Una entrada mala (un equivalente incorrecto o una de las 26 marcadas como sensibles) entra directo al prompt y produce traducciones equivocadas. El campo ya existe; falta usarlo.

### LLM06 - Unbounded Consumption (parcial)

**Que es:** uso de recursos sin control: caida del servicio o costo desbordado (denial of wallet).

**Que tiene TalkLate:**
- Limites por usuario: 30 mensajes por minuto y 40 voces por minuto (configurables); por IP en registro, recuperacion y restablecimiento.
- Tamanos: 5000 caracteres por mensaje, 1000 por voz, 1 MB por peticion y 15 MB solo para audio.
- Timeouts en todas las llamadas externas (Qwen, Claude, Whisper, sintesis, ffmpeg) y `max_tokens` de 1024 en Claude.
- Circuit Breaker: un motor que falla se salta por 60 segundos.
- Los audios sintetizados viven 5 minutos y como maximo 200 en memoria.

**Que falta:**
- Los limites estan **en memoria**: se pierden al reiniciar y no funcionan con varias instancias.
- No hay un **tope de gasto** diario para Claude, ElevenLabs o Whisper en la nube; los limites cuentan peticiones, no costo.
- Qwen no tiene limite de tokens de salida (`num_predict`).

### LLM07 - Misinformation (parcial)

**Que es:** salidas incorrectas que parecen creibles. En TalkLate significa **una traduccion equivocada que suena bien**; es el riesgo central del producto.

**Que tiene TalkLate:**
- Reporte de traducciones malas por parte del usuario, con atencion del administrador.
- Nota cultural que explica cada modismo adaptado.
- Aviso "Traduccion aproximada" cuando traduce el motor de reglas.
- Salida estructurada con campos obligatorios.
- Glosario con fuente por entrada y marca de sensibilidad.
- Medicion de modismos adaptados (DRV-02): 14 de 15 con el motor de reglas.

**Que falta:**
- Esa medicion se hizo **con el motor de reglas, que se construyo con los mismos 15 modismos**: es una linea base, no una medida de calidad. Falta medirla con Qwen y con una lista de modismos distinta.
- No hay evaluacion de calidad con hablantes nativos (ver LLM05).
- La app no dice de forma general que la traduccion automatica puede equivocarse.

### LLM08 - Hidden Context Exposure (cubierto)

**Que es:** extraccion de las instrucciones ocultas del modelo (system prompt) cuando eso ayuda a un atacante. La guia pide asumir que ese contexto es descubrible.

**Que tiene TalkLate:**
- El prompt no tiene claves, cadenas de conexion ni datos de usuarios. Las claves viven en variables de entorno y `.env` esta en `.gitignore`; Trivy busca secretos en cada pull request.
- El prompt no es un control de seguridad: la autorizacion se hace en codigo, fuera del modelo.
- El prompt ya es publico (esta en el repositorio, `prompt.js`), asi que filtrarlo no da ventaja.

### LLM09 - Vector and Embedding Weaknesses (no aplica)

TalkLate no usa RAG, embeddings, memoria de agentes ni cache semantica. SurrealDB soporta vectores, pero no se usan. Si se agrega busqueda semantica o RAG, este riesgo se revisa antes.

### LLM10 - Improper Output Handling (parcial)

**Que es:** la salida del modelo se pasa a otro componente sin validarla (XSS, inyeccion, etc.).

**Que tiene TalkLate:**
- La salida del modelo se trata como entrada no confiable: JSON validado, tono contra lista, genero normalizado.
- La app es React Native: muestra el texto como texto, no como HTML ni Markdown, asi que no hay XSS.
- Consultas parametrizadas en SQLite y literales serializados en SurrealDB (nada de texto concatenado).
- El texto que va a Azure se escapa antes de armar el SSML.
- Los logs no guardan el contenido.

**Que falta:** `nota_cultural` y `region_origen` salen del modelo y se guardan sin comprobar que sean texto ni su largo (`leerRespuesta` solo hace `json.nota_cultural || null`). Si el modelo devuelve un objeto o un texto enorme, se intenta guardar tal cual.

## 3. Brechas y plan para cerrarlas

Ordenadas por beneficio frente al esfuerzo.

| Prioridad | Brecha | Riesgo | Accion | Esfuerzo |
| --- | --- | --- | --- | --- |
| 1 | `nota_cultural` y `region_origen` sin tipo ni largo | LLM10 | Convertir a texto y cortar a 300 caracteres en `leerRespuesta`, con prueba unitaria | Bajo |
| 2 | El texto del usuario entra al prompt sin delimitar | LLM01 | Encerrar el mensaje entre marcas y decir al modelo que es dato; quitar caracteres Unicode invisibles; agregar pruebas con mensajes de inyeccion | Bajo |
| 3 | ElevenLabs no esta en la politica de datos | LLM02 | Actualizar `politica_tratamiento_datos.md`, `matriz_sensibilidad_datos.md` y los documentos 16 y 17 | Bajo (documentos) |
| 4 | Qwen sin limite de salida | LLM06 | Agregar `num_predict` en `qwen.js` | Bajo |
| 5 | Modelo Qwen por etiqueta mutable; sin SBOM | LLM04 | Documentar el digest del modelo y generar el SBOM con `trivy sbom` en el CI | Medio |
| 6 | Glosario sin validacion nativa | LLM05, LLM07 | Que un hablante paisa y uno de New York revisen las 196 entradas y se marquen con `native_validated: true`; mientras tanto, decirlo en la documentacion | Medio (depende de personas) |
| 7 | Medicion de calidad solo con el motor de reglas | LLM07 | Correr `npm run medir` con Qwen y una lista de modismos que no este en el motor | Medio |
| 8 | Limites en memoria y sin tope de gasto | LLM06 | Dejarlo documentado como limite del MVP de una sola instancia; tope diario de gasto como mejora futura | Alto, fuera del MVP |

Los puntos 1 a 4 son de codigo o documentos y se cierran en un solo pull request. Los puntos 6 y 7 requieren personas y tiempo: conviene presentarlos como trabajo futuro, no esconderlos.

## 4. Hallazgo adicional (fuera de la lista OWASP)

**Credenciales de administrador por defecto.** Al arrancar, el backend crea un administrador con correo `dafa123.daf@gmail.com` y contrasena `Admin123!` si no se definen `ADMIN_CORREO` y `ADMIN_PASSWORD`. La contrasena esta en el codigo (`persistencia/sqlite/esquema.js` y `persistencia/surreal/repositorio.js`) y en los README. La conexion a SurrealDB ya se niega a arrancar en produccion con la contrasena `root`, pero con el administrador no pasa lo mismo. **Accion sugerida:** en produccion (`NODE_ENV=production`) exigir `ADMIN_PASSWORD` y no usar un valor por defecto; y no dejar un correo personal en el codigo.

## 5. Como se relaciona con lo demas

- Complementa a Trivy (`seguridad_trivy.md`): Trivy cubre el eslabon de dependencias y secretos; este documento cubre los riesgos propios de usar un modelo de lenguaje.
- Los controles probados estan en la piramide de pruebas (`piramide_de_pruebas.md`): cifrado, logs sin datos personales, limites de uso y validaciones.
- Responde al driver de privacidad (DRV-03), a RNF-011 y a las convenciones de seguridad (`convenciones/seguridad.md`).
