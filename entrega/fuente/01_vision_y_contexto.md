# 1. Vision y contexto - TalkLate

**Fase 1 - Definicion del contexto**

**Version:** 1.0 (29/10/2026)
**Fuente:** `anexos/Vision.xlsx` (plantilla de posicionamiento de Geoffrey Moore).

---

## Declaracion de Vision

> Para cualquier persona que necesita expresarse verbal o textualmente en un idioma que no
> conoce o domina, incluyendo no solo su mensaje sino tambien cualquier modismo o jerga cultural
> utilizada sin perder el significado o contexto del mismo, **TalkLate** es una aplicacion movil
> que esta disenada para ofrecer una experiencia de traduccion que va mas alla de la conversion
> literal de palabras, ya que considera el contexto, las emociones, los matices culturales y las
> intenciones detras del lenguaje, permitiendo una comunicacion mas natural y significativa.
> A diferencia de Meta Seamless, DeepL Translator, TimeKettle, Lilt y Kudo AI, nuestro producto
> se distingue por su enfoque en la **conexion profunda**, permitiendo a los usuarios expresarse
> autenticamente en otro idioma, con foco inicial en ciertas regiones y acentos especificos del
> ingles y espanol, y con una vision evolutiva para soportar con el paso del tiempo otros
> lenguajes con sus respectivos modismos y caracteristicas, sin perder la espontaneidad ni la
> riqueza de su comunicacion original.

## Desglose del posicionamiento

| Elemento | Definicion |
| --- | --- |
| **Cliente/publico objetivo** | Cualquier persona que necesita expresarse verbal o textualmente en un idioma que no conoce o domina. |
| **Necesidad / oportunidad** | Comunicar no solo el mensaje literal, sino tambien modismos o jerga cultural, sin perder significado ni contexto. |
| **Nombre del producto** | TalkLate |
| **Tipo de producto** | Aplicacion movil |
| **Beneficio principal** | Traduccion que va mas alla de la conversion literal palabra por palabra: considera contexto, emociones, matices culturales e intenciones. |
| **Alternativas existentes** | Meta Seamless, DeepL Translator, TimeKettle, Lilt, Kudo AI (a evaluar tambien: Semihuman AI). |
| **Diferenciacion principal** | "Conexion profunda": permitir a los usuarios expresarse autenticamente en otro idioma. Foco inicial en regiones y acentos especificos del ingles y espanol, con vision evolutiva hacia mas idiomas sin perder espontaneidad ni riqueza comunicativa. |

### ¿Que es una "conexion profunda"?

Es la capacidad de comunicarse con una persona o grupo que habla un idioma ajeno al propio, sin
limitarse a una comunicacion formal que impida expresarse autenticamente. TalkLate no solo
traduce palabras: interpreta jerga local, acentos y variaciones linguisticas regionales,
brindando una comunicacion mas natural y humana — culturalmente ajustada en cada interaccion
multilingue.

## Objetivos del producto (derivados del Mapa de Impacto, ver `02_mapa_de_impacto.md`)

1. Traduccion contextual en tiempo real, con claridad del contexto y del lenguaje geograficamente.
2. Traduccion que preserva tono, estilo, intencion y modismos del hablante original — evitando traducciones planas o literales.
3. Historial y gestion de conversaciones traducidas, reutilizable como recurso de aprendizaje.
4. Un modelo de IA que evoluciona con el tiempo: nuevos idiomas, acentos y capacidades, sin sacrificar calidad ni naturalidad.

## Alcance del MVP

- **Tiempo real** significa traduccion **por turno**: cada mensaje se traduce y se entrega en pocos segundos (3 segundos o menos por mensaje de texto y 5 segundos o menos por mensaje de voz, DRV-01). No es traduccion simultanea mientras la persona habla.
- **Acentos y variaciones regionales:** en el MVP la region de origen se reconoce por el **vocabulario** (por ejemplo "parce", "wey", "che") y el motor adapta los modismos a la region de destino. Reconocer el acento por el **sonido** de la voz es evolucion futura.
- **Emociones y tono:** se estima el tono del mensaje (neutral, amigable, alegre, preocupado, enojado, formal) a partir de las palabras y, en los mensajes hablados, de la voz (volumen, variacion y velocidad). La traduccion conserva ese tono y la voz de salida lo replica.
- **Voz:** la app graba el mensaje y el servidor lo transcribe con Whisper; la traduccion se escucha con una voz neuronal con emocion (VoiceStudio local, con Azure Speech u OpenAI como respaldo).
- **Idiomas:** espanol e ingles activos al inicio; frances y portugues existen en el catalogo pero inactivos (vision evolutiva).
- **Motor de IA:** Qwen corre en el **servidor** de TalkLate (no en el celular); Claude Sonnet es el respaldo.

## Objetivo medible

Ver el "Why" SMART en `02_mapa_de_impacto.md`: al cierre de la liberacion 3 (08/01/2027), 10 personas de prueba sostienen conversaciones de 10 mensajes o mas con alguien que habla otro idioma, con menos del 20 % de traducciones reportadas como malas y 3 segundos o menos por traduccion.

## Riesgos de producto

- La necesidad no es solo comunicarse: es comunicarse de forma autentica y no solo formal. El producto se mide por esa diferencia (tono, emocion y modismos), no por la traduccion literal.
- El mercado de traduccion con IA cambia rapido (Meta Seamless, DeepL, TimeKettle, Semihuman AI); la diferenciacion se sostiene en la adaptacion cultural por region.
- El foco inicial en acentos/regiones especificas de ingles y espanol implica que el MVP no cubre todos los idiomas ni todas las variantes regionales desde el dia uno; la expansion es explicitamente evolutiva, no un compromiso del lanzamiento inicial.

## Stakeholders

- **Equipo de desarrollo:** Julian David Diaz Medina, Diego Alejandro Franco Atehortua.
- **Director del trabajo de grado:** Wider Farid Sanchez Garzon.
