# Revision critica de la arquitectura - analisis de recomendaciones

**Fecha:** 23 de octubre de 2026.
**Origen:** revision critica hecha con IA en la sesion de Julian del 22/10/2026 (resumen de criterio y cuatro frentes, ver `seguimiento/bitacora.md`). Este documento analiza cada recomendacion contra el codigo real y deja una propuesta. Las decisiones finales son del equipo y, donde se indica, del mentor.

## Resumen

| Decision | Veredicto de la revision | Analisis del equipo | Estado |
| --- | --- | --- | --- |
| Monolito modular | Mantener | De acuerdo. Ahora es hexagonal (ADR-013) y responde "y si crece" sin partir el sistema | Hecho |
| Circuit Breaker (Qwen -> Claude -> reglas) | Mantener | De acuerdo, pero el tiempo de espera de Qwen (60 s) rompe DRV-01 la primera vez que falla | Ajustar el tiempo de espera |
| Repository | Mantener | De acuerdo. Ahora es un puerto formal con dos adaptadores | Hecho |
| Cifrado + JWT | Mantener, definir gestion de claves | De acuerdo. La clave no esta junto a los datos, pero falta politica de custodia, rotacion y fuerza de la clave | Proponer politica y rotacion |
| SurrealDB | Reconsiderar PostgreSQL | De acuerdo en reconsiderar; con la arquitectura hexagonal el cambio cuesta un adaptador. Decidir con el mentor | Para decidir |
| Medicion real con Qwen | Agregar ya | De acuerdo, es lo mas urgente. Ademas el glosario actual no sirve como evidencia | Prioridad 1 |
| Despliegue + metricas | Agregar | De acuerdo; es F10 y va al final de la construccion, pero las metricas se pueden adelantar | Planear |

---

## 1. Monolito modular - mantener (hecho)

- **Analisis:** correcto para dos personas y traduccion por turno: sin saltos de red (ayuda a DRV-01), una sola base de codigo y pruebas simples (DRV-08). Los microservicios pierden en los tres.
- **Que se hizo:** la recomendacion de la revision ("haz que la modularidad sea arquitectura hexagonal explicita") quedo implementada el 23/10/2026: dominio, casos de uso, puertos, adaptadores y composicion. Ver ADR-013 y `componentes.md`.
- **Para la sustentacion:** "No lo partimos en servicios; lo separamos por dentro. Cambiar la base o un motor es escribir un adaptador, sin tocar las reglas."

## 2. Circuit Breaker - mantener, con un ajuste

- **Analisis:** el patron es correcto para DRV-05: si un motor falla, se salta 60 s y se usa el siguiente. Despues de ese minuto se vuelve a probar (estado "medio abierto" implicito).
- **Hallazgo:** el tiempo de espera por defecto de Qwen es de **60 segundos** (`QWEN_TIMEOUT_MS`) y el de Claude de **30 segundos**. Si Ollama se cuelga, el primer mensaje espera hasta 60 s antes de pasar a Claude o a las reglas. Eso incumple DRV-01 (3 s p95) justo en el caso que el Circuit Breaker debe proteger.
- **Propuesta:** fijar un presupuesto de tiempo por mensaje (por ejemplo 8 s para Qwen y 5 s para Claude, ajustables) y medirlo junto con DRV-01. Talla XS.

## 3. Repository - mantener (hecho)

- **Analisis:** es lo que hace barato cambiar la base. Con ADR-013 paso de ser una convencion a ser un puerto verificado (`src/puertos/index.js`) con dos adaptadores: SurrealDB y SQLite.

## 4. Cifrado + JWT - mantener y definir la gestion de claves

- **Como esta hoy:** el contenido de los mensajes se cifra con AES-256-GCM. La clave sale de la variable `TALKLATE_CLAVE_CIFRADO`, que vive en el servidor de la API, y la base esta en SurrealDB Cloud. **Una fuga de la base sola no expone los mensajes**, porque la clave no esta en la base.
- **Riesgos reales:**
  1. Si se compromete el servidor, ahi estan la clave y las credenciales de la base.
  2. No hay rotacion: el prefijo `enc:v1:` indica el formato, no la clave usada, asi que cambiar la clave dejaria ilegibles los mensajes viejos.
  3. La clave se deriva con un solo SHA-256 de un texto: si alguien pone una frase debil, la clave es debil.
  4. El secreto del JWT tiene el mismo manejo.
- **Propuesta (talla S):**
  - Politica escrita: claves solo en el gestor de secretos del proveedor de despliegue (nunca en el repositorio ni en la base), distintas por ambiente, con un responsable y fecha de rotacion.
  - En produccion exigir una clave aleatoria de 32 bytes (en base64) y no una frase.
  - Agregar el identificador de la clave al texto cifrado (`enc:v2:<id>:...`) para rotar sin perder los mensajes viejos.
  - Para despues del MVP: cifrado por sobre (envelope) con el KMS del proveedor de nube.

## 5. SurrealDB - reconsiderar PostgreSQL (para decidir con el mentor)

- **A favor de PostgreSQL:**
  - El dominio es relacional (combinaciones unicas, relaciones muchos a muchos, cascadas).
  - Consultas parametrizadas reales, como pide `convenciones/seguridad.md`. Hoy el adaptador de SurrealDB arma el texto de la consulta con valores serializados (`lit`, `rid`); es seguro y esta probado, pero no es la forma que pide la convencion.
  - Indices y planes de consulta maduros. Hoy hay consultas que recorren enlaces sin indice.
  - Herramientas de migraciones y respaldos, y es la opcion que los jurados conocen.
  - Hay ofertas gestionadas con capa gratuita.
- **A favor de seguir con SurrealDB:**
  - Ya funciona y esta probado (CI contra SurrealDB real).
  - El equipo invirtio en el esquema en ingles (PR #30).
  - El cambio genera trabajo de nuevo.
- **Costo del cambio con la arquitectura hexagonal:** un adaptador `adaptadores/persistencia/postgres/` que cumpla el puerto `Repositorio`, mas el esquema SQL. El adaptador SQLite ya tiene casi todo el SQL. Talla L (unas 24 h de un mes de sprint). Los casos de uso y las pruebas de la API no cambian: deben pasar igual contra PostgreSQL.
- **Recomendacion:** llevarlo a la reunion con Farid como parte de la validacion de ADR-012. Si el mentor no queda conforme con la justificacion de SurrealDB, pasar a PostgreSQL como un ADR nuevo (ADR-014) que reemplace a ADR-012. No migrar antes de esa conversacion.

## 6. Medicion real con Qwen - agregar ya (prioridad 1)

- **Por que es lo mas urgente:** DRV-01 (tiempo) y DRV-02 (modismos) son la validacion de la tesis, y hoy solo hay una medicion con el motor de reglas.
- **Hallazgos en el script actual (`npm run medir`):**
  1. Los 15 casos del glosario estan dentro del diccionario del motor de reglas, por eso da 14 de 15: **esa linea base no es evidencia**, porque mide sobre los mismos datos con que se armo el motor.
  2. Usa regiones que ya no estan en el catalogo (California y Ciudad de Mexico); el alcance es Antioquia y Miami.
  3. Una sola pasada de 15 casos: el p95 de 15 datos es practicamente el maximo.
- **Propuesta (talla M):**
  - Un glosario de prueba nuevo, separado (held-out): unos 40 modismos que no esten en el diccionario de reglas ni en el prompt, solo Espanol de Colombia e Ingles de Estados Unidos (Miami), con criterio de "cultural" y "literal" escrito antes de medir.
  - 3 repeticiones por caso, descartando la primera llamada (calentamiento del modelo).
  - Registrar el equipo donde corre Ollama (CPU, GPU o Apple Silicon y RAM) y el modelo exacto.
  - Correrlo en el computador de Julian o de Diego con `ollama pull qwen2.5:7b` y guardar el resultado en `medicion_traduccion.md`.
  - Si el p95 supera 3 s con el 7B, probar un modelo mas pequeno o cuantizado y dejar la decision en ADR-004.

## 7. Despliegue + metricas - agregar (planear)

- **Analisis:** sin despliegue, la vista de despliegue es solo un diagrama y la latencia medida no es la de produccion. Segun el cronograma es F10 (cierre), pero las metricas se pueden adelantar porque ayudan a la medicion.
- **Propuesta:**
  - **Metricas (talla S):** un endpoint `/metrics` con la latencia por motor (p50/p95), los errores por motor, el estado del Circuit Breaker y los mensajes por minuto. Con la arquitectura hexagonal seria un puerto `Metricas` con un adaptador.
  - **Despliegue (talla M):** `Dockerfile` de la API y `docker-compose` con API y Ollama para reproducir el entorno. Despues, elegir proveedor segun la memoria que pida Qwen 7B (8 GB o mas) y su costo. La decision va en un ADR de despliegue.

---

## Orden propuesto

1. **Medicion real con Qwen**, con el glosario nuevo (valida la tesis; bloquea DRV-01 y DRV-02).
2. **Tiempo de espera de Qwen y gestion de claves** (pequenos; responden a lo que pidio el mentor sobre seguridad y secretos).
3. **SurrealDB o PostgreSQL**: decidir con el mentor; si se cambia, es un adaptador nuevo.
4. **Metricas y despliegue** (F10).

La arquitectura hexagonal (el cuarto frente de la revision) ya quedo hecha.
